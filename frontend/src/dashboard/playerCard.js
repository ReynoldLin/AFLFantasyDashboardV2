export function PlayerCard({ id, playerMap, playerDataMap, captainId, viceCaptainId }) {
    const player = playerDataMap[id]
    const name = player ? `${player.firstName} ${player.lastName}` : playerMap[id] || `ID ${id}`
    const isCap  = id === captainId
    const isVice = id === viceCaptainId

    const price = player?.price
        ? `$${(player.price).toLocaleString()}`
        : '—'

    return (
        <div style={{
            background: 'var(--surface)',
            borderRadius: 8,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
            minWidth: 110,
        }}>
            {/* Captain / VC badge */}
            {(isCap || isVice) && (
                <div style={{
                    position: 'absolute', top: 6, right: 6,
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
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: 'var(--border)' }}
                    onError={e => { e.target.style.display = 'none' }}
                />
                {/* Team logo */}
                {player?.squadId && (
                    <img
                        src={`/logos/${player.squadId}.svg`}
                        alt="team"
                        style={{
                            position: 'absolute', bottom: 0, right: -4,
                            width: 22, height: 22,
                            borderRadius: '50%',
                            background: 'var(--surface)',
                        }}
                        onError={e => { e.target.style.display = 'none' }}
                    />
                )}
            </div>

            {/* Name */}
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'var(--text)', lineHeight: 1.2 }}>
                {name}
            </div>

            {/* Live score + price */}
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                    {player?.liveScore ?? player?.score ?? '—'}
                </span>
                <span>{price}</span>
            </div>
        </div>
    )
}