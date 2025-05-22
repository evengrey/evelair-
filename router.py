import json
from pathlib import Path
from typing import Dict, List

import anthropic
import google.generativeai as genai
from openai import OpenAI


class LLMRouter:
    """Load agent configs and dispatch calls to each API."""

    def __init__(self, agent_dir: str = "agents"):
        self.agent_dir = Path(agent_dir)
        self.clients: Dict[str, object] = {}
        self.agents: Dict[str, Dict] = {}
        self.load_agents()

    def load_agents(self):
        self.agents = {}
        for path in self.agent_dir.glob("*.json"):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.agents[data["name"]] = data

    def setup_clients(self, api_keys: Dict[str, str]):
        if "openai" in api_keys:
            self.clients["openai"] = OpenAI(api_key=api_keys["openai"])
        if "anthropic" in api_keys:
            self.clients["anthropic"] = anthropic.Anthropic(api_key=api_keys["anthropic"])
        if "gemini" in api_keys:
            genai.configure(api_key=api_keys["gemini"])
            self.clients["gemini"] = genai.GenerativeModel("gemini-pro")
        if "deepseek" in api_keys:
            # Placeholder for deepseek client
            self.clients["deepseek"] = None

    async def call_agent(self, agent_name: str, message: str, history: List[Dict]):
        agent = self.agents.get(agent_name)
        if not agent:
            return f"Agent {agent_name} not found"
        api = agent["api"]
        if api not in self.clients:
            return f"API {api} not configured"
        try:
            if api == "openai":
                msgs = self._format_openai(agent, message, history)
                resp = self.clients["openai"].chat.completions.create(
                    model=agent["model"],
                    messages=msgs,
                    **agent["params"],
                )
                return resp.choices[0].message.content
            if api == "anthropic":
                conv = self._format_anthropic(message, history)
                resp = self.clients["anthropic"].messages.create(
                    model=agent["model"],
                    system=agent["system_prompt"],
                    messages=[{"role": "user", "content": conv}],
                    **agent["params"],
                )
                return resp.content[0].text
            if api == "gemini":
                prompt = f"{agent['system_prompt']}\n\n{message}"
                resp = self.clients["gemini"].generate_content(prompt)
                return resp.text
            if api == "deepseek":
                return "(deepseek client not implemented)"
        except Exception as e:
            return f"❌ {agent_name} error: {e}"

    def _format_openai(self, agent, message, history):
        msgs = [
            {"role": "system", "content": agent["system_prompt"]}
        ]
        for h in history[-10:]:
            if h["speaker_type"] == "user":
                msgs.append({"role": "user", "content": h["content"]})
            else:
                msgs.append({"role": "assistant", "content": h["content"]})
        msgs.append({"role": "user", "content": message})
        return msgs

    def _format_anthropic(self, message, history):
        conv = ""
        for h in history[-10:]:
            role = "Human" if h["speaker_type"] == "user" else "Assistant"
            conv += f"{role}: {h['content']}\n\n"
        conv += f"Human: {message}\n\nAssistant: "
        return conv
