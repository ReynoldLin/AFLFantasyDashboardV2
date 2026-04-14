import { useState, useEffect, useCallback } from 'react'
import { fetchPlayers, fetchRounds } from '../api'
import '../App.css'
import { scoreColour } from '../helpers/colourCoding'
import { PosBadge } from '../App.js'

const POSITIONS = ['All', 'DEF', 'MID', 'RUC', 'FWD']
const SORT_OPTIONS = [
  { label: 'Avg Points',  value: 'averagePoints' },
  { label: 'Price',       value: 'price' },
  { label: 'Last 3 Avg', value: 'last3Avg' },
  { label: 'High Score', value: 'highScore' }
]

const STATUS_LABELS = {
  'playing': 'Selected',
  'injured': 'Injured',
  'not-playing': 'Not Selected',
  'emergency': 'Emergency',
  'uncertain': 'Uncertain'
}

function getStatus(status) {
  return STATUS_LABELS[status] || status
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

export function PlayerTable({onPlayerClick}) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [position, setPosition] = useState('All')
    const [liveOnly, setLiveOnly] = useState(false)
    const [teamFilter, setTeamFilter] = useState('All')
    const [search, setSearch] = useState('') 

    const [sortBy, setSortBy] = useState({ key: 'price', dir: 'desc' })
    const [prevSortBy, setPrevSortBy] = useState({ key: 'price', dir: 'desc' })

    const [rounds, setRounds] = useState({}) 
    
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
                            <td colSpan={14}>
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
                                    onClick={() => { onPlayerClick(p) }}
                                    />
                                    <div>
                                    <div 
                                        className="player-name"
                                        style = {{ cursor: 'pointer'}}
                                        onClick={() => { onPlayerClick(p) }}
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
        </div>
    )
}