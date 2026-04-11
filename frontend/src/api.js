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