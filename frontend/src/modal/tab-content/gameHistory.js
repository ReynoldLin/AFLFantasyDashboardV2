import { scoreColour, togColour, gamesColour, qtrScoreColour, cbaColour, getTeamColour } from "../../helpers/colourCoding"

const year = 2026
const summaryCell = { padding: '10px 12px', textAlign: 'center' }
const cellStyle = { padding: '9px 10px', textAlign: 'center' }
const YEAR_SUMMARY_HEADERS = ['Year', 'GM', 'Avg', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', '']
const GAME_ROW_HEADERS = ['Rd', 'Opp', 'Score', 'TOG%', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', 'CBA%', 'KI', 'RC%', '']

function calcFantasyScore(g) {
  return (
    g.kicks * 3 +
    g.handballs * 2 +
    g.marks * 3 +
    g.tackles * 4 +
    g.freesFor * 1 +
    g.freesAgainst * -3 +
    g.hitouts * 1 +
    g.goals * 6 +
    g.behinds * 1
  )
}

function SeasonSummaryRow({ label, games, avg, stats, isExpanded, onToggle }) {
    return (
        <tr onClick={onToggle} style={{ cursor: 'pointer', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{label}</td>
        <td style={{ ...summaryCell, fontWeight: 700 }}>
            <span style={{ ...gamesColour(games), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 32 }}>
            {games}
            </span>
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>
            <span style={{ ...scoreColour(parseFloat(avg)), textAlign: 'center', borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
            {parseFloat(avg).toFixed(1)}
            </span>
        </td>
        {['disposals','kicks','handballs','marks','tackles','freesFor','freesAgainst','hitouts','goals','behinds'].map(k => (
            <td key={k} style={summaryCell}>{typeof stats[k] === 'number' ? stats[k].toFixed(1) : stats[k]}</td>
        ))}
        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</td>
        </tr>
    )
}

function GameRow({ roundNumber, opponentId, score, tog, stats, dfs, gameKey, expandedGame, setExpandedGame, colSpan }) {
    const isExpanded = expandedGame.has(gameKey)
    return (
        <>
            <tr
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setExpandedGame(prev => {
                    const next = new Set(prev)
                    next.has(gameKey) ? next.delete(gameKey) : next.add(gameKey)
                    return next
                })}
            >
                <td style={cellStyle}>{roundNumber}</td>
                <td style={cellStyle}>
                    {opponentId && <img src={`/logos/${opponentId}.svg`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.visibility = 'hidden'} />}
                </td>
                <td style={{ ...cellStyle, fontWeight: 700 }}>
                    <span style={{ ...scoreColour(score), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                        {score}
                    </span>
                </td>
                <td style={{ ...cellStyle, fontWeight: 700 }}>
                    <span style={{ ...togColour(tog), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                        {tog}%
                    </span>
                </td>
                <td style={cellStyle}>{stats.disposals}</td>
                <td style={cellStyle}>{stats.kicks}</td>
                <td style={cellStyle}>{stats.handballs}</td>
                <td style={cellStyle}>{stats.marks}</td>
                <td style={cellStyle}>{stats.tackles}</td>
                <td style={cellStyle}>{stats.freesFor}</td>
                <td style={cellStyle}>{stats.freesAgainst}</td>
                <td style={cellStyle}>{stats.hitouts}</td>
                <td style={cellStyle}>{stats.goals}</td>
                <td style={cellStyle}>{stats.behinds}</td>
                <td style={{...cellStyle, fontWeight: 700}}>
                    <span style={{ ...cbaColour(dfs?.centreBounceAttendancePercentage), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                        {dfs?.centreBounceAttendancePercentage ?? '—'}%
                    </span>
                </td>
                <td style={cellStyle}>{dfs?.kickins ?? '—'}</td>
                <td style={cellStyle}>{dfs?.ruckContestPercentage ?? '—'}%</td>
                <td style={{ ...cellStyle, color: 'var(--muted)', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</td>
            </tr>
            {isExpanded && (
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <td colSpan={colSpan} style={{ padding: '8px 16px' }}>
                    <QuarterBreakdown dfs={dfs} />
                </td>
                </tr>
            )}
        </>
    )
}

function QuarterBreakdown({ dfs }) {
  if (!dfs) return null
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>
        Quarter-by-Quarter Breakdown
      </div>
    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: 'auto' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['', 'Score', 'TOG%', 'CBA%'].map(h => (
            <th key={h} style={{ padding: '4px 16px', textAlign: h ? 'center' : 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4].map(q => (
          <tr key={q}>
            <td style={{ padding: '4px 16px', fontWeight: 600 }}>Q{q}</td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...qtrScoreColour(dfs[`dt_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                {dfs[`dt_${q}`] ?? '—'}
              </span>
            </td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...togColour(dfs[`tog_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                {dfs[`tog_${q}`] ?? '—'}%
              </span>
            </td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...cbaColour(dfs[`cba_att_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                {dfs[`cba_att_${q}`] ?? '—'}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}

export function GameHistory({
    selectedPlayer, 
    gameStatsLoading, 
    gameStats,
    dfsSummary,
    rounds,
    playerHistory,
    expanded,
    setExpanded,
    expandedGame,
    setExpandedGame,
    expandedYear,
    setExpandedYear }) {

    if (gameStatsLoading && !gameStats) return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            Loading...
        </div>
    )

    // Helpers

    const squadId = selectedPlayer.squadId
    const playedGames = gameStats || []
    const dfsGames = dfsSummary?.combinedGames || []

    const avg = playedGames.length > 0 ? 
    (playedGames.reduce((sum, g) => sum + calcFantasyScore(g), 0) / playedGames.length).toFixed(1)
    : '—'

    const statAvg = key => {
        if (!gameStats || gameStats.length === 0) return '—'
        return (gameStats.reduce((sum, g) => sum + (g[key] || 0), 0) / gameStats.length).toFixed(1)
    }

    const allRounds = Object.values(rounds).sort((a, b) => a.roundNumber - b.roundNumber)

    const rows = allRounds.map(r => {
        const rn = r.roundNumber
        const isBye = r.byeSquads.includes(squadId)
        const game = playedGames.find(g => g.roundNumber === rn)
        const opponentId = r.fixture[String(squadId)]
        const squadPlayed = r.squadsPlayed.includes(squadId)

        if (game) return { type: 'played', rn, game, opponentId }
        else if (isBye) return { type: 'bye', rn }
        else if (r.status === 'scheduled') return { type: 'upcoming', rn, opponentId }
        else if (r.status === 'completed' && squadPlayed) return { type: 'dnp', rn, opponentId }
        else if (r.status === 'playing') return { type: 'upcoming', rn, opponentId }
        else return null
    }).filter(Boolean)

    const historicalYears = playerHistory ? [...playerHistory].reverse() : []

    function getDfsGame(roundNumber, yr) {
        return dfsGames.find(g => parseInt(g.round) === roundNumber && g.year === String(yr))
    }

    return (
        <div style={{ marginLeft: 6, marginRight: 6 }}>

            {/* Expand buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                    onClick={() => {
                        setExpanded(!expanded)
                        setExpandedYear(prev =>
                            prev.size === historicalYears.length ? new Set() : new Set(historicalYears.map(s => s.year)))
                    }}
                    style={{ 
                        padding: '5px 12px', 
                        borderRadius: 6, 
                        border: '1px solid var(--border)', 
                        background: 'var(--surface2)',
                        cursor: 'pointer', 
                        fontSize: 12,
                        fontWeight: 700
                    }}
                >
                    Expand All Years
                </button>

                <button
                    onClick={() => {
                        const allGameKeys = new Set()
                        rows.forEach(row => {
                            if (row.type === 'played') allGameKeys.add(`2026-${row.rn}`)
                        })
                        historicalYears.forEach(season => {
                            season.games.forEach(g => allGameKeys.add(`${season.year}-${g.roundNumber}`))
                        })
                        setExpandedGame(prev =>
                            prev.size === allGameKeys.size ? new Set() : allGameKeys
                        )
                    }}
                    disabled={!expanded && expandedYear.size === 0}
                    style={{ 
                        padding: '5px 12px',
                        borderRadius: 6, 
                        border: '1px solid var(--border)', 
                        background: 'var(--surface2)', 
                        cursor: !expanded && expandedYear.size === 0 ? 'not-allowed' : 'pointer', 
                        fontSize: 12,
                        fontWeight: 700,
                        opacity: !expanded && expandedYear.size === 0 ? 0.4 : 1
                    }}
                >
                    Expand All Games
                </button>
            </div>

            <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: 13, 
                border: '1px solid var(--border)', 
                borderRadius: '8px 8px 0 0', 
                overflow: 'hidden' 
            }}>
                <thead>
                    <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {YEAR_SUMMARY_HEADERS.map((h, i) => (
                            <th key={i} style={{ 
                                padding: '10px 12px', 
                                textAlign: i === 0 ? 'left' : 'center', 
                                color: 'var(--muted)', 
                                fontWeight: 600 }}>{h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>

                    {/* ── 2026 ── */}
                    <SeasonSummaryRow
                        label={year}
                        games={playedGames.length}
                        avg={avg}
                        stats={{
                            disposals: parseFloat(statAvg('disposals')),
                            kicks: parseFloat(statAvg('kicks')),
                            handballs: parseFloat(statAvg('handballs')),
                            marks: parseFloat(statAvg('marks')),
                            tackles: parseFloat(statAvg('tackles')),
                            freesFor: parseFloat(statAvg('freesFor')),
                            freesAgainst: parseFloat(statAvg('freesAgainst')),
                            hitouts: parseFloat(statAvg('hitouts')),
                            goals: parseFloat(statAvg('goals')),
                            behinds: parseFloat(statAvg('behinds')),
                        }}
                        isExpanded={expanded}
                        onToggle={() => setExpanded(e => !e)}
                    />

                    {expanded && (
                        <>
                            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                                {GAME_ROW_HEADERS.map(h => (
                                    <td key={h} style={{ ...cellStyle, color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{h}</td>
                                ))}
                            </tr>
                            {rows.map(row => {
                                if (row.type === 'played') {
                                    const g = row.game
                                    return (
                                    <GameRow
                                        key={row.rn}
                                        roundNumber={row.rn}
                                        opponentId={row.opponentId}
                                        score={calcFantasyScore(g)}
                                        tog={g.timeOnGround}
                                        stats={{ 
                                            disposals: g.disposals, 
                                            kicks: g.kicks, 
                                            handballs: g.handballs, 
                                            marks: g.marks, 
                                            tackles: g.tackles, 
                                            freesFor: g.freesFor, 
                                            freesAgainst: g.freesAgainst, 
                                            hitouts: g.hitouts, 
                                            goals: g.goals, 
                                            behinds: g.behinds 
                                        }}
                                        dfs={getDfsGame(row.rn, 2026)}
                                        gameKey={`2026-${row.rn}`}
                                        expandedGame={expandedGame}
                                        setExpandedGame={setExpandedGame}
                                        colSpan={18}
                                    />
                                    )
                                }
                                if (row.type === 'bye') return (
                                    <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)', opacity: 0.5, background: 'var(--surface2)' }}>
                                        <td style={cellStyle}>{row.rn}</td>
                                        <td style={cellStyle}><div style={{ width: 24, height: 24 }} /></td>
                                        <td colSpan={16} style={{ ...cellStyle, textAlign: 'center' }}>
                                            <span style={{ fontSize: 11, background: '#9de7d6', color: '#022e24', borderRadius: 4, padding: '1px 8px' }}>BYE</span>
                                        </td>
                                    </tr>
                                )
                                if (row.type === 'dnp') return (
                                    <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)', opacity: 0.5, background: 'var(--surface2)' }}>
                                        <td style={cellStyle}>{row.rn}</td>
                                        <td style={cellStyle}>
                                            {row.opponentId && <img src={`/logos/${row.opponentId}.svg`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.visibility = 'hidden'} />}
                                        </td>
                                        <td colSpan={16} style={{ ...cellStyle, textAlign: 'center' }}>
                                            <span style={{ fontSize: 11, background: '#fde8e8', color: 'var(--danger)', borderRadius: 4, padding: '1px 8px' }}>DNP</span>
                                        </td>
                                    </tr>
                                )
                                if (row.type === 'upcoming') return (
                                    <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)', opacity: 0.5, background: 'var(--surface2)' }}>
                                        <td style={cellStyle}>{row.rn}</td>
                                        <td style={cellStyle}>
                                            {row.opponentId && <img src={`/logos/${row.opponentId}.svg`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.visibility = 'hidden'} />}
                                        </td>
                                        <td colSpan={16} />
                                    </tr>
                                )
                                return null
                            })}
                        </>
                    )}

                    {/* ── Historical years ── */}
                    {historicalYears.map(season => (
                        <>
                            <SeasonSummaryRow
                                key={season.year}
                                label={season.year}
                                games={season.games_played}
                                avg={season.avg}
                                stats={{
                                    disposals: season.disposals,
                                    kicks: season.kicks,
                                    handballs: season.handballs,
                                    marks: season.marks,
                                    tackles: season.tackles,
                                    freesFor: season.frees_for,
                                    freesAgainst: season.frees_against,
                                    hitouts: season.hitouts,
                                    goals: season.goals,
                                    behinds: season.behinds,
                                }}
                                isExpanded={expandedYear.has(season.year)}
                                onToggle={() => setExpandedYear(prev => {
                                    const next = new Set(prev)
                                    next.has(season.year) ? next.delete(season.year) : next.add(season.year)
                                    return next
                                })}
                            />

                            {expandedYear.has(season.year) && (
                                <>
                                    <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                                        {GAME_ROW_HEADERS.map(h => (
                                            <td key={h} style={{ ...cellStyle, color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{h}</td>
                                        ))}
                                    </tr>
                                    {season.games.map(g => (
                                        <GameRow
                                            key={g.roundNumber}
                                            roundNumber={g.roundNumber}
                                            opponentId={g.opponentSquadId}
                                            score={g.score}
                                            tog={g.timeOnGround}
                                            stats={{ 
                                                disposals: g.disposals, 
                                                kicks: g.kicks, handballs: 
                                                g.handballs, marks: g.marks, 
                                                tackles: g.tackles, 
                                                freesFor: g.freesFor, 
                                                freesAgainst: g.freesAgainst, 
                                                hitouts: g.hitouts, 
                                                goals: g.goals, 
                                                behinds: g.behinds 
                                            }}
                                            dfs={getDfsGame(g.roundNumber, season.year)}
                                            gameKey={`${season.year}-${g.roundNumber}`}
                                            expandedGame={expandedGame}
                                            setExpandedGame={setExpandedGame}
                                            colSpan={18}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    )
}