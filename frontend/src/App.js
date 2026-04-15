import { useState, useEffect, useCallback } from 'react'
import { fetchPlayerGameStats, fetchPlayerHistory, fetchDFSSummary, fetchRounds } from './api'
import './App.css'
import { PlayerTable } from './dashboard/playerDashboard'
import { Modal } from './modal/modal'

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null) 
  const [activeTab, setActiveTab] = useState('prevGame') 
  const [expanded, setExpanded] = useState(false) 
  const [gameStats, setGameStats] = useState(null)
  const [gameStatsLoading, setGameStatsLoading] = useState(false)
  const [rounds, setRounds] = useState({}) 
  const [playerHistory, setPlayerHistory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(new Set()) 
  const [dfsSummary, setDfsSummary] = useState(null)
  const [expandedGame, setExpandedGame] = useState(new Set())

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
        setActiveTab('prevGame')
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