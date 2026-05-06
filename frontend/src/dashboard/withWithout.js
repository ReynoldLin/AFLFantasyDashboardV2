import { useState, useEffect } from 'react'
import { fetchPlayers, fetchPlayerGameStats, fetchDFSSummary } from '../api'
import { scoreColour, togColour, cbaColour } from '../helpers/colourCoding'
import { calcFantasyScore } from '../modal/tab-content/gameHistory'
import { PlayerSearchBox } from './dashboard-helpers/playerSearchBox'
import { StatsTable } from './dashboard-helpers/statsTable'

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