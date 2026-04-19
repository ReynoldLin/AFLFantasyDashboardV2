import { PosBadge, scoreColour } from "../helpers/colourCoding"

export function PlayerCard({ id, playerMap, playerDataMap, captainId, viceCaptainId, onPlayerClick }) {
    const player = playerDataMap[id]
    const name = player ? `${player.firstName} ${player.lastName}` : playerMap[id] || `ID ${id}`
    const isCap  = id === captainId
    const isVice = id === viceCaptainId

    const price = player?.price
        ? `$${(player.price).toLocaleString()}`
        : '—'

    return (
        
        <div className='player-card'>
            {/* Captain / VC badge */}
            {(isCap || isVice) && (
                <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: isCap ? 'gold' : 'silver',
                    color: '#000',
                    borderRadius: '50%',
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                }}>
                    {isCap ? 'C' : 'VC'}
                </div>
            )}

            {/* Player photo */}
            <div style={{ position: 'relative' }}>
                <img
                    src={`https://fantasy.afl.com.au/media/fantasy/players/${id}_100.webp?v=3`}
                    alt={name}
                    style={{ width: 96, height: 96, borderRadius: '0%', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none' }}
                />
                {/* Team logo */}
                {player?.squadId && (
                    <img
                        src={`/logos/${player.squadId}.svg`}
                        alt="team"
                        style={{
                            position: 'absolute', top: 0, right: -16,
                            width: 28, height: 28
                        }}
                        onError={e => { e.target.style.display = 'none' }}
                    />
                )}
                <span style={{ 
                    ...scoreColour(player?.liveScore), 
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontWeight: 700,
                    fontSize: 13, 
                    position: 'absolute', top:0, left: -24 }}>
                    {player?.liveScore ?? '—'}
                </span>
            </div>

            {/* Name */}
            <div 
            onClick={() => player && onPlayerClick(player)} 
            className='player-name' 
            style={{ cursor:'pointer' }}>
                {name}
            </div>

            <div>
                <PosBadge positions={player?.position}/>
            </div>

            {/* Live score + price */}
            <div style={{ fontSize: 11, color: 'var(--text)' }}>
                {price}
            </div>
        </div>
    )
}