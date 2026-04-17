"""
AFL Fantasy Dashboard — Backend API
────────────────────────────────────
Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
from datetime import datetime
import json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
import os
import cache

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AFL Fantasy Dashboard API",
    description="Live and historical AFL Fantasy player data.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ─────────────────────────────────────────────────────────────────

AFL_PLAYERS_URL = "https://fantasy.afl.com.au/json/fantasy/players.json"
AFL_ROUNDS_URL = "https://fantasy.afl.com.au/json/fantasy/rounds.json"
CACHE_KEY_PLAYERS = "players:live"
CACHE_KEY_ROUNDS = "rounds:live"
HISTORY_PATH = Path("data/player_history.json")
_history_cache = None
CACHE_KEY_DFS = "dfs:{player_id}"
CACHE_TTL = 180  # seconds (3 minutes)

SQUAD_NAMES: dict[int, str] = {
    10: "Adelaide Crows",    
    20: "Brisbane Lions",     
    30: "Carlton",
    40: "Collingwood", 
    50: "Essendon",  
    60: "Fremantle",
    70: "Geelong Cats",
    80: "Hawthorn",
    90: "Melbourne",
    100: "North Melbourne",
    110: "Port Adelaide",
    120: "Richmond",
    130: "St Kilda",
    140: "Western Bulldogs", 
    150: "West Coast Eagles",
    160: "Sydney Swans",
    1000: "Gold Coast",
    1010: "GWS Giants",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

async def fetch_players_raw() -> list[dict]:
    """
    Fetch player list from AFL Fantasy API, with in-memory caching.
    Returns the raw list enriched with teamName.
    """
    cached = cache.get(CACHE_KEY_PLAYERS)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(AFL_PLAYERS_URL)
            response.raise_for_status()
            players = response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AFL API timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"AFL API returned {e.response.status_code}.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach AFL API: {e}")

    # Enrich with human-readable team name
    for p in players:
        p["teamName"] = SQUAD_NAMES.get(p.get("squadId", 0), "Unknown")

    cache.set(CACHE_KEY_PLAYERS, players, ttl_seconds=CACHE_TTL)
    return players


def apply_filters(
    players: list[dict],
    position: Optional[str],
    squad_id: Optional[int],
    status: Optional[str],
    sort_by: str,
    limit: Optional[int],
) -> list[dict]:
    if position:
        players = [p for p in players if position.upper() in p.get("position", [])]
    if squad_id:
        players = [p for p in players if p.get("squadId") == squad_id]
    if status:
        players = [p for p in players if p.get("status", "").lower() == status.lower()]

    reverse = sort_by not in ("lastName", "firstName")
    players = sorted(players, key=lambda p: p.get(sort_by) or 0, reverse=reverse)

    if limit:
        players = players[:limit]

    return players

def load_history():
    global _history_cache
    if _history_cache is None:
        if not HISTORY_PATH.exists():
            raise HTTPException(status_code=404, detail="Historical data not found. Run seed_history.py first.")
        with open(HISTORY_PATH) as f:
            _history_cache = json.load(f)
    return _history_cache

# ── Live endpoints ────────────────────────────────────────────────────────────

@app.get("/api/players", summary="List players (live, cached 3 min)")
async def get_players(
    position: Optional[str] = Query(None, description="DEF | MID | RUC | FWD"),
    squad_id: Optional[int] = Query(None, description="Filter by team squad ID"),
    status: Optional[str]   = Query(None, description="active | injured | uncertain"),
    sort_by: str             = Query("averagePoints", description="Field to sort by"),
    limit: Optional[int]    = Query(None, description="Max results to return"),
):
    players = await fetch_players_raw()
    players = apply_filters(players, position, squad_id, status, sort_by, limit)
    return {
        "players": players,
        "total": len(players),
        "cached": cache.get(CACHE_KEY_PLAYERS) is not None,
        "fetched_at": datetime.utcnow().isoformat(),
    }


@app.get("/api/players/{player_id}", summary="Get a single player by ID")
async def get_player(player_id: int):
    players = await fetch_players_raw()
    player = next((p for p in players if p["id"] == player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found.")
    return player


@app.get("/api/stats/summary", summary="Aggregate stats for dashboard overview")
async def get_summary():
    players = await fetch_players_raw()
    active  = [p for p in players if (p.get("averagePoints") or 0) > 0]
    injured = [p for p in players if p.get("status") == "injured"]

    top_scorer = max(active, key=lambda p: p.get("averagePoints") or 0, default=None)
    valued = [p for p in active if (p.get("price") or 0) > 0 and (p.get("pricePerPoint") or 0) > 0]
    best_value = min(valued, key=lambda p: p.get("pricePerPoint") or float("inf"), default=None)

    position_avgs: dict[str, float] = {}
    for pos in ("DEF", "MID", "RUC", "FWD"):
        pos_players = [p for p in active if pos in p.get("position", [])]
        if pos_players:
            position_avgs[pos] = round(
                sum(p.get("averagePoints") or 0 for p in pos_players) / len(pos_players), 1
            )

    return {
        "totalPlayers":    len(players),
        "activePlayers":   len(active),
        "injuredPlayers":  len(injured),
        "topScorer": {
            "id":   top_scorer["id"] if top_scorer else None,
            "name": f"{top_scorer['firstName']} {top_scorer['lastName']}" if top_scorer else None,
            "avg":  top_scorer.get("averagePoints") if top_scorer else None,
        },
        "bestValue": {
            "id":           best_value["id"] if best_value else None,
            "name":         f"{best_value['firstName']} {best_value['lastName']}" if best_value else None,
            "pricePerPoint": best_value.get("pricePerPoint") if best_value else None,
        },
        "positionAverages": position_avgs,
        "fetched_at": datetime.utcnow().isoformat(),
    }


@app.get("/api/teams", summary="List all AFL teams")
async def get_teams():
    teams = [{"id": k, "name": v} for k, v in sorted(SQUAD_NAMES.items(), key=lambda x: x[1])]
    return {"teams": teams}

@app.get("/api/players/{player_id}/game_stats", summary="Get 2026 game stats for a player")
async def get_player_game_stats(player_id: int):
    url = f"https://fantasy.afl.com.au/json/fantasy/players_game_stats/2026/{player_id}.json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AFL API timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"AFL API returned {e.response.status_code}.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach AFL API: {e}")

@app.get("/api/rounds", summary="Get all rounds with status, byes and fixtures")
async def get_rounds():
    cached = cache.get(CACHE_KEY_ROUNDS)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(AFL_ROUNDS_URL)
            response.raise_for_status()
            rounds = response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AFL API timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"AFL API returned {e.response.status_code}.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach AFL API: {e}")

    # Build a lookup keyed by roundNumber for easy frontend use
    result = {}
    for r in rounds:
        rn = r["roundNumber"]
        # Which squads played in this round
        squads_played = set()
        for game in r.get("games", []):
            squads_played.add(game["homeId"])
            squads_played.add(game["awayId"])

        # Opponent lookup: squadId -> opponentId
        fixture = {}
        for game in r.get("games", []):
            fixture[game["homeId"]] = game["awayId"]
            fixture[game["awayId"]] = game["homeId"]

        result[rn] = {
            "roundNumber": rn,
            "name": r["name"],
            "status": r["status"],
            "byeSquads": r.get("byeSquads", []),
            "squadsPlayed": list(squads_played),
            "fixture": fixture,
            "games": r.get("games", [])
        }

    cache.set(CACHE_KEY_ROUNDS, result, ttl_seconds=CACHE_TTL)
    return result

@app.get("/api/players/{player_id}/history", summary="Get career history for a player")
async def get_player_history(player_id: int):
    history = load_history()
    data = history.get(str(player_id))
    if not data:
        raise HTTPException(status_code=404, detail=f"No history found for player {player_id}.")
    return data

@app.get("/api/players/{player_id}/dfs_summary", summary="Get detailed player summary from DFS Australia")
async def get_dfs_summary(player_id: int):
    cache_key = f"dfs:{player_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                "https://dfsaustralia.com/wp-admin/admin-ajax.php",
                data={
                    "action": "afl_fantasy_player_summary_call_mysql",
                    "playerId": f"CD_I{player_id}",
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": "https://dfsaustralia.com/afl-fantasy-player-summary/",
                    "User-Agent": "Mozilla/5.0",
                }
            )
            response.raise_for_status()
            data = response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="DFS Australia timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"DFS Australia returned {e.response.status_code}.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach DFS Australia: {e}")

    cache.set(cache_key, data, ttl_seconds=3600)
    return data

@app.get("/api/team", summary="Get AFL Fantasy team for a user")
async def get_team(user_id: int = Query(..., description="AFL Fantasy user ID")):
    url = f"https://fantasy.afl.com.au/api/en/fantasy/team/show?userId={user_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers={
                "Cookie": os.getenv("AFL_COOKIE", ""),
                "User-Agent": "Mozilla/5.0",
            })
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AFL API timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"AFL API returned {e.response.status_code}.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach AFL API: {e}")

# ── Debug / utility ───────────────────────────────────────────────────────────

@app.delete("/api/cache", summary="Manually clear the player cache")
async def clear_cache():
    cache.invalidate(CACHE_KEY_PLAYERS)
    return {"message": "Cache cleared."}


@app.get("/api/cache/info", summary="Inspect current cache state")
async def cache_info():
    return cache.info()


@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}