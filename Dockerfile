FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir python-multipart

COPY . .

ENV PORT=8000
EXPOSE 8000 8501

CMD uvicorn app:app --host 0.0.0.0 --port $PORT & \
    streamlit run ui.py --server.port 8501 --server.address 0.0.0.0
