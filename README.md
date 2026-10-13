# DataSentry — Automated Data Quality Platform

DataSentry is a lightweight, automated data quality audit platform that identifies missing values, duplicate records, invalid formats, unstandardized text casing, and schema rule violations in CSV datasets.

---

## Key Features

- **Lightweight Minimalist UI**: Clean, Scandinavian-inspired light dashboard with intuitive typography, micro-interactions, and visual health indicators.
- **Pure SQLite Architecture**: Zero database configuration or external PostgreSQL services needed. Ready to run immediately.
- **Rich Operational Dashboard**:
  - **KPI Metrics**: Average quality score, total rows audited, flagged issues by severity, and active validation rules.
  - **1-Click Instant Sample Datasets**: Instant audits on bundled test datasets (*E-Commerce Customer Records* and *B2B Sales Transactions*).
  - **Drag-and-Drop CSV Scanner**: Fast file validation with file detail preview and animated status.
  - **Recent Audits & History**: Search, status filtering, one-click cleaned CSV downloads, and scan deletion.
- **Deep Column-Level Schema Profiling**: Inferred data types (Text, Integer, Float, Email, DateTime, Boolean), null percentages, uniqueness rates, distinct sample chips, and numeric ranges.
- **Interactive Validation Rules**: Create custom field policies (Required, Unique, Email, Allowed Values whitelist, Custom Regex) with active toggles and standard presets.
- **Cleaned Data Remediation**: Export cleaned CSVs with Standard (deduplicate and trim), Strict (drop incomplete rows), or Impute (fill default values) options.
- **Docker Ready**: One-command deployment using Docker & Docker Compose with Nginx reverse proxy.

---

## Quick Start with Docker

Ensure Docker Desktop is running, then run:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Local Development (Without Docker)

### 1. Backend (FastAPI + SQLite)

```bash
cd server
# Activate virtual environment
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # Linux / macOS

# Install dependencies (pure SQLite, no Postgres required)
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload --port 8000
```

Run automated backend tests:
```bash
pytest
```

### 2. Frontend (React + Vite + Tailwind CSS)

```bash
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

---

## Configuration

| Environment Variable | Service | Default | Description |
|----------------------|---------|---------|-------------|
| `DATABASE_URL` | Server | `sqlite:///./datasentry.db` | SQLite database URI |
| `CORS_ORIGINS` | Server | `http://localhost:5173,http://localhost:3000` | Allowed web origins |
| `VITE_API_URL` | Client | `http://127.0.0.1:8000` (dev) / `""` (docker) | Backend API URL |

---

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.0, Pandas, SQLite 3 (WAL mode)
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Deployment**: Docker, Multi-stage Node/Nginx, Docker Compose
