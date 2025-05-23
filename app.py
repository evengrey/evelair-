import asyncio
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid

from router import LLMRouter
from db import ConversationDB


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

router = LLMRouter()
db = ConversationDB()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.post("/setup")
async def setup(api_keys: dict):
    """Configure API keys for various services."""
    router.setup_clients(api_keys)
    return {"status": "ok"}


@app.post("/chat")
async def chat(thread_id: str, message: str):
    history = db.get_conversation(thread_id)
    db.save_message(thread_id, "user", "user", message)

    mentioned = [name for name in router.agents.keys() if f"@{name}" in message]
    if not mentioned:
        mentioned = list(router.agents.keys())

    async def run_agent(name):
        resp = await router.call_agent(name, message, history)
        db.save_message(thread_id, "agent", name, resp)
        return {"agent": name, "response": resp}

    tasks = [run_agent(n) for n in mentioned]
    results = await asyncio.gather(*tasks)
    return {"results": results}


@app.post("/upload")
async def upload(thread_id: str, file: UploadFile = File(...)):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    ext = Path(file.filename).suffix.lower()
    if ext not in {".txt", ".md", ".pdf"}:
        raise HTTPException(status_code=400, detail="Invalid file type")

    doc_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{doc_id}{ext}"
    with dest.open("wb") as f:
        content = await file.read()
        f.write(content)
    db.save_upload(doc_id, dest.name, thread_id)
    return {"doc_id": doc_id}


@app.get("/rag/query")
async def rag_query(doc_id: str, query: str):
    """Very naive text search over an uploaded document."""
    upload = db.get_upload(doc_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = UPLOAD_DIR / upload["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")

    text = file_path.read_text(encoding="utf-8", errors="ignore")
    matches = [
        line.strip()
        for line in text.splitlines()
        if query.lower() in line.lower()
    ]
    return {"doc_id": doc_id, "matches": matches[:5]}


@app.post("/canvas/annotate")
async def canvas_annotate(doc_id: str, annotation: dict):
    """Save an annotation JSON blob alongside the document."""
    path = UPLOAD_DIR / f"{doc_id}.annotations.json"
    existing = []
    if path.exists():
        existing = json.loads(path.read_text())
    existing.append(annotation)
    path.write_text(json.dumps(existing))
    return {"status": "saved", "count": len(existing)}


@app.get("/history/{thread_id}")
async def history(thread_id: str):
    return {"messages": db.get_conversation(thread_id), "uploads": db.list_uploads(thread_id)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
