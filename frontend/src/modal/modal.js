import { ModalHeader } from "./modalHeader"
import { Tabs } from "./tabs"

export function Modal({ 
    selectedPlayer, 
    setSelectedPlayer, 
    activeTab, 
    setActiveTab, 
    expanded, 
    setExpanded, 
    expandedYear, 
    setExpandedYear, 
    expandedGame, 
    setExpandedGame, 
    gameStats, 
    gameStatsLoading, 
    playerHistory, 
    dfsSummary, 
    rounds }) {

    if (!selectedPlayer) return null
    return (
        <div onClick={() => setSelectedPlayer(null)}
            style={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
            }}
        >
            <div onClick={e => e.stopPropagation()}
            style={{
                background: 'white', borderRadius: 12, padding: 24,
                width: '90%', maxWidth: 1000,
                maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            >
            <button onClick={() => setSelectedPlayer(null)}
            style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#888' }}
            >
            ✕
            </button>
            
            {/* Header */}
            <ModalHeader selectedPlayer={selectedPlayer}/>

            {/* Tabs */}
            <Tabs 
                selectedPlayer={selectedPlayer}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            {/* Tab content */}

            
            </div>
        </div>
    )
}