"""TalentBridge API (FastAPI + SQLite). Run: uvicorn main:app --reload"""
import os, uuid, sqlite3, hashlib, hmac, secrets
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

import jwt
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

DB_PATH = os.getenv("DB_PATH", "talentbridge.db")
SECRET = os.getenv("JWT_SECRET") or secrets.token_hex(32)  # set JWT_SECRET in production
ADMINS = {e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()}
ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
UPLOADS = Path(__file__).parent / "uploads"
UPLOADS.mkdir(exist_ok=True)
DEMO_IDS = set(range(1, 8))  # built-in demo listings in js/data.js
EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

app = FastAPI(title="TalentBridge API")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer(auto_error=False)


@contextmanager
def db():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()


SCHEMA = """
create table if not exists users(id integer primary key, name text not null, email text unique not null,
  pw text not null, role text not null, created text not null);
create table if not exists profiles(user_id integer primary key, name text default '', headline text default '',
  country text default '', skills text default '', bio text default '', cv text default '');
create table if not exists apps(id integer primary key, user_id integer not null, jid integer not null,
  st text not null, d text not null);
create table if not exists reqs(id integer primary key, user_id integer not null, mentor text not null,
  msg text not null, d text not null);
create table if not exists msgs(id integer primary key, user_id integer not null, mid text not null, body text not null);
create table if not exists notes(id integer primary key, user_id integer not null, body text not null);
create table if not exists listings(id integer primary key, user_id integer not null, t text not null,
  org text not null, type text not null, loc text not null, sk text not null);
"""
with db() as _c:
    _c.executescript(SCHEMA)


