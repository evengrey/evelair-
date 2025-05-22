import requests
import streamlit as st
from datetime import datetime
import os

API_URL = "http://localhost:8000"

st.set_page_config(page_title="MAD-LLM Hub", layout="wide")
st.sidebar.empty()  # hide sidebar until user expands

st.title("🤖 MAD-LLM Hub")

with st.sidebar:
    st.header("Config")

    def get_key(label, env_var):
        env_val = os.getenv(env_var)
        if env_val:
            st.markdown(f"**{label} Key ✓**")
            return env_val
        return st.text_input(f"{label} API Key", type="password")

    openai_key     = get_key("OpenAI",      "OPENAI_API_KEY")
    anthropic_key  = get_key("Anthropic",   "ANTHROPIC_API_KEY")
    gemini_key     = get_key("Gemini",      "GEMINI_API_KEY")
    deepseek_key   = get_key("Deepseek",    "DEEPSEEK_API_KEY")

    thread_id = st.text_input("Thread ID", value="default")
    if st.button("New Thread"):
        thread_id = f"thread_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if st.button("Save Keys"):
        keys = {}
        if openai_key:
            keys["openai"] = openai_key
        if anthropic_key:
            keys["anthropic"] = anthropic_key
        if gemini_key:
            keys["gemini"] = gemini_key
        if deepseek_key:
            keys["deepseek"] = deepseek_key
        requests.post(f"{API_URL}/setup", json=keys)

    uploaded_file = st.file_uploader("Upload txt/md/pdf", type=["txt", "md", "pdf"])
    if uploaded_file is not None:
        res = requests.post(
            f"{API_URL}/upload",
            params={"thread_id": thread_id},
            files={"file": (uploaded_file.name, uploaded_file.getvalue())},
        )
        if res.ok:
            st.success(f"Uploaded. doc_id={res.json()['doc_id']}")
        else:
            st.error(res.text)

st.divider()

if "history" not in st.session_state and thread_id:
    res = requests.get(f"{API_URL}/history/{thread_id}")
    if res.ok:
        st.session_state.history = res.json()
    else:
        st.session_state.history = {"messages": [], "uploads": []}

if thread_id:
    history = requests.get(f"{API_URL}/history/{thread_id}").json()
    for msg in history["messages"]:
        if msg["speaker_type"] == "user":
            st.write(f"👤 **you**: {msg['content']}")
        else:
            st.write(f"🤖 **{msg['speaker_name']}**: {msg['content']}")
    if history.get("uploads"):
        st.write("**Files:**")
        for doc in history["uploads"]:
            st.write(f"📎 {doc['filename']} (doc_id={doc['doc_id']})")

st.divider()
user_input = st.text_area("Message (@agent)", height=100)
if st.button("Send") and user_input:
    res = requests.post(
        f"{API_URL}/chat",
        params={"thread_id": thread_id, "message": user_input},
    )
    if res.ok:
        history = requests.get(f"{API_URL}/history/{thread_id}").json()
        for msg in history["messages"]:
            if msg["speaker_type"] == "user":
                st.write(f"👤 **you**: {msg['content']}")
            else:
                st.write(f"🤖 **{msg['speaker_name']}**: {msg['content']}")
    else:
        st.error(res.text)
