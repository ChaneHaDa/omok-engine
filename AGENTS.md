# Repository Guidelines

## Project Structure & Modules
- `backend/`: FastAPI WebSocket server
  - `main.py`: `/ws` endpoint; message loop and validation
  - `game.py`: `OmokGame` rules, board, win checks
  - `requirements.txt`, `Dockerfile`
- `frontend/`: Static client served by NGINX
  - `index.html`, `css/`, `js/script.js` (board rendering, WS client)
- Root: `docker-compose.yml` (backend + nginx), `nginx.conf`, `.gitignore`, `README.md`

## Build, Run, and Dev
- All services (recommended): `docker compose up --build`
  - Serves frontend on `http://localhost:8080` and WS backend on `ws://localhost:8000/ws` via NGINX proxy.
- Backend only (local dev):
  - `pip install -r backend/requirements.txt`
  - `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`
- Frontend only (quick preview): `python -m http.server 8080 -d frontend`
- Example WS payloads: place: `{"x":3,"y":4}`; new game: `{"action":"new_game"}`

## Coding Style & Naming
- Python: PEP 8, 4-space indents; `snake_case` for modules/functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.
- JavaScript/CSS: camelCase for variables/functions; kebab-case for CSS classes and files; keep functions small and DOM-safe.
- Keep backend types explicit where helpful; avoid broad `except Exception` in new code unless returning structured errors.

## Testing Guidelines
- No tests exist yet. Prefer `pytest` for backend with files under `backend/tests/` named `test_*.py`.
- Aim to cover `OmokGame.place_stone` and `check_win` edge cases (bounds, turns, consecutive counts).
- Run locally: `pytest` (after `pip install pytest`).

## Commit & PR Guidelines
- Commits: concise, imperative subject (≤72 chars). Conventional prefixes are welcome (e.g., `feat:`, `fix:`) as seen in history.
- PRs: include purpose, summary of changes, screenshots/GIFs for UI tweaks, and steps to verify (commands, inputs like `{x,y}` examples).
- Link issues where relevant. Keep PRs focused and small.

## Notes & Tips
- Production: remove `--reload` in Uvicorn; pin deps if stability matters.
- WebSocket path is `/ws`; NGINX proxies it (see `nginx.conf`). Keep responses JSON and backward compatible.
