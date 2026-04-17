import { useState, useEffect } from 'react'
import { fetchTeam, fetchPlayers } from '../api'

export function Team() {
    const [team, setTeam] = useState(null)
    const [playerMap, setPlayerMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([fetchTeam(117), fetchPlayers()])
            .then(([teamData, playersData]) => {
                setTeam(teamData.success.team)
                const map = {}
                playersData.players.forEach(p => {
                    map[p.id] = `${p.firstName} ${p.lastName}`
                })
                setPlayerMap(map)
            })
            .catch(() => setError('Failed to load team'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>
    if (error)   return <div style={{ padding: 32, color: 'var(--danger)' }}>{error}</div>

    const { teamName, roundPoints, totalPoints, overallRank, lineup, bench, captainId, viceCaptainId } = team

    const positionColour = { DEF: '#4a90d9', MID: '#7ed321', RUC: '#f5a623', FWD: '#e05c5c' }

    const renderPlayers = (ids) => ids.map(id => {
        const name = playerMap[id] || `ID ${id}`
        const isCap  = id === captainId
        const isVice = id === viceCaptainId
        return (
            <div key={id} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{name}</span>
                {isCap  && <span style={{ color: 'gold', fontSize: 12 }}>C</span>}
                {isVice && <span style={{ color: 'silver', fontSize: 12 }}>VC</span>}
            </div>
        )
    })

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: 'var(--text)' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {Object.entries(lineup).map(([pos, ids]) => (
                    <div key={pos} style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ background: positionColour[pos], padding: '6px 10px', fontWeight: 700, fontSize: 13 }}>
                            {pos}
                        </div>
                        {renderPlayers(ids)}
                    </div>
                ))}

                {/* Bench */}
                <div style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--muted)', padding: '6px 10px', fontWeight: 700, fontSize: 13 }}>
                        BENCH
                    </div>
                    {Object.values(bench).flat().map(id => (
                        <div key={id} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                            {playerMap[id] || `ID ${id}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}