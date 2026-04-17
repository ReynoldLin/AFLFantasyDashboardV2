const BASE = 'http://localhost:8000/api'

export async function fetchPlayers({ position, squadId, status, sortBy, limit } = {}) {
  const params = new URLSearchParams()
  if (position) params.set('position', position)
  if (squadId)  params.set('squad_id', squadId)
  if (status)   params.set('status', status)
  if (sortBy)   params.set('sort_by', sortBy)
  if (limit)    params.set('limit', limit)
  const res = await fetch(`${BASE}/players?${params}`)
  if (!res.ok) throw new Error('Failed to fetch players')
  return res.json()
}

export async function fetchPlayerGameStats(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}/game_stats`)
  if (!res.ok) throw new Error('Failed to fetch game stats')
  return res.json()
}

export async function fetchRounds() {
  const res = await fetch(`${BASE}/rounds`)
  if (!res.ok) throw new Error('Failed to fetch rounds')
  return res.json()
}

export async function fetchPlayerHistory(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}/history`)
  if (!res.ok) throw new Error('Failed to fetch player history')
  return res.json()
}

export async function fetchDFSSummary(playerId) {
  const res = await fetch(`${BASE}/players/${playerId}/dfs_summary`)
  if (!res.ok) throw new Error('Failed to fetch DFS summary')
  return res.json()
}

export async function fetchTeam(userId) {
  const res = await fetch(`${BASE}/team?user_id=${userId}`)
  if (!res.ok) throw new Error('Failed to fetch team')
  return res.json()
}