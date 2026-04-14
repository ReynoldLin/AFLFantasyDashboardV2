import { useState, useEffect, useCallback } from 'react'
import { fetchPlayers, fetchPlayerGameStats, fetchPlayerHistory, fetchDFSSummary, fetchRounds } from './api'
import './App.css'
import { TEAM_COLOURS, POS_COLOURS, scoreColour, qtrScoreColour, gamesColour, togColour, cbaColour, priceChangeColour } from './helpers/colourCoding'
import { PlayerTable } from './dashboard/playerDashboard'

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

function getTeamColour(squadId) {
  return TEAM_COLOURS[squadId] || { primary: 'var(--accent)', secondary: '#ffffff' }
}

export function PosBadge({ positions }) {
  if (positions.length === 1) {
    return (
      <span className="pos-badge" style={{ background: POS_COLOURS[positions[0]] }}>
        {positions[0]}
      </span>
    )
  }
  if (positions.length === 2) {
    const c1 = POS_COLOURS[positions[0]]
    const c2 = POS_COLOURS[positions[1]]
    return (
      <span className="pos-badge" style={{ background: `linear-gradient(125deg, ${c1} 50%, ${c2} 50%)` }}>
        {positions.join('/')}
      </span>
    )
  }
  if (positions.length >= 3) {
    const c1 = POS_COLOURS[positions[0]]
    const c2 = POS_COLOURS[positions[1]]
    const c3 = POS_COLOURS[positions[2]]
    return (
      <span className="pos-badge" style={{ background: `linear-gradient(125deg, ${c1} 33%, ${c2} 33%, ${c2} 66%, ${c3} 66%)` }}>
        {positions.join('/')}
      </span>
    )
  }
}

