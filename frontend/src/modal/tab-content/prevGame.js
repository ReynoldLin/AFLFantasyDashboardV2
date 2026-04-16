import { scoreColour, togColour, cbaColour } from "../../helpers/colourCoding"
import { calcFantasyScore, cellStyle, QuarterBreakdown } from "./gameHistory"

const GAME_ROW_HEADERS = ['Rd', 'Opp', 'Score', 'TOG%', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', 'CBA%', 'KI', 'RC%']

export function PrevGame({selectedPlayer, gameStats, gameStatsLoading, dfsSummary, rounds}) {
    if (gameStatsLoading && !gameStats) return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
    )

    if (!gameStats || gameStats.length === 0) return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No games played yet.</div>
    )

    const prevGameStats = [...gameStats].sort((a, b) => b.roundNumber - a.roundNumber)[0]
    const roundData = Object.values(rounds).find(r => r.roundNumber === prevGameStats.roundNumber)
    const opponentId = roundData?.fixture[String(selectedPlayer.squadId)]

    const dfsGames = dfsSummary?.combinedGames || []
    const dfs = dfsGames.find(g => parseInt(g.round) === prevGameStats.roundNumber && g.year === '2026')

    const score = calcFantasyScore(prevGameStats)

    function getDfsGame(roundNumber, yr) {
        return dfsGames.find(g => parseInt(g.round) === roundNumber && g.year === String(yr))
    }

    return (
        <>
        <table>
            <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    {GAME_ROW_HEADERS.map(h => (
                        <td key={h} style={{ ...cellStyle, color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{h}</td>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={cellStyle}>{roundData.roundNumber}</td>
                    <td style={cellStyle}>
                        <img 
                            src={`/logos/${opponentId}.svg`} 
                            alt="" 
                            style={{ width: 24, height: 24, objectFit: 'contain' }} 
                            onError={e => e.target.style.visibility = 'hidden'} 
                        />
                    </td>
                    <td style={{...cellStyle, fontWeight:700}}>
                        <span style={{ ...scoreColour(score), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                            {score}
                        </span>
                    </td>
                    <td style={{...cellStyle, fontWeight:700}}>
                        <span style={{ ...togColour(prevGameStats.timeOnGround), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                            {prevGameStats.timeOnGround}%
                        </span>
                    </td>
                    <td style={cellStyle}>{prevGameStats.disposals}</td>
                    <td style={cellStyle}>{prevGameStats.kicks}</td>
                    <td style={cellStyle}>{prevGameStats.handballs}</td>
                    <td style={cellStyle}>{prevGameStats.marks}</td>
                    <td style={cellStyle}>{prevGameStats.tackles}</td>
                    <td style={cellStyle}>{prevGameStats.freesFor}</td>
                    <td style={cellStyle}>{prevGameStats.freesAgainst}</td>
                    <td style={cellStyle}>{prevGameStats.hitouts}</td>
                    <td style={cellStyle}>{prevGameStats.goals}</td>
                    <td style={cellStyle}>{prevGameStats.behinds}</td>
                    <td style={{...cellStyle, fontWeight:700}}>
                        <span style={{ ...cbaColour(dfs?.centreBounceAttendancePercentage), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                            {dfs?.centreBounceAttendancePercentage}%
                        </span>
                    </td>
                    <td style={cellStyle}>{dfs?.kickins}</td>
                    <td style={cellStyle}>{dfs?.ruckContestPercentage}%</td>
                </tr>
            </tbody>
        </table>
        <div style={{padding: '8px 16px', background: 'var(--surface2)'}}>
            <QuarterBreakdown
                dfs={dfs}/>
        </div>
        </>
    )
}