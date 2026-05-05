import { useState, useEffect, useRef } from 'react'
import { fetchPlayers, fetchPlayerGameStats, fetchDFSSummary } from '../api'
import { PosBadge, scoreColour, togColour, cbaColour } from '../helpers/colourCoding'
import { calcFantasyScore } from '../modal/tab-content/gameHistory'

// ─── stat rows config ────────────────────────────────────────────────────────
const STAT_ROWS = [
  { key: 'games',        label: 'Games',          format: v => v,             isCount: true },
  { key: 'fantasyPts',   label: 'Fantasy Pts',    format: v => v.toFixed(1),  highlight: true },
  { key: 'disposals',    label: 'Disposals',      format: v => v.toFixed(1) },
  { key: 'kicks',        label: 'Kicks',          format: v => v.toFixed(1) },
  { key: 'handballs',    label: 'Handballs',      format: v => v.toFixed(1) },
  { key: 'marks',        label: 'Marks',          format: v => v.toFixed(1) },
  { key: 'tackles',      label: 'Tackles',        format: v => v.toFixed(1) },
  { key: 'hitouts',      label: 'Hitouts',        format: v => v.toFixed(1) },
  { key: 'goals',        label: 'Goals',          format: v => v.toFixed(1) },
  { key: 'behinds',      label: 'Behinds',        format: v => v.toFixed(1) },
  { key: 'timeOnGroundPercentage',           label: 'Time on Ground %', format: v => v.toFixed(0) + '%', colourFn: togColour },
  { key: 'centreBounceAttendancePercentage', label: 'CBA %',            format: v => v.toFixed(0) + '%', colourFn: cbaColour },
  { key: 'ruckContestPercentage',            label: 'Ruck Contest %',   format: v => v.toFixed(0) + '%' },
  { key: 'kickins',                          label: 'Kick Ins',         format: v => v.toFixed(1) },
]

function calcStats(games) {
  if (!games || games.length === 0) return null
  const n = games.length
  const avg = key => games.reduce((s, g) => s + (g[key] || 0), 0) / n
  return {
    games: n,
    fantasyPts: games.reduce((s, g) => s + calcFantasyScore(g), 0) / n,
    disposals:  avg('disposals'),
    kicks:      avg('kicks'),
    handballs:  avg('handballs'),
    marks:      avg('marks'),
    tackles:    avg('tackles'),
    hitouts:    avg('hitouts'),
    goals:      avg('goals'),
    behinds:    avg('behinds'),
    timeOnGroundPercentage:           avg('timeOnGroundPercentage'),
    centreBounceAttendancePercentage: avg('centreBounceAttendancePercentage'),
    ruckContestPercentage:            avg('ruckContestPercentage'),
    kickins:                          avg('kickins'),
  }
}

// ─── player search box ────────────────────────────────────────────────────────
function PlayerSearchBox({ label, selectedPlayer, onSelect, disabled, disabledHint, players, loading }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (disabled) { setSearch(''); setOpen(false) }
  }, [disabled])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = search.trim().length >= 1
    ? players.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : []

  function handleSelect(player) { onSelect(player); setSearch(''); setOpen(false) }
  function handleClear() { onSelect(null); setSearch('') }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: 280 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>

      {selectedPlayer ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: '8px 12px' }}>
          <img
            src={`https://fantasy.afl.com.au/media/fantasy/players/${selectedPlayer.id}_100.webp?v=3`}
            alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={e => { e.target.style.visibility = 'hidden' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedPlayer.firstName} {selectedPlayer.lastName}
            </div>
            {selectedPlayer.position && (
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <PosBadge positions={selectedPlayer.position} />
              </div>
            )}
          </div>
          <button onClick={handleClear} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>✕</button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            className="search-input"
            style={{ width: '100%', paddingRight: search ? 28 : 12, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'text', background: disabled ? 'var(--surface2)' : undefined }}
            type="text"
            placeholder={disabled ? (disabledHint || 'Select a player first...') : 'Search player...'}
            value={search}
            disabled={disabled}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => { if (!disabled) setOpen(true) }}
          />
          {search && !disabled && (
            <button onClick={() => { setSearch(''); setOpen(false) }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
          )}
        </div>
      )}

      {open && filtered.length > 0 && !selectedPlayer && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 200, overflow: 'hidden' }}>
          {filtered.map((p, i) => (
            <div key={p.id} onClick={() => handleSelect(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img src={`https://fantasy.afl.com.au/media/fantasy/players/${p.id}_100.webp?v=3`} alt={`${p.firstName} ${p.lastName}`} style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => { e.target.style.visibility = 'hidden' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.firstName} {p.lastName}</div>
                {p.position && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <PosBadge positions={p.position} />
                  </div>
                )}
              </div>
              {p.price && <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>${p.price.toLocaleString()}</span>}
            </div>
          ))}
        </div>
      )}

      {open && search.trim().length >= 1 && filtered.length === 0 && !selectedPlayer && !disabled && !loading && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--muted)', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
          No players found
        </div>
      )}
    </div>
  )
}

