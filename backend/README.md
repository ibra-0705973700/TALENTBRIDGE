# TalentBridge backend (FastAPI + SQLite)

    cd backend
    python -m venv .venv
    .venv\Scripts\activate        # Windows  (macOS/Linux: source .venv/bin/activate)
    pip install -r requirements.txt
    set JWT_SECRET=long-random-text      # PowerShell: $env:JWT_SECRET="long-random-text"
    set ADMIN_EMAILS=you@example.com     # this email becomes Admin when it registers
    uvicorn main:app --reload

API docs: http://127.0.0.1:8000/docs
Frontend: open the project folder with VS Code Live Server (port 5500).
In production, move to MySQL/PostgreSQL with Alembic migrations, store uploads in object storage, add rate limiting, and serve over HTTPS.
