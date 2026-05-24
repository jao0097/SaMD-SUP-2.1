# Repository Guidelines

## Project Structure & Module Organization
- `super.py`: main CLI entrypoint (`sup`) for querying and indexing the RAG base.
- `web_api.py`: FastAPI service exposing health/status and query endpoints.
- `test_api.py`: API smoke tests (auth, status, rate-limit, UI route checks).
- `templates/` and `static/`: web UI HTML/CSS/JS assets.
- `docker-compose.yml` and `Dockerfile`: local/container deployment (`chroma` + `sup-web`).
- Utility scripts: `reindexar_pdfs.py`, `limpar_transcricao_yt_paralelo.py`, `atualizar_jsons_apos_limpeza.py`.

Keep indexed content in `RAG_PASTA_SAIDA` as `<slug>.txt` + `<slug>.json`.

## Build, Test, and Development Commands
- Install deps: `pip install -r requirements_web.txt`
- CLI help: `python3 super.py --help`
- Run local API: `uvicorn web_api:app --reload --port 8000`
- Docker stack: `docker compose up --build`
- API tests: `WEB_TOKEN=... python3 test_api.py`

Useful indexing flows:
- Convert orphan text files: `python3 super.py --gerar-json-locais`
- Index local files: `python3 super.py --local`
- Reindex one URL: `python3 super.py --reindexar "https://..."`

## Coding Style & Naming Conventions
- Python: 4-space indentation, `snake_case` for functions/variables, descriptive Portuguese domain names are acceptable and already used.
- Prefer small, single-purpose functions; keep CLI option behavior explicit and stable.
- Preserve current filename patterns and slug-based output naming.
- Avoid logging secrets; never print or persist `WEB_TOKEN` or raw API keys.

## Testing Guidelines
- Primary test entry is `test_api.py` (smoke/integration style).
- Always set `WEB_TOKEN` before running protected-route tests.
- For API changes, validate:
  - `/health` works without DB-heavy checks.
  - `/status` enforces token auth.
  - Rate limiting remains at expected behavior.

## Commit & Pull Request Guidelines
- Current history is minimal (`first`), so adopt clear conventional messages now, e.g.:
  - `feat(api): add status payload for index health`
  - `fix(cli): handle orphan txt metadata generation`
- PRs should include:
  - Scope and rationale
  - Commands run (tests/manual checks)
  - Env/config changes (`RAG_*`, `GROQ_*`, `WEB_TOKEN`)
  - Screenshots only for UI/template changes

## Security & Configuration Notes
- `WEB_TOKEN` is required for protected FastAPI routes; missing token should return `503` where defined.
- Use `.env` for secrets and runtime config.
- Groq key rotation supports `GROQ_API_KEYS` or numbered `GROQ_API_KEY_*` vars.
