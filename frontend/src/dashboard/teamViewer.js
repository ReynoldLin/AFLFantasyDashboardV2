import { useState, useEffect } from 'react'
import { fetchTeam, fetchPlayers } from '../api'
import { PlayerCard } from './playerCard'
import { POS_COLOURS } from '../helpers/colourCoding'

const POSITION_ORDER = ['DEF', 'MID', 'RUC', 'FWD']

// How many lineup columns per position
const LINEUP_COLS = {
    DEF: 3,
    MID: 4,
    RUC: 2,
    FWD: 3,
}

export function Team({ rounds, onPlayerClick }) {
    const [team, setTeam] = useState(null)
    const [playerDataMap, setPlayerDataMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([fetchTeam(117), fetchPlayers()])
            .then(([teamData, playersData]) => {
                setTeam(teamData.success.team)
                const map = {}
                playersData.players.forEach(p => { map[p.id] = p })
                setPlayerDataMap(map)
            })
            .catch(() => setError('Failed to load team'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>
    if (error)   return <div style={{ padding: 32, color: 'var(--danger)' }}>{error}</div>

    const {
        teamName, roundPoints, totalPoints, roundRank, overallRank,
        lineup, bench, captainId, viceCaptainId, utilityId
    } = team

    const renderPlayerCard = (id = false) => (
        <PlayerCard
            key={id}
            id={id}
            playerDataMap={playerDataMap}
            captainId={captainId}
            viceCaptainId={viceCaptainId}
            onPlayerClick={onPlayerClick}
        />
    )

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', color: 'var(--text)' }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 12 }}>{teamName}</h2>
                <div className="stat-badges">
                    {[
                        { label: 'Round Points',  value: roundPoints },
                        { label: 'Total Points',  value: totalPoints },
                        { label: 'Round Rank',    value: `#${roundRank.toLocaleString()}` },
                        { label: 'Overall Rank',  value: `#${overallRank.toLocaleString()}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="stat-badge-bg-team">
                            <div className="stat-badge-title">{label}</div>
                            <div className="stat-badge-data">{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Position rows — each row has a lineup grid + bench column side-by-side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 1080 }}>
                {POSITION_ORDER.map(pos => {
                    const cols      = LINEUP_COLS[pos]
                    const lineupIds = lineup[pos] ?? []
                    const benchIds  = bench[pos]  ?? []

                    return (
                        <div
                            key={pos}
                            style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}
                        >
                            {/* Position label */}
                            <div style={{
                                background: POS_COLOURS[pos],
                                padding: '6px 12px',
                                fontWeight: 700,
                                fontSize: 13,
                            }}>
                                {pos}
                            </div>

                            {/* Lineup + Bench side by side */}
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>

                                {/* Lineup grid */}
                                <div style={{
                                    flex: 1,
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    justifyItems: 'center',
                                    gap: 8,
                                    padding: 8,
                                }}>
                                    {lineupIds.map(id => renderPlayerCard(id, false))}
                                </div>

                                {/* Bench column — only rendered when there are bench players for this pos */}
                                {benchIds.length > 0 && (
                                    <div style={{
                                        borderLeft: '1px solid var(--border, rgba(255,255,255,0.08))',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                        padding: 8,
                                        minWidth: 0,
                                    }}>
                                    {benchIds.map(id => renderPlayerCard(id, true))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Utility — sits in its own row at the bottom, bench-column-aligned */}
                <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1 }} />
                    <div style={{
                        background: 'var(--surface)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        borderLeft: '1px solid var(--border, rgba(255,255,255,0.08))',
                    }}>
                        <div style={{
                            background: 'var(--muted)',
                            padding: '6px 12px',
                            fontWeight: 700,
                            fontSize: 13,
                        }}>
                            UTILITY
                        </div>
                        <div style={{ padding: 8 }}>
                            {renderPlayerCard(utilityId, true)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}