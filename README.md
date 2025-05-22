# MAD-LLM Hub

Phase 1 MVP for a multi‑AI collaboration platform.  The backend is written in
FastAPI and stores conversations in SQLite.  A simple Next.js interface lives in
the `frontend` folder.

## Requirements

- Python 3.11+
- Node.js 18+

## Quick start

### Backend

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

The API listens on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to use the web interface.  It connects to the
backend API running on port 8000.

### Docker

You can also start both services with Docker:

```bash
docker compose up --build
```

The frontend will be available on port 3000 and the backend on port 8000.

### Optional Streamlit UI

For comparison the original Streamlit client can still be launched with:

```bash
streamlit run ui.py
```
