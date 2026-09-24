# 🏛 RMC System — UUM Research Management Centre

A full-stack MVP for Universiti Utara Malaysia's Research Management Centre. Manages research grants, milestones, outputs, and documents with role-based access control.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Role-Based Dashboards** | Separate UX for Researchers, RMC Admins, and Reviewers/Deans |
| **Grant Application Workflow** | Multi-step form, status pipeline: Draft → Pending → Under Review → Approved/Rejected |
| **Milestone Tracker** | Progress reports (6-month, 12-month, final), financial claims |
| **Research Output Repository** | Publications, conferences, patents — linked to grants for KPI tracking |
| **Secure Document Vault** | UUID-named files, MIME validation, outside-web-root storage |

---

## 🚀 Quick Start (Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- `libmagic` system library (`sudo apt-get install libmagic1`)

### Backend

```bash
cd backend
pip install -r requirements.txt
python run.py        # starts at http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # starts at http://localhost:5173
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Researcher | researcher@uum.edu.my | Researcher@123 |
| RMC Admin | admin@uum.edu.my | Admin@123 |
| Reviewer/Dean | dean@uum.edu.my | Dean@123 |

---

## 🐳 Production (Docker)

```bash
# Copy and fill in secrets
cp .env.example .env

# Generate secrets
python3 -c "import secrets; print(secrets.token_hex(32))"  # for SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"  # for JWT_SECRET_KEY

# Start everything
docker compose up -d

# App available at http://localhost:80
```

---

## 🌐 Free Deployment Options

### Option A — Railway (Recommended, easiest)

Railway supports Docker and PostgreSQL natively with a **free starter plan**.

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Railway auto-detects `docker-compose.yml` — click **Deploy**
4. Add a PostgreSQL plugin from the Railway dashboard
5. Set env vars: `JWT_SECRET_KEY`, `SECRET_KEY`, `CORS_ORIGINS`
6. Your app gets a free `*.up.railway.app` URL

### Option B — Render.com

1. Create account at [render.com](https://render.com)
2. **Backend**: New → Web Service → connect GitHub → Docker → set env vars
3. **Database**: New → PostgreSQL (free tier: 1 GB)
4. **Frontend**: New → Static Site → `frontend/` dir, build command `npm run build`, publish `dist/`
5. Free URLs: `*.onrender.com`

> ⚠️ Render free tier spins down after 15 min of inactivity.

### Option C — Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd backend
fly launch --no-deploy
fly secrets set JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
fly deploy

# Deploy frontend (static)
cd ../frontend
npm run build
fly launch --no-deploy
fly deploy
```

### Option D — Vercel + Supabase (Serverless approach)

- Frontend: [vercel.com](https://vercel.com) — drag & drop `frontend/dist/` or connect GitHub. **Free forever.**
- Backend: Convert Flask to serverless functions or keep on Render.
- Database: [supabase.com](https://supabase.com) — free PostgreSQL (500 MB).

### Option E — GitHub Pages (Frontend only)

```bash
cd frontend
npm run build
# Push `dist/` contents to your gh-pages branch
# Settings → Pages → Source: gh-pages branch
```

> Backend still needs Railway/Render/Fly for the API.

---

## 🏗 Architecture

```
rmc_mng/
├── backend/
│   ├── app/
│   │   ├── models/      # SQLAlchemy models (User, Grant, Milestone, ResearchOutput, Document)
│   │   ├── routes/      # Flask blueprints (auth, grants, milestones, outputs, documents, dashboard)
│   │   └── __init__.py  # App factory (JWT, CORS, rate limiting, security headers)
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/  # Sidebar, shared UI components
│   │   ├── context/     # AuthContext (in-memory JWT storage)
│   │   ├── pages/       # Dashboard, Grants, Milestones, Outputs, Documents
│   │   └── utils/       # API client, helpers
│   ├── nginx.conf
│   └── Dockerfile
├── uploads/             # File storage (outside web root)
├── docker-compose.yml
└── .env.example
```

---

## 🔒 Security Highlights

- **Argon2** password hashing (memory-hard, per-user salts)
- **JWT** tokens stored in-memory only (never `localStorage`)
- **Rate limiting** on all auth and mutation endpoints
- **MIME byte-level validation** for all file uploads (python-magic)
- **UUID filenames** — original names never used for storage
- **Path traversal prevention** — absolute path boundary checks
- **Security headers** — CSP, X-Frame-Options, nosniff on every response
- **Role-based authorization** server-side on every API route

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python / Flask 3.0 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | Flask-JWT-Extended + Argon2 |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Icons | Lucide React |
| Container | Docker + nginx |
