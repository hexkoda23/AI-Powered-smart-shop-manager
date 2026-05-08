# Notable AI Shop Manager - Backend

FastAPI + SQLAlchemy backend. Supports SQLite for local development and PostgreSQL for Railway/cloud deployments.

## Local Development

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The default `.env` uses SQLite, so local development needs no database setup.

API docs are available at `http://localhost:8000/docs`.

## Railway Deployment

1. Push this repo to GitHub.
2. Create a Railway project and connect the GitHub repo.
3. Add a PostgreSQL plugin to the Railway project.
4. In the backend service variables, set:

```text
DATABASE_URL=${{ Postgres.DATABASE_URL }}
GROQ_API_KEY=<your key from console.groq.com>
```

Railway will redeploy after variable changes. Startup logs should show:

```text
Database tables ready.
Application startup complete.
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLite or PostgreSQL URL. Railway can set this automatically. |
| `GROQ_API_KEY` | AI API key from https://console.groq.com. |
