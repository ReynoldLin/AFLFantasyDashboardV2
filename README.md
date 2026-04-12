# AFL Fantasy Dashboard v2

A tool to view AFL Fantasy scores

## Getting Started

### Backend
```bash
python -m venv venv
venv\Scripts\Activate
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Historical Data
Player career history (2014–2025) is stored locally and needs to be generated once before the app can show it.

```bash
cd backend
python seed_history.py
```

This will fetch game-by-game stats for all ~791 players and save them to `backend/data/player_history.json`. It takes approximately 15–20 minutes to run.