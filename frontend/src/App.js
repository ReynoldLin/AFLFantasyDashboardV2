import { useState, useEffect, useCallback } from 'react'
import { fetchPlayers, fetchPlayerGameStats, fetchPlayerHistory, fetchRounds } from './api'
import './App.css'

const POSITIONS = ['All', 'DEF', 'MID', 'RUC', 'FWD']
const SORT_OPTIONS = [
  { label: 'Avg Points',  value: 'averagePoints' },
  { label: 'Price',       value: 'price' },
  { label: 'Last 3 Avg', value: 'last3Avg' },
  { label: 'High Score', value: 'highScore' }
]

const POS_COLOURS = {
  DEF: '#F38182',
  MID: '#EBF19F',
  RUC: '#A8A8FB',
  FWD: '#ABF5CA',
}

const STATUS_LABELS = {
  'playing': 'Selected',
  'injured': 'Injured',
  'not-playing': 'Not Selected',
  'emergency': 'Emergency',
  'uncertain': 'Uncertain'
}

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

function scoreColour(score) {
  if (score >= 120) return { background: '#e8d5ff', color: 'var(--text)' }
  if (score >= 100) return { background: '#C8E0A9', color: 'var(--text)' }
  if (score >= 80) return { background: '#8ddefe', color: 'var(--text)' }
  if (score >= 60)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

function gamesColour(games) {
  if (games >= 20) return { background: '#C8E0A9', color: 'var(--text)' }
  if (games >= 15)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

function togColour(tog) {
  if (tog >= 80) return { background: '#C8E0A9', color: 'var(--text)' }
  if (tog >= 70) return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

function getStatus(status) {
  return STATUS_LABELS[status] || status
}

function PosBadge({ positions }) {
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

function StatusLabel({ status }) {
  return <span className={`status status-${status}`}>{getStatus(status)}</span>
}

function SkeletonRows() {
  return Array.from({ length: 10 }).map((_, i) => (
    <tr key={i}>
      {[140, 90, 60, 70, 50, 50, 50, 60].map((w, j) => (
        <td key={j}><div className="skeleton" style={{ width: w }} /></td>
      ))}
    </tr>
  ))
}

function isPlayerLive(player, rounds) {
  if (player.liveScore === null) return false
  const playingRound = Object.values(rounds).find(r => r.status === 'playing')
  if (!playingRound) return false

  const playerGame = playingRound.games.find(g =>
    g.homeId === player.squadId || g.awayId === player.squadId
  )
  if (!playerGame) return false

  return playerGame.status !== 'completed'
}

function SortIcon({ colKey, sortBy }) {
  if (sortBy.key !== colKey) return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>↕</span>
  return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{sortBy.dir === 'desc' ? '↓' : '↑'}</span>
}

function priceChangeColour(val) {
  if (val > 0) return '#007a52'
  if (val < 0) return '#d63050'
  return 'var(--text)'
}

export default function App() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [position, setPosition] = useState('All')
  const [sortBy, setSortBy] = useState({ key: 'averagePoints', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [activeTab, setActiveTab] = useState('gameHistory')
  const [expanded, setExpanded] = useState(false)
  const [gameStats, setGameStats] = useState(null)
  const [gameStatsLoading, setGameStatsLoading] = useState(false)
  const [rounds, setRounds] = useState({})
  const [liveOnly, setLiveOnly] = useState(false)
  const [playerHistory, setPlayerHistory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(null)
  const [teamFilter, setTeamFilter] = useState('All')
  const [prevSortBy, setPrevSortBy] = useState({ key: 'averagePoints', dir: 'desc' })

  const load = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    const data = await fetchPlayers({
      position: position !== 'All' ? position : undefined,
    })
    console.log('players loaded:', data)
    setPlayers(data.players)
  } catch (e) {
    console.log('load error:', e)
    setError(e.message)
  } finally {
    setLoading(false)
  }
}, [position, sortBy])

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
    fetchRounds()
      .then(setRounds)
      .catch(() => {})
  }, [])

   useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  const visible = players
  .filter(p => !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()))
  .filter(p => !liveOnly || isPlayerLive(p, rounds))
  .filter(p => teamFilter === 'All' || p.teamName === teamFilter)
  .sort((a, b) => {
    if (liveOnly && sortBy.key === 'liveScore') {
      const aScore = a.liveScore ?? -1
      const bScore = b.liveScore ?? -1
      const mul = sortBy.dir === 'desc' ? -1 : 1
      return mul * (aScore - bScore)
    }
    const { key, dir } = sortBy
    const mul = dir === 'desc' ? -1 : 1
    if (key === 'lastName') return mul * (a.lastName || '').localeCompare(b.lastName || '')
    if (key === 'ownership') {
      const aOwn = Object.values(a.ownership || {}).pop() ?? 0
      const bOwn = Object.values(b.ownership || {}).pop() ?? 0
      return mul * (aOwn - bOwn)
    }
    return mul * ((a[key] ?? 0) - (b[key] ?? 0))
  })

  function handleSort(key) {
    setSortBy(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' }
    )
  }

  return (
    <div>
      <header className="header">
        <h1>AFL FANTASY DASHBOARD</h1>
      </header>

      <main>
        <div className="filters">
          {POSITIONS.map(pos => (
            <button
              key={pos}
              className={`pos-btn ${position === pos ? 'active' : ''}`}
              onClick={() => { setPosition(pos) }}
            >
              {pos}
            </button>
          ))}

          <button
            className={`pos-live-btn ${liveOnly ? 'active' : ''}`}
            onClick={() => {
              const newLiveOnly = !liveOnly
              setLiveOnly(newLiveOnly)
              if (newLiveOnly) {
                setPrevSortBy(sortBy)
                setSortBy({ key: 'liveScore', dir: 'desc' })
              } else {
                setSortBy(prevSortBy)
              }
            }}
          >
          Live
          </button>

          <select
            className="filter-select"
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
          >
            <option value="All">All Teams</option>
            {[...new Set(players.map(p => p.teamName))]
              .filter(Boolean)
              .sort()
              .map(team => (
                <option key={team} value={team}>{team}</option>
              ))
            }
          </select>

          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <input
              className="search-input"
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingRight: search ? 28 : 12 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <span className="player-count">{visible.length} players</span>
        </div>
        
        <div className="table-wrap">
          {error ? (
            <div className="error">Error: {error}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '20%', cursor: 'pointer' }} onClick={() => handleSort('lastName')}>
                    Player <SortIcon colKey="lastName" sortBy={sortBy} />
                  </th>
                  <th style={{ textAlign: 'center' }}>Team</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Price <SortIcon colKey="price" sortBy={sortBy} />
                  </th>
                  <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('liveScore')}>
                    Live <SortIcon colKey="liveScore" sortBy={sortBy} />
                  </th>
                  <th style={{ width: 20 }}></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('averagePoints')}>
                    Avg <SortIcon colKey="averagePoints" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('last3Avg')}>
                    Last 3 <SortIcon colKey="last3Avg" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('last5Avg')}>
                    Last 5 <SortIcon colKey="last5Avg" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('lowScore')}>
                    Low <SortIcon colKey="lowScore" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('highScore')}>
                    High <SortIcon colKey="highScore" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('roundPriceChange')}>
                    R$C <SortIcon colKey="roundPriceChange" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('seasonPriceChange')}>
                    S$C <SortIcon colKey="seasonPriceChange" sortBy={sortBy} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ownership')}>
                    Own% <SortIcon colKey="ownership" sortBy={sortBy} />
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty">No players found</div>
                    </td>
                  </tr>
                ) : (
                  visible.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={`https://fantasy.afl.com.au/media/fantasy/players/${p.id}_100.webp?v=3`}
                            alt={`${p.firstName} ${p.lastName}`}
                            style={{ width: 72, height: 72, objectFit: 'contain', cursor: 'pointer' }}
                            onError={e => { e.target.style.visibility = 'hidden' }}
                            onClick={() => setSelectedPlayer(p)}
                          />
                          <div>
                            <div 
                              className="player-name"
                              style = {{ cursor: 'pointer'}}
                              onClick={() => { setSelectedPlayer(p); setActiveTab('gameHistory'); setExpanded(false); setExpandedYear(null) }}
                              >
                              {p.firstName} {p.lastName}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              <PosBadge positions={p.position} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center"}}>
                        <img
                          src={`/logos/${p.squadId}.svg`}
                          alt={p.teamName}
                          style={{ width: 42, height: 42, objectFit: 'contain' }}
                        />
                      </td>
                      <td>${(p.price.toLocaleString())}</td>
                      <td style={{ textAlign: 'center' }}>
                        {p.liveScore !== null ? (
                          <span style={{
                            ...scoreColour(p.liveScore),
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontWeight: 700,
                            fontSize: 13,
                          }}>
                            {p.liveScore}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'left', width: 20 }}>
                        {isPlayerLive(p, rounds) && (
                          <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#ff4444',
                            display: 'inline-block',
                            animation: 'pulse-dot 1.2s ease-in-out infinite',
                          }} />
                        )}
                      </td>
                      <td className="muted-val">{p.averagePoints?.toFixed(1) || '—'}</td>
                      <td className="muted-val">{p.last3Avg || '—'}</td>
                      <td className="muted-val">{p.last5Avg || '—'}</td>
                      <td className="muted-val">{p.lowScore || '—'}</td>
                      <td className="muted-val">{p.highScore || '—'}</td>
                      <td style={{ color: p.roundPriceChange > 0 ? '#007a52' : p.roundPriceChange < 0 ? '#d63050' : 'var(--muted)' }}>
                        {p.roundPriceChange ? `$${p.roundPriceChange.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ color: p.seasonPriceChange > 0 ? '#007a52' : p.seasonPriceChange < 0 ? '#d63050' : 'var(--muted)' }}>
                        {p.seasonPriceChange ? `$${p.seasonPriceChange.toLocaleString()}` : '—'}
                      </td>
                      <td className="text-val">
                        {(() => {
                          const vals = Object.values(p.ownership || {})
                          return vals.length > 0 ? `${vals[vals.length - 1]}%` : '—'
                        })()}
                      </td>
                      <td><StatusLabel status={p.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

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
              width: '90%', maxWidth: 800,
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
                { label: 'Live',       
                  value: selectedPlayer.liveScore,
                  color: "#df950b" },
                { label: 'Avg',       value: selectedPlayer.averagePoints?.toFixed(1) },
                { label: 'Last 3',    value: selectedPlayer.last3Avg },
                { label: 'Last 5',    value: selectedPlayer.last5Avg },
                { label: 'Low',      value: selectedPlayer.lowScore },
                { label: 'High',      value: selectedPlayer.highScore },
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
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e4ed', marginTop: 10, marginBottom: 20 }}>
              {['charts', 'gameHistory'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? 'var(--accent)' : '#7a8499',
                    fontFamily: 'Inter, sans-serif',
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
              const avg = playedGames.length > 0
                ? (playedGames.reduce((sum, g) => sum + calcFantasyScore(g), 0) / playedGames.length).toFixed(1)
                : '—'

              const statAvg = (key) => {
                if (!gameStats || gameStats.length === 0) return '—'
                return (gameStats.reduce((sum, g) => sum + (g[key] || 0), 0) / gameStats.length).toFixed(1)
              }

              const scoreAvg = avg
              const allRounds = Object.values(rounds).sort((a, b) => a.roundNumber - b.roundNumber)

              const rows = allRounds.map(r => {
                const rn = r.roundNumber
                const isBye = r.byeSquads.includes(squadId)
                const game = playedGames.find(g => g.roundNumber === rn)
                const opponentId = r.fixture[String(squadId)]
                const squadPlayed = r.squadsPlayed.includes(squadId)

                if (game) return { type: 'played', rn, game, opponentId }
                else if (isBye) return { type: 'bye', rn, opponentId: null }
                else if (r.status === 'scheduled') return { type: 'upcoming', rn, opponentId }
                else if (r.status === 'completed' && squadPlayed) return { type: 'dnp', rn, opponentId }
                else if (r.status === 'playing') return { type: 'upcoming', rn, opponentId }
                else return null
              }).filter(Boolean)

              const cellStyle = { padding: '9px 10px', textAlign: 'center' }
              const headers = ['Year', 'GM', 'Avg', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', '']
              const historicalYears = playerHistory ? [...playerHistory].reverse() : []
              
              return (
                <div style={{ marginLeft: 6, marginRight: 6 }}>

                  {/* Shared header */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--border)', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {headers.map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                  {/* 2026 summary row */}
                    <tbody>
                      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer', background: 'white', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{year}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center'}}>
                          <span style={{ ...gamesColour(playedGames.length), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 32 }}>
                            {playedGames.length}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                          <span style={{ ...scoreColour(parseFloat(scoreAvg).toFixed(1)), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                            {scoreAvg}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('disposals')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('kicks')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('handballs')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('marks')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('tackles')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('freesFor')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('freesAgainst')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('hitouts')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('goals')}</td>
                        <td style={{ padding: '10px 12px' }}>{statAvg('behinds')}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</td>
                      </tr>

                      {/* 2026 round-by-round */}
                      {expanded && (
                        <>
                          <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                            {['Rd', 'Opp', 'Score', 'TOG%', 'D', 'K', 'HB', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B'].map(h => (
                              <td key={h} style={{ ...cellStyle, color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{h}</td>
                            ))}
                          </tr>
                          {gameStatsLoading ? (
                            <tr><td colSpan={14} style={{ padding: 16, textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
                          ) : rows.map(row => {
                            if (row.type === 'played') {
                              const g = row.game
                              return (
                                <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={cellStyle}>{row.rn}</td>
                                  <td style={cellStyle}>
                                    {row.opponentId && <img src={`/logos/${row.opponentId}.svg`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.visibility = 'hidden'} />}
                                  </td>
                                  <td style={{ ...cellStyle, fontWeight: 700 }}>
                                    <span style={{ ...scoreColour(calcFantasyScore(g)), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                                      {calcFantasyScore(g)}
                                    </span>
                                  </td>
                                  <td style={cellStyle}>
                                    <span style={{ ...togColour(g.timeOnGround), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                                      {g.timeOnGround}%
                                    </span>
                                  </td>
                                  <td style={cellStyle}>{g.disposals}</td>
                                  <td style={cellStyle}>{g.kicks}</td>
                                  <td style={cellStyle}>{g.handballs}</td>
                                  <td style={cellStyle}>{g.marks}</td>
                                  <td style={cellStyle}>{g.tackles}</td>
                                  <td style={cellStyle}>{g.freesFor}</td>
                                  <td style={cellStyle}>{g.freesAgainst}</td>
                                  <td style={cellStyle}>{g.hitouts}</td>
                                  <td style={cellStyle}>{g.goals}</td>
                                  <td style={cellStyle}>{g.behinds}</td>
                                </tr>
                              )
                            }
                            if (row.type === 'bye') return (
                              <tr key={row.rn} style={{ borderBottom: '1px solid var(--border)', opacity: 0.5, background: 'var(--surface2)' }}>
                                <td style={cellStyle}>{row.rn}</td>
                                <td style={cellStyle}><div style={{ width: 24, height: 24 }} /></td>
                                <td colSpan={12} style={{ ...cellStyle, textAlign: 'center' }}>
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
                                <td colSpan={12} style={{ ...cellStyle, textAlign: 'center' }}>
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
                                <td colSpan={12} />
                              </tr>
                            )
                            return null
                          })}
                        </>
                      )}

                      {/* Historical years */}
                      {historicalYears.map(season => (
                        <>
                          <tr
                            key={season.year}
                            onClick={() => setExpandedYear(y => y === season.year ? null : season.year)}
                            style={{ cursor: 'pointer', background: 'white', borderBottom: '1px solid var(--border)' }}
                          >
                            <td style={{ padding: '10px 12px', fontWeight: 700 }}>{season.year}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center'}}>
                              <span style={{ ...gamesColour(season.games_played), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 32 }}>
                                {season.games_played}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                              <span style={{ ...scoreColour(season.avg), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                                {season.avg?.toFixed(1)}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>{season.disposals?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.kicks?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.handballs?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.marks?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.tackles?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.frees_for?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.frees_against?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.hitouts?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.goals?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px' }}>{season.behinds?.toFixed(1)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>
                              {expandedYear === season.year ? '▲' : '▼'}
                            </td>
                          </tr>
                          
                          {expandedYear === season.year && (
                            <>
                              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                                {['Rd', 'Opp', 'Score', 'D', 'K', 'HB', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', ''].map(h => (
                                  <td key={h} style={{ ...cellStyle, color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{h}</td>
                                ))}
                              </tr>
                              {season.games.map(g => (
                                <tr key={g.roundNumber} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={cellStyle}>{g.roundNumber}</td>
                                  <td style={cellStyle}>
                                    {g.opponentSquadId && <img src={`/logos/${g.opponentSquadId}.svg`} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.visibility = 'hidden'} />}
                                  </td>
                                  <td style={{ ...cellStyle, fontWeight: 700 }}>
                                    <span style={{ ...scoreColour(g.score), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                                      {g.score}
                                    </span>
                                  </td>
                                  <td style={cellStyle}>{g.disposals}</td>
                                  <td style={cellStyle}>{g.kicks}</td>
                                  <td style={cellStyle}>{g.handballs}</td>
                                  <td style={cellStyle}>{g.marks}</td>
                                  <td style={cellStyle}>{g.tackles}</td>
                                  <td style={cellStyle}>{g.freesFor}</td>
                                  <td style={cellStyle}>{g.freesAgainst}</td>
                                  <td style={cellStyle}>{g.hitouts}</td>
                                  <td style={cellStyle}>{g.goals}</td>
                                  <td style={cellStyle}>{g.behinds}</td>
                                  <td style={cellStyle} />
                                </tr>
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