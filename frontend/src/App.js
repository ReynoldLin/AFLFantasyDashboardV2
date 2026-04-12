import { useState, useEffect, useCallback } from 'react'
import { fetchPlayers } from './api'
import './App.css'

const POSITIONS = ['All', 'DEF', 'MID', 'RUC', 'FWD']
const SORT_OPTIONS = [
  { label: 'Avg Points',  value: 'averagePoints' },
  { label: 'Price',       value: 'price' },
  { label: 'Last 3 Avg', value: 'last3Avg' },
  { label: 'High Score', value: 'highScore' },
  { label: 'Best Value', value: 'pricePerPoint' },
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
  const c1 = POS_COLOURS[positions[0]]
  const c2 = POS_COLOURS[positions[1]]
  return (
    <span className="pos-badge" style={{ background: `linear-gradient(120deg, ${c1} 50%, ${c2} 50%)` }}>
      {positions.join('/')}
    </span>
  )
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

export default function App() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [position, setPosition] = useState('All')
  const [sortBy, setSortBy] = useState('averagePoints')
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [activeTab, setActiveTab] = useState('gameHistory')
  const [expanded, setExpanded] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPlayers({
        position: position !== 'All' ? position : undefined,
        sortBy,
      })
      setPlayers(data.players)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [position, sortBy])

  useEffect(() => { load() }, [load])

  const visible = search
    ? players.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : players

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
              onClick={() => setPosition(pos)}
            >
              {pos}
            </button>
          ))}

          <select
            className="filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input
            className="search-input"
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <span className="player-count">{visible.length} players</span>
        </div>

        <div className="table-wrap">
          {error ? (
            <div className="error">Error: {error}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Player</th>
                  <th style={{ textAlign: "center"}}>Team</th>
                  <th>Price</th>
                  <th>Avg</th>
                  <th>Last 3</th>
                  <th>High</th>
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
                              onClick={() => { setSelectedPlayer(p); setActiveTab('gameHistory'); setExpanded(true); }}
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
                      <td className="muted-val">{p.averagePoints?.toFixed(1) || '—'}</td>
                      <td className="muted-val">{p.last3Avg || '—'}</td>
                      <td className="muted-val">{p.highScore || '—'}</td>
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
              width: '90%', maxWidth: 700,
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
                style={{ width: 108, height: 108, objectFit: 'contain' }}
                onError={e => { e.target.style.visibility = 'hidden' }}
              />
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </h2>
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
                { label: 'Avg',       value: selectedPlayer.averagePoints?.toFixed(1) },
                { label: 'Last 3',    value: selectedPlayer.last3Avg },
                { label: 'High',      value: selectedPlayer.highScore }
              ].map(s => (
                <div key={s.label} style={{
                  background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80
                }}>
                  <div style={{ fontSize: 11, color: '#7a8499', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value ?? '—'}</div>
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
              const scores = Object.entries(selectedPlayer.scores).sort((a, b) => Number(a[0]) - Number(b[0]))
              const avg = scores.length > 0
                ? (scores.reduce((sum, [, s]) => sum + s, 0) / scores.length).toFixed(1)
                : '—'

              return (
                <div>
                  {/* Year header row */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--border)', borderRadius: expanded ? '8px 8px 0 0' : 8, overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Year</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Games</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Average</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          onClick={() => setExpanded(e => !e)}
                          style={{ cursor: 'pointer', background: 'white' }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{2026}</td>
                          <td style={{ padding: '10px 12px' }}>{scores.length}</td>
                          <td style={{ padding: '10px 12px' }}>{avg}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</td>
                        </tr>
                      </tbody>
                    </table>

                  {/* Collapsible table */}
                  {expanded && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--border)', borderTop: 'none', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Round</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ padding: 16, color: 'var(--muted)', textAlign: 'center' }}>No games played</td>
                          </tr>
                        ) : (
                          scores.map(([round, score]) => (
                            <tr key={round} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 12px' }}>{round-1}</td>
                              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{score}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}