// ─── stats table ──────────────────────────────────────────────────────────────
function StatsTable({ playerWith, playerWithout, statsWith, statsWithout, loadingWith, loadingWithout }) {
  const col = { padding: '11px 24px', textAlign: 'center', fontSize: 13 }
  const labelCol = { padding: '11px 16px', fontSize: 13, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }

  function renderCell(stats, loading, key, format, highlight, colourFn) {
    if (loading) return <td style={col}><div className="skeleton" style={{ width: 40, margin: '0 auto' }} /></td>
    if (!stats) return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const val = stats[key]
    if (highlight && key === 'fantasyPts') {
      return (
        <td style={col}>
          <span style={{ ...scoreColour(val), borderRadius: 6, padding: '2px 10px', fontWeight: 700, display: 'inline-block', minWidth: 50 }}>
            {format(val)}
          </span>
        </td>
      )
    }
    if (colourFn) {
      return (
        <td style={col}>
          <span style={{ ...colourFn(val), borderRadius: 6, padding: '2px 10px', fontWeight: 700, display: 'inline-block', minWidth: 50 }}>
            {format(val)}
          </span>
        </td>
      )
    }
    return <td style={{ ...col, fontWeight: key === 'games' ? 700 : 500 }}>{format(val)}</td>
  }

  // Diff column: with - without, shown when both loaded
  function renderDiff(key, format) {
    if (!statsWith || !statsWithout) return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const diff = statsWithout[key] - statsWith[key]
    if (key === 'games') return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const color = diff > 0 ? '#007a52' : diff < 0 ? '#d63050' : 'var(--muted)'
    const prefix = diff > 0 ? '+' : ''
    return (
      <td style={{ ...col, color, fontWeight: 700 }}>
        {prefix}{format(diff)}
      </td>
    )
  }

  return (
    <div className="table-wrap" style={{ marginTop: 24 }}>
      <table>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', width: 120 }}></th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>WITH</span>
              </div>
            </th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>WITHOUT</span>
              </div>
            </th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>DIFF</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {STAT_ROWS.map(({ key, label, format, highlight, isCount, colourFn }) => (
            <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={labelCol}>{label}</td>
              {renderCell(statsWith,    loadingWith,    key, format, highlight, colourFn)}
              {renderCell(statsWithout, loadingWithout, key, format, highlight, colourFn)}
              {renderDiff(key, format)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export function WithWithout() {
  const [allPlayers, setAllPlayers]       = useState([])
  const [playersLoading, setPlayersLoading] = useState(false)

  const [playerWith, setPlayerWith]       = useState(null)
  const [playerWithout, setPlayerWithout] = useState(null)

  const [gamesWithPlayer, setGamesWithPlayer]       = useState(null)
  const [gamesWithoutPlayer, setGamesWithoutPlayer] = useState(null)
  const [combinedGames, setCombinedGames]           = useState(null)
  const [loadingWith, setLoadingWith]               = useState(false)
  const [loadingWithout, setLoadingWithout]         = useState(false)

  const combinedMap = new Map(
    (combinedGames || [])
      .filter(g => g.heatmapUrl)
      .map(g => {
        const match = g.heatmapUrl.match(/match-(\d+)-/)
        return match ? [match[1], g] : null
      })
      .filter(Boolean)
  )
  const enriched = (gamesWithPlayer || []).map(g => ({
    ...g,
    timeOnGroundPercentage:           parseFloat(combinedMap.get(String(g.gameId))?.timeOnGroundPercentage ?? 0),
    centreBounceAttendancePercentage: parseFloat(combinedMap.get(String(g.gameId))?.centreBounceAttendancePercentage ?? 0),
    ruckContestPercentage:            parseFloat(combinedMap.get(String(g.gameId))?.ruckContestPercentage ?? 0),
    kickins:                          parseInt(combinedMap.get(String(g.gameId))?.kickins ?? 0),
  }))

  const withoutPlayerGameIds = new Set((gamesWithoutPlayer || []).map(g => g.gameId))
  const statsWith    = enriched.length ? calcStats(enriched.filter(g => withoutPlayerGameIds.has(g.gameId))) : null
  const statsWithout = enriched.length ? calcStats(enriched.filter(g => !withoutPlayerGameIds.has(g.gameId))) : null

  // Load all players once for search
  useEffect(() => {
    setPlayersLoading(true)
    fetchPlayers({})
      .then(data => setAllPlayers(data.players || []))
      .catch(() => {})
      .finally(() => setPlayersLoading(false))
  }, [])

  useEffect(() => {
    setGamesWithPlayer(null)
    setCombinedGames(null)
    if (!playerWith) return
    setLoadingWith(true)
    Promise.all([
      fetchPlayerGameStats(playerWith.id),
      fetchDFSSummary(playerWith.id),
    ])
      .then(([gameStats, dfsSummary]) => {
        setGamesWithPlayer(gameStats)
        setCombinedGames(dfsSummary.combinedGames || [])
      })
      .catch(() => {
        setGamesWithPlayer(null)
        setCombinedGames(null)
      })
      .finally(() => setLoadingWith(false))
  }, [playerWith])

  useEffect(() => {
    setGamesWithoutPlayer(null)
    if (!playerWithout) return
    setLoadingWithout(true)
    fetchPlayerGameStats(playerWithout.id)
      .then(data => setGamesWithoutPlayer(data))
      .catch(() => setGamesWithoutPlayer(null))
      .finally(() => setLoadingWithout(false))
  }, [playerWithout])

  const squadPlayers = playerWith
    ? allPlayers.filter(p => p.squadId === playerWith.squadId && p.id !== playerWith.id)
    : []

  function handleWithSelect(player) {
    setPlayerWith(player)
    setPlayerWithout(null)
    setGamesWithoutPlayer(null)
    setCombinedGames(null)
  }

  return (
    <div style={{ padding: 32 }}>
      <main>
        <div className="filters" style={{ alignItems: 'flex-start', gap: 24 }}>
          <PlayerSearchBox
            label="Player"
            selectedPlayer={playerWith}
            onSelect={handleWithSelect}
            disabled={false}
            players={allPlayers}
            loading={playersLoading}
          />

          <div style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: 18, fontWeight: 300, paddingTop: 22 }}>/</div>

          <PlayerSearchBox
            label="With / Without player"
            selectedPlayer={playerWithout}
            onSelect={setPlayerWithout}
            disabled={!playerWith}
            disabledHint="Select player first..."
            players={squadPlayers}
            loading={playersLoading}
          />
        </div>

        {!playerWith && (
          <div className="empty" style={{ marginTop: 48 }}>
            Search for a player above to compare team performance with and without them
          </div>
        )}

        {playerWith && !playerWithout && (
          <div className="empty" style={{ marginTop: 48 }}>
            Now select a {playerWith.teamName} teammate to compare against
          </div>
        )}

        {playerWith && playerWithout && (
          <StatsTable
            playerWith={playerWith}
            playerWithout={playerWithout}
            statsWith={statsWith}
            statsWithout={statsWithout}
            loadingWith={loadingWith}
            loadingWithout={loadingWithout}
          />
        )}
      </main>
    </div>
  )
}