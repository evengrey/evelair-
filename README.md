# MAD-LLM Hub

This project is a simple multi‑AI collaboration platform.  A FastAPI backend
handles chat between different agents and saves history to SQLite.  Two UIs are
provided:

* **Next.js frontend** located in `frontend/` (recommended)
* **Streamlit UI** in `ui.py` (optional demo)

## Run locally

### Backend
```bash
pip install -r requirements.txt
uvicorn app:app --reload
```
The API will be available at `http://localhost:8000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.  The frontend talks to the backend
at `localhost:8000`.

### Streamlit UI (optional)
```bash
streamlit run ui.py
```

## Docker
You can run both services with Docker Compose:
```bash
docker compose up --build
```
This starts the backend on port `8000` and the Next.js frontend on port `3000`.
