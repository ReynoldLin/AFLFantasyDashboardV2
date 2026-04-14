import { useState, useEffect, useCallback } from 'react'
import { fetchPlayers, fetchPlayerGameStats, fetchPlayerHistory, fetchDFSSummary, fetchRounds } from './api'
import './App.css'
import { TEAM_COLOURS, POS_COLOURS, scoreColour, qtrScoreColour, gamesColour, togColour, cbaColour, priceChangeColour } from './helpers/colourCoding'
import { PlayerTable } from './dashboard/playerDashboard'
import { Modal } from './modal/modal'

function calcFantasyScore(g) {
  return (
    g.kicks * 3 +
    g.handballs * 2 +
    g.marks * 3 +
    g.tackles * 4 +
    g.freesFor * 1 +
    g.freesAgainst * -3 +
    g.hitouts * 1 +
    g.goals * 6 +
    g.behinds * 1
  )
}

function getTeamColour(squadId) {
  return TEAM_COLOURS[squadId] || { primary: 'var(--accent)', secondary: '#ffffff' }
}

// Shared sub-row headers
const GAME_ROW_HEADERS = ['Rd', 'Opp', 'Score', 'TOG%', 'D', 'K', 'H', 'M', 'T', 'FF', 'FA', 'HO', 'G', 'B', 'CBA%', 'KI', 'RC%', '']

// Quarter breakdown table
function QuarterBreakdown({ dfs }) {
  if (!dfs) return null
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>
        Quarter-by-Quarter Breakdown
      </div>
    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: 'auto' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['', 'Score', 'TOG%', 'CBA%'].map(h => (
            <th key={h} style={{ padding: '4px 16px', textAlign: h ? 'center' : 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4].map(q => (
          <tr key={q}>
            <td style={{ padding: '4px 16px', fontWeight: 600 }}>Q{q}</td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...qtrScoreColour(dfs[`dt_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 40 }}>
                {dfs[`dt_${q}`] ?? '—'}
              </span>
            </td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...togColour(dfs[`tog_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                {dfs[`tog_${q}`] ?? '—'}%
              </span>
            </td>
            <td style={{ padding: '4px 16px', fontWeight: 700, textAlign: 'center' }}>
              <span style={{ ...cbaColour(dfs[`cba_att_${q}`]), borderRadius: 6, padding: '2px 8px', display: 'inline-block', minWidth: 50 }}>
                {dfs[`cba_att_${q}`] ?? '—'}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null) // shared/modal
  const [activeTab, setActiveTab] = useState('gameHistory') // shared
  const [expanded, setExpanded] = useState(false) // shared
  const [gameStats, setGameStats] = useState(null)
  const [gameStatsLoading, setGameStatsLoading] = useState(false)
  const [rounds, setRounds] = useState({}) // playerDashboard
  const [playerHistory, setPlayerHistory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(new Set()) // shared
  const [dfsSummary, setDfsSummary] = useState(null)
  const [expandedGame, setExpandedGame] = useState(new Set()) // shared

   useEffect(() => {
    if (!selectedPlayer) return
    const load = () => {
      setGameStatsLoading(true)
      fetchPlayerGameStats(selectedPlayer.id)
        .then(setGameStats)
        .catch(() => setGameStats(null))
        .finally(() => setGameStatsLoading(false))
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer) return
    setPlayerHistory(null)
    fetchPlayerHistory(selectedPlayer.id)
      .then(setPlayerHistory)
      .catch(() => setPlayerHistory(null))
  }, [selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer) return
    setDfsSummary(null)
    fetchDFSSummary(selectedPlayer.id)
      .then(setDfsSummary)
      .catch(() => setDfsSummary(null))
  }, [selectedPlayer])

  useEffect(() => {
    fetchRounds()
      .then(setRounds)
      .catch(() => {})
  }, [])

  return (
    <div>
      <header className="header">
        <h1>AFL FANTASY DASHBOARD</h1>
      </header>

      {/* Main Dashboard */}
      <PlayerTable onPlayerClick={(p) => {
        setSelectedPlayer(p)
        setActiveTab('gameHistory')
        setExpanded(false)
        setExpandedYear(new Set())
        setExpandedGame(new Set())
      }}
        rounds={rounds}
      />

      {/* Modal */}
      <Modal 
        selectedPlayer={selectedPlayer}
        setSelectedPlayer={setSelectedPlayer}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expanded={expanded}
        setExpanded={setExpanded}
        expandedYear={expandedYear}
        setExpandedYear={setExpandedYear}
        expandedGame={expandedGame}
        setExpandedGame={setExpandedGame}
        gameStats={gameStats}
        gameStatsLoading={gameStatsLoading}
        playerHistory={playerHistory}
        dfsSummary={dfsSummary}
        rounds={rounds}
      />
    </div>
  )
}