def hash_pw(p: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    return salt + "$" + hashlib.pbkdf2_hmac("sha256", p.encode(), salt.encode(), 200_000).hex()


def check_pw(p: str, stored: str) -> bool:
    salt, _ = stored.split("$", 1)
    return hmac.compare_digest(hash_pw(p, salt), stored)


def token_for(uid: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode({"sub": str(uid), "exp": exp}, SECRET, algorithm="HS256")


def current(cred: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not cred:
        raise HTTPException(401, "Sign in to continue.")
    try:
        uid = int(jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])["sub"])
    except Exception:
        raise HTTPException(401, "Your session expired. Sign in again.")
    with db() as c:
        u = c.execute("select * from users where id=?", (uid,)).fetchone()
    if not u:
        raise HTTPException(401, "Account not found.")
    return u


def note(c, uid, text):
    c.execute("insert into notes(user_id,body) values(?,?)", (uid, text))


today = lambda: datetime.now().strftime("%d/%m/%Y")


class Register(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["Job seeker", "Employer", "Mentor"]


class Login(BaseModel):
    email: str = Field(pattern=EMAIL, max_length=200)
    password: str = Field(min_length=1, max_length=128)


class Profile(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    headline: str = Field("", max_length=150)
    country: str = Field("", max_length=80)
    skills: str = Field("", max_length=500)
    bio: str = Field("", max_length=2000)


class Apply(BaseModel):
    jid: int


class MentorReq(BaseModel):
    mentor: str = Field(min_length=1, max_length=100)
    msg: str = Field(min_length=10, max_length=2000)


class Msg(BaseModel):
    mid: str = Field(pattern=r"^m[1-4]$")
    body: str = Field(min_length=1, max_length=2000)


class Listing(BaseModel):
    t: str = Field(min_length=2, max_length=150)
    type: Literal["Job", "Internship", "Fellowship"]
    sk: list[str] = Field(min_length=1, max_length=15)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/register")
def register(b: Register):
    email = b.email.lower()
    role = "Admin" if email in ADMINS else b.role
    with db() as c:
        if c.execute("select 1 from users where email=?", (email,)).fetchone():
            raise HTTPException(409, "An account with this email already exists. Sign in instead.")
        cur = c.execute("insert into users(name,email,pw,role,created) values(?,?,?,?,?)",
                        (b.name.strip(), email, hash_pw(b.password), role, datetime.utcnow().isoformat()))
        note(c, cur.lastrowid, "Welcome to TalentBridge. Complete your profile to see matches.")
        return {"token": token_for(cur.lastrowid)}


@app.post("/api/login")
def login(b: Login):
    with db() as c:
        u = c.execute("select * from users where email=?", (b.email.lower(),)).fetchone()
    if not u or not check_pw(b.password, u["pw"]):
        raise HTTPException(401, "Email or password is incorrect.")
    if u["email"] in ADMINS and u["role"] != "Admin":  # promote existing account listed in ADMIN_EMAILS
        with db() as c:
            c.execute("update users set role='Admin' where id=?", (u["id"],))
    return {"token": token_for(u["id"])}


@app.get("/api/state")
def state(u=Depends(current)):
    admin = u["role"] == "Admin"
    with db() as c:
        p = c.execute("select name,headline,country,skills,bio,cv from profiles where user_id=?", (u["id"],)).fetchone()
        apps = [dict(id=r["id"], jid=r["jid"], st=r["st"], d=r["d"])
                for r in c.execute("select * from apps where user_id=? order by id", (u["id"],))]
        q = "select * from reqs order by id" if admin else "select * from reqs where user_id=%d order by id" % u["id"]
        reqs = [dict(m=r["mentor"], msg=r["msg"], d=r["d"]) for r in c.execute(q)]
        msgs = {}
        for r in c.execute("select * from msgs where user_id=? order by id", (u["id"],)):
            msgs.setdefault(r["mid"], []).append(r["body"])
        notes = [r["body"] for r in c.execute("select body from notes where user_id=? order by id", (u["id"],))]
        extra = [dict(id=r["id"], t=r["t"], org=r["org"], type=r["type"], loc=r["loc"], sk=r["sk"].split(","))
                 for r in c.execute("select * from listings order by id")]
    return {"user": {"name": u["name"], "email": u["email"], "role": u["role"]},
            "prof": dict(p) if p else {}, "apps": apps, "reqs": reqs, "msgs": msgs, "notes": notes, "extra": extra}


@app.put("/api/profile")
def put_profile(b: Profile, u=Depends(current)):
    with db() as c:
        c.execute("""insert into profiles(user_id,name,headline,country,skills,bio) values(?,?,?,?,?,?)
          on conflict(user_id) do update set name=excluded.name, headline=excluded.headline,
          country=excluded.country, skills=excluded.skills, bio=excluded.bio""",
                  (u["id"], b.name.strip(), b.headline.strip(), b.country.strip(), b.skills.strip(), b.bio.strip()))
        note(c, u["id"], "Profile saved. Matches updated.")
    return {"ok": True}


MAGIC = {".pdf": b"%PDF", ".png": b"\x89PNG", ".jpg": b"\xff\xd8", ".jpeg": b"\xff\xd8"}


@app.post("/api/profile/cv")
async def upload_cv(file: UploadFile = File(...), u=Depends(current)):
    name = Path(file.filename or "").name
    ext = Path(name).suffix.lower()
    if ext not in MAGIC:
        raise HTTPException(400, "Use a PDF, JPG or PNG file.")
    data = await file.read(2_000_001)
    if len(data) > 2_000_000:
        raise HTTPException(400, "File is larger than 2 MB.")
    if not data.startswith(MAGIC[ext]):
        raise HTTPException(400, "File content does not match its type.")
    (UPLOADS / f"{u['id']}_{uuid.uuid4().hex}{ext}").write_bytes(data)
    with db() as c:
        c.execute("""insert into profiles(user_id,cv) values(?,?)
          on conflict(user_id) do update set cv=excluded.cv""", (u["id"], name[:100]))
    return {"ok": True}


@app.post("/api/apply")
def apply(b: Apply, u=Depends(current)):
    with db() as c:
        if b.jid not in DEMO_IDS and not c.execute("select 1 from listings where id=?", (b.jid,)).fetchone():
            raise HTTPException(404, "This listing no longer exists.")
        if c.execute("select 1 from apps where user_id=? and jid=? and st!='Withdrawn'", (u["id"], b.jid)).fetchone():
            raise HTTPException(409, "You already applied to this listing.")
        c.execute("insert into apps(user_id,jid,st,d) values(?,?,?,?)", (u["id"], b.jid, "Submitted", today()))
        note(c, u["id"], "Application submitted (demo listing).")
    return {"ok": True}


@app.post("/api/apps/{aid}/withdraw")
def withdraw(aid: int, u=Depends(current)):
    with db() as c:
        n = c.execute("update apps set st='Withdrawn' where id=? and user_id=?", (aid, u["id"])).rowcount
    if not n:
        raise HTTPException(404, "Application not found.")
    return {"ok": True}


@app.post("/api/mentor-requests")
def mentor_request(b: MentorReq, u=Depends(current)):
    with db() as c:
        c.execute("insert into reqs(user_id,mentor,msg,d) values(?,?,?,?)", (u["id"], b.mentor, b.msg.strip(), today()))
        note(c, u["id"], "Mentorship request sent (demo mentor).")
    return {"ok": True}


@app.post("/api/messages")
def message(b: Msg, u=Depends(current)):
    with db() as c:
        c.execute("insert into msgs(user_id,mid,body) values(?,?,?)", (u["id"], b.mid, b.body.strip()))
    return {"ok": True}


@app.post("/api/listings")
def add_listing(b: Listing, u=Depends(current)):
    if u["role"] not in ("Employer", "Admin"):
        raise HTTPException(403, "Only employer accounts can post listings.")
    sk = ",".join(s.strip().lower().replace(",", " ") for s in b.sk if s.strip())
    with db() as c:
        nid = max(1000, (c.execute("select coalesce(max(id),0) from listings").fetchone()[0]) + 1)
        c.execute("insert into listings(id,user_id,t,org,type,loc,sk) values(?,?,?,?,?,?,?)",
                  (nid, u["id"], b.t.strip(), u["name"] + " (demo)", b.type, "Demo", sk))
    return {"ok": True}


@app.delete("/api/listings/{lid}")
def del_listing(lid: int, u=Depends(current)):
    with db() as c:
        row = c.execute("select user_id from listings where id=?", (lid,)).fetchone()
        if not row:
            raise HTTPException(404, "Listing not found.")
        if row["user_id"] != u["id"] and u["role"] != "Admin":
            raise HTTPException(403, "You can only remove your own listings.")
        c.execute("delete from listings where id=?", (lid,))
    return {"ok": True}
