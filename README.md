# TalentBridge

**Your Talent. Your Network. Your Opportunity.**

TalentBridge is a professional networking and career platform for skilled refugees.
Built for the ILO Mini-Hackathon (Power Learn Project), theme *Unlocking Displaced Talent: Pathways for Skilled Refugees*.
Track 3: Local Experience & Professional Networks. SDGs 8, 10 and 17.

Live demo: https://talentbridge-ibra.netlify.app/

## The problem
Skilled refugees often have strong qualifications but no local network, no references and no simple way to show employers what they can do. Roadblocks push them into underemployment, or "brain waste".

## What it does
- Register and sign in as a job seeker, employer, mentor or admin
- Professional profile with skills, experience summary and CV upload (PDF, JPG, PNG, max 2 MB)
- Job, internship and fellowship listings with search
- Skills-based matching: every listing gets a score from the skills on your profile (matched skills divided by required skills)
- Applications with status tracking and withdrawal
- Mentor directory, mentorship requests and messaging
- Employer dashboard: post listings and search talent by skill
- Admin dashboard: listings, applications and mentor requests

## Two ways it runs
| Mode | Where | Data |
|---|---|---|
| **Demo mode** | The hosted site (static, no server) | Saved in your browser only |
| **Full mode** | Your computer with the FastAPI backend | Saved in a SQL database on the server |

Both modes use the same interface and the same API shape. In demo mode the API is simulated in the browser (`js/api.js`).

## Honest limits
- All jobs, employers, mentors and candidates are **demonstration data** and are labelled as such. No real vacancies, endorsements or placements are shown.
- TalentBridge does **not** verify credentials. That needs an authorised process and is on the roadmap.
- Demo mode keeps data in one browser. It is not shared between users or devices.

## Demo accounts (password for all: `TalentBridge-Demo-2026`)
| Role | Email |
|---|---|
| Job seeker | demo.seeker@talentbridge.demo |
| Employer | demo.employer@talentbridge.demo |
| Admin | demo.admin@talentbridge.demo |

Admin demo accounts exist only in demo mode and, in full mode, only when `SEED_DEMO_ADMIN=1` is set.

## Tech
- Frontend: HTML, CSS, JavaScript (no build step)
- Backend: Python FastAPI, SQLite, JWT sign-in, PBKDF2 password hashing, Pydantic validation, file type and size checks on uploads

## Run it locally (full mode)
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:JWT_SECRET="a-long-random-text"
$env:ADMIN_EMAILS="you@example.com"
uvicorn main:app --reload
```
Then open `index.html` with VS Code Live Server (http://localhost:5500). API docs: http://127.0.0.1:8000/docs.
The email in `ADMIN_EMAILS` becomes an admin when it registers or signs in.

## Deploy
- Frontend: any static host (Netlify, GitHub Pages). Publish the repository root, no build command.
- To use a real backend in production, deploy `backend/` to a Python host, set `JWT_SECRET`, `ADMIN_EMAILS` and `CORS_ORIGINS`, then put its address in `PROD_API` in `js/api.js`.
- For production data, move from SQLite to a managed database (for example PostgreSQL) and store uploads in object storage.

## Roadmap
Credential verification with authorised partners, managed database and file storage, employer verification, email notifications, more languages.

## Author
Ibrahim Abdikadir Dahir