// Shared sub-row headers
const GAME_ROW_HEADERS = ['Rd', 'Opp', 'Score', 'TOG%', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', 'CBA%', 'KI', 'RC%', '']

// Quarter breakdown table
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

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null) // shared
  const [activeTab, setActiveTab] = useState('gameHistory') // shared
  const [expanded, setExpanded] = useState(false) // shared
  const [gameStats, setGameStats] = useState(null)
  const [gameStatsLoading, setGameStatsLoading] = useState(false)
  const [rounds, setRounds] = useState({}) // playerDashboard
  const [playerHistory, setPlayerHistory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(new Set()) // shared
  const [dfsSummary, setDfsSummary] = useState(null)
  const [expandedGame, setExpandedGame] = useState(new Set()) // shared

   useEffect(() => {
    if (!selectedPlayer) return
    const load = () => {
      setGameStatsLoading(true)
      fetchPlayerGameStats(selectedPlayer.id)
        .then(setGameStats)
        .catch(() => setGameStats(null))
        .finally(() => setGameStatsLoading(false))
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer) return
    setPlayerHistory(null)
    fetchPlayerHistory(selectedPlayer.id)
      .then(setPlayerHistory)
      .catch(() => setPlayerHistory(null))
  }, [selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer) return
    setDfsSummary(null)
    fetchDFSSummary(selectedPlayer.id)
      .then(setDfsSummary)
      .catch(() => setDfsSummary(null))
  }, [selectedPlayer])

  useEffect(() => {
    fetchRounds()
      .then(setRounds)
      .catch(() => {})
  }, [])

  return (
    <div>
      <header className="header">
        <h1>AFL FANTASY DASHBOARD</h1>
      </header>

      <PlayerTable onPlayerClick={(p) => {
        setSelectedPlayer(p)
        setActiveTab('gameHistory')
        setExpanded(false)
        setExpandedYear(new Set())
        setExpandedGame(new Set())
      }}/>

    {/* Modal */}

    {selectedPlayer && (
        <div
          onClick={() => setSelectedPlayer(null)}
          style={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 12, padding: 24,
              width: '90%', maxWidth: 1000,
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <button
              onClick={() => setSelectedPlayer(null)}
              style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#888' }}
            >
              ✕
            </button>
            
            {/* Header */}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <img
                src={`https://fantasy.afl.com.au/media/fantasy/players/${selectedPlayer.id}_100.webp?v=3`}
                alt={selectedPlayer.firstName}
                style={{ width: 124, height: 124, objectFit: 'contain' }}
                onError={e => { e.target.style.visibility = 'hidden' }}
              />
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                  {selectedPlayer.teamName}
                </div>
                <PosBadge positions={selectedPlayer.position} />
              </div>
              <img
                src={`/logos/${selectedPlayer.squadId}.svg`}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'contain', marginLeft: 'auto', marginRight: 16}}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Games',     value: selectedPlayer.gamesPlayed },
                { label: 'Price',     value: `$${selectedPlayer.price.toLocaleString()}` },
                { label: 'Round Price Change',      
                  value: `$${selectedPlayer.roundPriceChange.toLocaleString()}`, 
                  color: priceChangeColour(selectedPlayer.roundPriceChange)},
                { label: 'Season Price Change',      
                  value: `$${selectedPlayer.seasonPriceChange.toLocaleString()}`, 
                  color: priceChangeColour(selectedPlayer.seasonPriceChange)},
                { label: 'Ownership', value: (() => {
                  const vals = Object.values(selectedPlayer.ownership || {})
                  return vals.length > 0 ? `${vals[vals.length - 1]}%` : '—'
                })() },
                { label: null, value: null },
                { label: 'Live', value: selectedPlayer.liveScore },
                { label: 'Avg', value: selectedPlayer.averagePoints?.toFixed(1) },
                { label: 'Last 3', value: selectedPlayer.last3Avg },
                { label: 'Last 5', value: selectedPlayer.last5Avg },
                { label: 'Low', value: selectedPlayer.lowScore },
                { label: 'High', value: selectedPlayer.highScore },
              ].map((s, i) => s.label === null ? (
                <div key={i} style={{ width: '100%' }} />
              ) : (
                <div key={s.label} style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: '#7a8499', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color || 'inherit' }}>{s.value ?? '—'}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: 0, 
              borderBottom: `2px solid ${getTeamColour(selectedPlayer.squadId).primary}`, 
              marginTop: 20, 
              marginBottom: 20,
              background: getTeamColour(selectedPlayer.squadId).primary,
              borderRadius: '6px 6px 0 0',
              padding: '0px 4px'
            }}>
            {['charts', 'gameHistory'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab
                    ? `2px solid ${getTeamColour(selectedPlayer.squadId).secondary}`
                    : '2px solid transparent',
                  background: activeTab === tab
                    ? `${getTeamColour(selectedPlayer.squadId).primary}15`
                    : 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: activeTab === tab ? 1 : 0.7,
                  color: getTeamColour(selectedPlayer.squadId).secondary,
                  fontFamily: 'Inter, sans-serif',
                  marginBottom: -2,
                }}
              >
                {tab === 'charts' ? 'Charts' : 'Game History'}
              </button>
            ))}
            </div>

            {/* Tab content */}
            {activeTab === 'charts' && (
              <div style={{ color: '#7a8499', fontSize: 13  }}>
                Charts coming soon.
              </div>
            )}

            {activeTab === 'gameHistory' && (() => {
              if (gameStatsLoading && !gameStats) return (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
              )

              const year = 2026
              const squadId = selectedPlayer.squadId
              const playedGames = gameStats || []
              const dfsGames = dfsSummary?.combinedGames || []

              function getDfsGame(roundNumber, yr) {
                return dfsGames.find(g => parseInt(g.round) === roundNumber && g.year === String(yr))
              }

              const avg = playedGames.length > 0
                ? (playedGames.reduce((sum, g) => sum + calcFantasyScore(g), 0) / playedGames.length).toFixed(1)
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
              const summaryCell = { padding: '10px 12px', textAlign: 'center' }
              const cellStyle = { padding: '9px 10px', textAlign: 'center' }
              const headers = ['Year', 'GM', 'Avg', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', '']

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
                        <span style={{ ...togColour(tog), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
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
                      <td style={cellStyle}>{dfs?.centreBounceAttendancePercentage ?? '—'}%</td>
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
          
              // Season summary row renderer 
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

              return (
                <div style={{ marginLeft: 6, marginRight: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--border)', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {headers.map((h, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: i === 0 ? 'left' : 'center', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
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
                                  stats={{ disposals: g.disposals, kicks: g.kicks, handballs: g.handballs, marks: g.marks, tackles: g.tackles, freesFor: g.freesFor, freesAgainst: g.freesAgainst, hitouts: g.hitouts, goals: g.goals, behinds: g.behinds }}
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
                              <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)', opacity: 0.4, background: 'var(--surface2)' }}>
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
                                  stats={{ disposals: g.disposals, kicks: g.kicks, handballs: g.handballs, marks: g.marks, tackles: g.tackles, freesFor: g.freesFor, freesAgainst: g.freesAgainst, hitouts: g.hitouts, goals: g.goals, behinds: g.behinds }}
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
            })()}
          </div>
        </div>
      )}
    </div>
  )
}