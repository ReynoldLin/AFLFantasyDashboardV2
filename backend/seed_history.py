import requests
import json
import os
import time
import argparse

PLAYERS_URL = "https://fantasy.afl.com.au/json/fantasy/players.json"
STATS_URL   = "https://fantasy.afl.com.au/json/fantasy/players_game_stats/{year}/{player_id}.json"
OUTPUT_PATH = "data/player_history.json"
MIN_YEAR    = 2014
MAX_YEAR    = 2025


# ── Fantasy score calculation ─────────────────────────────────────────────────

def calculate_fantasy_score(game):
    return (
        game.get("kicks", 0)         *  3 +
        game.get("handballs", 0)     *  2 +
        game.get("marks", 0)         *  3 +
        game.get("tackles", 0)       *  4 +
        game.get("freesFor", 0)      *  1 +
        game.get("freesAgainst", 0)  * -3 +
        game.get("hitouts", 0)       *  1 +
        game.get("goals", 0)         *  6 +
        game.get("behinds", 0)       *  1
    )


# ── Fetch one season for one player ──────────────────────────────────────────

def fetch_season_stats(player_id, year, delay):
    url = STATS_URL.format(year=year, player_id=player_id)
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 404:
            return []  # Player didn't exist / play that year
        else:
            print(f"    Warning: {url} returned {r.status_code}")
            return []
    except requests.exceptions.Timeout:
        print(f"    Timeout fetching {url}, skipping.")
        return []
    except Exception as e:
        print(f"    Error fetching {url}: {e}")
        return []
    finally:
        time.sleep(delay)


# ── Build full career history for one player ──────────────────────────────────

def build_player_history(player, delay):
    player_id = player["id"]
    seasons   = sorted([s for s in player.get("seasons", []) if MIN_YEAR <= s <= MAX_YEAR])

    history = []

    for year in seasons:
        games = fetch_season_stats(player_id, year, delay)
        if not games:
            continue

        def avg(key):
            vals = [g.get(key, 0) or 0 for g in games]
            return round(sum(vals) / len(vals), 1) if vals else 0

        scores      = [calculate_fantasy_score(g) for g in games]
        games_played = len(scores)
        season_avg  = round(sum(scores) / games_played, 1) if games_played > 0 else 0

        history.append({
            "year":         year,
            "games_played": games_played,
            "avg":          season_avg,
            "high":         max(scores),
            "low":          min(scores),
            "total":        sum(scores),
            "disposals":    avg("disposals"),
            "kicks":        avg("kicks"),
            "handballs":    avg("handballs"),
            "marks":        avg("marks"),
            "tackles":      avg("tackles"),
            "goals":        avg("goals"),
            "behinds":      avg("behinds"),
            "hitouts":      avg("hitouts"),
            "frees_for":    avg("freesFor"),
            "frees_against": avg("freesAgainst"),
            "games": [
                {
                    "roundNumber":   g.get("roundNumber"),
                    "score":         calculate_fantasy_score(g),
                    "disposals":     g.get("disposals"),
                    "kicks":         g.get("kicks"),
                    "handballs":     g.get("handballs"),
                    "marks":         g.get("marks"),
                    "tackles":       g.get("tackles"),
                    "goals":         g.get("goals"),
                    "behinds":       g.get("behinds"),
                    "hitouts":       g.get("hitouts"),
                    "freesFor":      g.get("freesFor"),
                    "freesAgainst":  g.get("freesAgainst"),
                    "timeOnGround":  g.get("timeOnGround"),
                    "opponentSquadId": g.get("opponentSquadId"),
                }
                for g in games
            ]
        })

    return history


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed AFL Fantasy historical data.")
    parser.add_argument("--test",  action="store_true", help="Only fetch first 10 players")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests in seconds (default: 0.1)")
    args = parser.parse_args()

    print("Fetching player list...")
    try:
        players = requests.get(PLAYERS_URL, timeout=10).json()
    except Exception as e:
        print(f"Failed to fetch players: {e}")
        return

    if args.test:
        players = players[:10]
        print(f"TEST MODE: running for first {len(players)} players only.")

    total = len(players)
    years_per_player = MAX_YEAR - MIN_YEAR + 1
    estimated = round(total * years_per_player * args.delay / 60, 1)
    print(f"{total} players × up to {years_per_player} years at {args.delay}s delay ≈ {estimated} min estimated\n")

    os.makedirs("data", exist_ok=True)

    # Load existing data so we can resume if interrupted
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH) as f:
            all_history = json.load(f)
        print(f"Resuming from existing file ({len(all_history)} players already done).\n")
    else:
        all_history = {}

    for i, p in enumerate(players):
        player_id  = str(p["id"])
        full_name  = f"{p['firstName']} {p['lastName']}"

        if player_id in all_history:
            print(f"  [{i+1}/{total}] {full_name} — already done, skipping.")
            continue

        print(f"  [{i+1}/{total}] {full_name}...")
        history = build_player_history(p, args.delay)

        if history:
            all_history[player_id] = history

        # Save incrementally every 25 players so progress isn't lost
        if (i + 1) % 25 == 0:
            with open(OUTPUT_PATH, "w") as f:
                json.dump(all_history, f)
            print(f"    Progress saved ({len(all_history)} players).")

    # Final save
    with open(OUTPUT_PATH, "w") as f:
        json.dump(all_history, f)

    print(f"\nDone. Saved history for {len(all_history)} players to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()