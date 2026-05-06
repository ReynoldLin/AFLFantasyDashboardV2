import { useState, useEffect, useRef } from 'react'
import { PosBadge } from '../../helpers/colourCoding'

export function PlayerSearchBox({ label, selectedPlayer, onSelect, disabled, disabledHint, players, loading }) {
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