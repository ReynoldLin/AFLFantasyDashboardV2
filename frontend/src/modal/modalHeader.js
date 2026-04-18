import { PosBadge, priceChangeColour } from "../helpers/colourCoding"
import '../App.css'

export function ModalHeader({selectedPlayer}) {
    return (
        <div>
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
            <div className="stat-badges">
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
                            <div key={s.label} className='stat-badge-bg'>
                            <div className='stat-badge-title'>{s.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: s.color || 'inherit' }}>{s.value ?? '—'}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}