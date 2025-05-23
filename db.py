import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List


class ConversationDB:
    def __init__(self, db_path: str = "hub.db"):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                speaker_type TEXT NOT NULL,
                speaker_name TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                thread_id TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        conn.commit()
        conn.close()

    def save_message(self, thread_id: str, speaker_type: str, speaker_name: str, content: str):
        conn = sqlite3.connect(self.db_path)
        message_id = f"{thread_id}_{datetime.now().isoformat()}"
        conn.execute(
            """
            INSERT INTO conversations
            (thread_id, message_id, speaker_type, speaker_name, content, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (thread_id, message_id, speaker_type, speaker_name, content, datetime.now().isoformat()),
        )
        conn.commit()
        conn.close()

    def get_conversation(self, thread_id: str) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            """
            SELECT speaker_type, speaker_name, content, timestamp
            FROM conversations
            WHERE thread_id = ?
            ORDER BY timestamp
            """,
            (thread_id,),
        )
        messages = [
            {
                "speaker_type": row[0],
                "speaker_name": row[1],
                "content": row[2],
                "timestamp": row[3],
            }
            for row in cursor.fetchall()
        ]
        conn.close()
        return messages

    def save_upload(self, doc_id: str, filename: str, thread_id: str):
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            INSERT INTO uploads (doc_id, filename, thread_id, timestamp)
            VALUES (?, ?, ?, ?)
            """,
            (doc_id, filename, thread_id, datetime.now().isoformat()),
        )
        conn.commit()
        conn.close()

    def list_uploads(self, thread_id: str) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            """
            SELECT doc_id, filename, timestamp
            FROM uploads
            WHERE thread_id = ?
            ORDER BY timestamp
            """,
            (thread_id,),
        )
        docs = [
            {"doc_id": row[0], "filename": row[1], "timestamp": row[2]}
            for row in cursor.fetchall()
        ]
        conn.close()
        return docs

    def get_upload(self, doc_id: str) -> Dict | None:
        """Return a single upload record by document id."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            """
            SELECT filename, thread_id, timestamp
            FROM uploads
            WHERE doc_id = ?
            """,
            (doc_id,),
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return {
                "doc_id": doc_id,
                "filename": row[0],
                "thread_id": row[1],
                "timestamp": row[2],
            }
        return None
