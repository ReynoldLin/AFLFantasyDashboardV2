import { getTeamColour } from '../helpers/colourCoding'

export function Tabs({selectedPlayer, activeTab, setActiveTab}) {
    return (
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
                    ? `${getTeamColour(selectedPlayer.squadId).primary}`
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
    )
}