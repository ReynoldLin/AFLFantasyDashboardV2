import { useState, useEffect } from 'react'
import { fetchTeam, fetchPlayers } from '../api'
import { PlayerCard } from './playerCard'

export function Team() {
    const [team, setTeam] = useState(null)
    const [playerDataMap, setPlayerDataMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([fetchTeam(117), fetchPlayers()])
            .then(([teamData, playersData]) => {
                setTeam(teamData.success.team)
                const map = {}
                playersData.players.forEach(p => {
                    map[p.id] = p
                })
                setPlayerDataMap(map)
            })
            .catch(() => setError('Failed to load team'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>
    if (error)   return <div style={{ padding: 32, color: 'var(--danger)' }}>{error}</div>

    const {
        teamName, roundPoints, totalPoints, overallRank,
        lineup, bench, captainId, viceCaptainId, utilityId
    } = team

    const positionColour = { DEF: '#4a90d9', MID: '#7ed321', RUC: '#f5a623', FWD: '#e05c5c' }

    const renderPlayers = (ids, dimmed = false) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
            {ids.map(id => (
                <PlayerCard
                    key={id}
                    id={id}
                    playerDataMap={playerDataMap}
                    captainId={captainId}
                    viceCaptainId={viceCaptainId}
                    dimmed={dimmed}
                />
            ))}
        </div>
    )

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', color: 'var(--text)' }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>{teamName}</h2>
                <div style={{ display: 'flex', gap: 32, marginTop: 8, color: 'var(--muted)', fontSize: 14 }}>
                    <span>Round Points: <strong style={{ color: 'var(--text)' }}>{roundPoints}</strong></span>
                    <span>Total Points: <strong style={{ color: 'var(--text)' }}>{totalPoints}</strong></span>
                    <span>Overall Rank: <strong style={{ color: 'var(--text)' }}>#{overallRank.toLocaleString()}</strong></span>
                </div>
            </div>

            {/* Lineup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(lineup).map(([pos, ids]) => (
                    <div key={pos} style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ background: positionColour[pos], padding: '6px 12px', fontWeight: 700, fontSize: 13 }}>
                            {pos}
                        </div>
                        {renderPlayers(ids)}
                    </div>
                ))}

                {/* Bench */}
                <div style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--muted)', padding: '6px 12px', fontWeight: 700, fontSize: 13 }}>
                        BENCH
                    </div>
                    {renderPlayers(Object.values(bench).flat(), true)}
                </div>

                {/* Utility */}
                <div style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: '#9b59b6', padding: '6px 12px', fontWeight: 700, fontSize: 13 }}>
                        UTILITY
                    </div>
                    {renderPlayers([utilityId], true)}
                </div>
            </div>
        </div>
    )
}