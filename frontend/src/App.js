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

function PosBadge({ pos }) {
  return <span className={`pos-badge pos-${pos}`}>{pos}</span>
}

function StatusLabel({ status }) {
  return <span className={`status status-${status}`}>{status}</span>
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
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [position, setPosition] = useState('All')
  const [sortBy, setSortBy]     = useState('averagePoints')
  const [search, setSearch]     = useState('')

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
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        (p.teamName || '').toLowerCase().includes(search.toLowerCase())
      )
    : players

  return (
    <div>
      <header className="header">
        <h1>AFL FANTASY</h1>
        <span>Dashboard</span>
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
            placeholder="Search player or team..."
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
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
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
                            style={{ width: 72, height: 72, objectFit: 'contain' }}
                            onError={e => { e.target.style.visibility = 'hidden' }}
                          />
                          <span className="player-name">{p.firstName} {p.lastName}</span>
                        </div>
                      </td>
                      <td className="team-name">{p.teamName}</td>
                      <td>
                        <div className="pos-badges">
                          {p.position.map(pos => <PosBadge key={pos} pos={pos} />)}
                        </div>
                      </td>
                      <td>${(p.price.toLocaleString())}</td>
                      <td className="avg-score">{p.averagePoints?.toFixed(1) || '—'}</td>
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
    </div>
  )
}