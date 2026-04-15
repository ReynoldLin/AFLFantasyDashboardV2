import { getTeamColour } from '../helpers/colourCoding'
import { PrevGame } from './tab-content/prevGame'
import { Charts } from './tab-content/charts'
import { GameHistory } from './tab-content/gameHistory'

export function Tabs({
    selectedPlayer, 
    activeTab, 
    setActiveTab, 
    gameStatsLoading, 
    gameStats,
    dfsSummary,
    rounds,
    playerHistory,
    expanded,
    setExpanded,
    expandedGame,
    setExpandedGame,
    expandedYear,
    setExpandedYear }) {

    return (
        <>
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
                {['prevGame', 'charts', 'gameHistory'].map(tab => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: activeTab === tab
                        ? `2px solid ${getTeamColour(selectedPlayer.squadId).secondary}`
                        : '2px solid transparent',
                        background: activeTab === tab
                        ? `${getTeamColour(selectedPlayer.squadId).primary}`
                        : 'transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: activeTab === tab ? 1 : 0.7,
                        color: getTeamColour(selectedPlayer.squadId).secondary,
                        fontFamily: 'Inter, sans-serif',
                        marginBottom: -2,
                    }}
                    >
                    {tab === 'prevGame' ? 'Previous Game' : tab === 'charts' ? 'Charts' : 'Game History'}
                    </button>
                ))}
            </div>

            {activeTab === 'prevGame' && (
                <PrevGame/>
            )}

            {activeTab === 'charts' && (
                <Charts/>
            )}

            {activeTab === 'gameHistory' && (
                <GameHistory
                    selectedPlayer={selectedPlayer}
                    gameStatsLoading={gameStatsLoading}
                    gameStats={gameStats}
                    dfsSummary={dfsSummary}
                    rounds={rounds}
                    playerHistory={playerHistory}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    expandedGame={expandedGame}
                    setExpandedGame={setExpandedGame}
                    expandedYear={expandedYear}
                    setExpandedYear={setExpandedYear}
                />
            )}
        </>
    )
}