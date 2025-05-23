'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Settings, Plus, Bot, User, Edit3, MessageSquare } from 'lucide-react'

interface Message {
  speaker_type: 'user' | 'agent'
  speaker_name: string
  content: string
  timestamp?: string
}

interface Agent {
  name: string
  api: string
  model: string
  system_prompt: string
  enabled: boolean
}

interface ModelOptions {
  [key: string]: string[]
}

const modelOptions: ModelOptions = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  deepseek: ['deepseek-chat', 'deepseek-coder']
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

const formatTimestamp = (isoTimestamp?: string): string => {
  if (!isoTimestamp) return '';
  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (error) {
    const timeMatch = String(isoTimestamp).match(/\d{1,2}:\d{2}/);
    if (timeMatch) return timeMatch[0];
    return '';
  }
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState('default_thread_123')
  const [threads, setThreads] = useState<string[]>(['default_thread_123', 'project_alpha_chat'])
  const [agents, setAgents] = useState<Agent[]>([
    { name: 'claude', api: 'anthropic', model: 'claude-3-5-sonnet-20241022', system_prompt: '你是一个善于分析和批判性思考的AI助手。', enabled: true },
    { name: 'gpt', api: 'openai', model: 'gpt-4', system_prompt: '你是一个创造性和实用性并重的AI助手。', enabled: true },
    { name: 'gemini', api: 'gemini', model: 'gemini-1.5-pro', system_prompt: '你是一个注重逻辑和准确性的AI助手。', enabled: true }
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storedKeys = localStorage.getItem('mad_llm_api_keys');
    if (storedKeys) {
      setApiKeys(JSON.parse(storedKeys));
    }
    const storedThreads = localStorage.getItem('mad_llm_threads');
    if (storedThreads) {
        const parsedThreads = JSON.parse(storedThreads);
        if (parsedThreads.length > 0) {
            setThreads(parsedThreads);
        }
    } else {
        localStorage.setItem('mad_llm_threads', JSON.stringify(threads));
    }
  }, []);

  const loadHistory = async (currentSelectedThreadId: string) => {
    if (!currentSelectedThreadId) return;
    try {
      const res = await fetch(`${API_BASE}/history/${currentSelectedThreadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        localStorage.setItem(`mad_llm_history_${currentSelectedThreadId}`, JSON.stringify(data.messages));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load history from API:', error);
      const storedMessages = localStorage.getItem(`mad_llm_history_${currentSelectedThreadId}`);
      if (storedMessages) setMessages(JSON.parse(storedMessages));
      else setMessages([]);
    }
  }

  useEffect(() => {
    loadHistory(threadId);
  }, [threadId]);

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      speaker_type: 'user',
      speaker_name: 'User',
      content: input,
      timestamp: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    localStorage.setItem(`mad_llm_history_${threadId}`, JSON.stringify(newMessages));
    setInput('');

    try {
      const res = await fetch(`${API_BASE}/chat?thread_id=${threadId}&message=${encodeURIComponent(input)}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        const agentResponses: Message[] = data.results.map((r: { agent: string, response: string }) => ({
          speaker_type: 'agent',
          speaker_name: r.agent,
          content: r.response,
          timestamp: new Date().toISOString()
        }))
        const finalMessages = [...newMessages, ...agentResponses]
        setMessages(finalMessages)
        localStorage.setItem(`mad_llm_history_${threadId}`, JSON.stringify(finalMessages))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(messages)
    }
  }

  const saveApiKeys = async () => {
    localStorage.setItem('mad_llm_api_keys', JSON.stringify(apiKeys));
    try {
      await fetch(`${API_BASE}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeys)
      })
    } catch (e) {
      console.error('Failed to send API keys to backend:', e)
    }
    alert('API Keys saved locally!');
  }

  const updateAgent = (index: number, updates: Partial<Agent>) => {
    const newAgents = [...agents]
    newAgents[index] = { ...newAgents[index], ...updates }
    setAgents(newAgents)
    localStorage.setItem('mad_llm_agents_config', JSON.stringify(newAgents));
  }

  useEffect(() => {
    const storedAgents = localStorage.getItem('mad_llm_agents_config');
    if (storedAgents) {
      setAgents(JSON.parse(storedAgents));
    }
  }, []);

  const getAvatarColor = (name: string) => {
    const colors = [
        'bg-red-300', 'bg-blue-300', 'bg-green-300', 
        'bg-yellow-300', 'bg-purple-300', 'bg-pink-300', 
        'bg-indigo-300', 'bg-teal-300'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }

  const createNewThread = () => {
    const newThreadName = `thread_${Date.now()}`;
    const updatedThreads = [...threads, newThreadName];
    setThreads(updatedThreads);
    setThreadId(newThreadName);
    localStorage.setItem('mad_llm_threads', JSON.stringify(updatedThreads));
    setMessages([]);
    localStorage.removeItem(`mad_llm_history_${newThreadName}`);
  };

  return (
    <div className="flex h-screen bg-background text-primary font-sans">
      <div className="w-72 bg-surface border-r border-border flex flex-col shadow-sm">
        <div className="p-4 border-b border-border">
          <button
            onClick={createNewThread}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <Plus size={18} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {threads.map(tId => (
                <button
                    key={tId}
                    onClick={() => setThreadId(tId)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors flex items-center gap-2.5
                        ${threadId === tId 
                            ? 'bg-accent/20 text-accent font-medium' 
                            : 'hover:bg-surface-hover text-secondary hover:text-primary'
                        }`}
                >
                    <MessageSquare size={16} className={threadId === tId ? 'text-accent' : 'text-secondary/80'} />
                    {tId.replace('thread_', 'Chat ')}
                </button>
            ))}
        </div>
        <div className="p-4 border-t border-border text-xs text-secondary">
          Current Thread ID: <span className="font-mono bg-background px-1 py-0.5 rounded">{threadId}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface shadow-sm">
          <h1 className="text-xl font-semibold text-primary">MAD-LLM Hub</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            className="p-2 hover:bg-surface-hover rounded-lg text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3.5 ${message.speaker_type === 'user' ? 'justify-end' : ''}`}>
              {message.speaker_type === 'agent' && (
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getAvatarColor(message.speaker_name)}`}>
                    <Bot size={18} />
                 </div>
              )}
              <div className={`max-w-xl lg:max-w-2xl ${message.speaker_type === 'user' ? 'order-2 items-end' : 'items-start'}`}>
                <div className="flex items-center mb-1.5">
                  <span className="text-sm font-medium text-primary">
                    {message.speaker_type === 'user' ? 'You' : message.speaker_name}
                  </span>
                  {message.timestamp && (
                    <span className="ml-2 text-xs text-secondary/80 font-mono">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  )}
                </div>
                <div 
                    className={`px-4 py-2.5 rounded-lg shadow-sm prose prose-sm max-w-none
                    ${message.speaker_type === 'user' 
                        ? 'bg-accent/80 text-white prose-invert' 
                        : 'bg-surface text-primary border border-border/70' 
                    }`}
                >
                  {message.content.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                </div>
              </div>
              {message.speaker_type === 'user' && (
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-accent order-1`}>
                    <User size={18} />
                 </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:p-6 border-t border-border bg-surface/70">
          <div className="flex items-center gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message (@agent to mention specific AI)..."
              rows={1}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none text-sm leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '150px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              title="Send Message"
              className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border">
                    <h2 className="text-lg font-semibold text-primary">Agent Configuration</h2>
                    <p className="text-sm text-secondary">Manage API keys and agent settings.</p>
                </div>
                
                <div className="overflow-y-auto p-5 space-y-6">
                    <div className="p-4 bg-background rounded-lg border border-border/70">
                        <h3 className="text-base font-medium text-primary mb-3">API Keys</h3>
                        <div className="space-y-3">
                        {['openai', 'anthropic', 'gemini', 'deepseek'].map(api => (
                            <div key={api}>
                            <label className="block text-sm font-medium text-secondary mb-1 capitalize">{api} Key</label>
                            <input
                                type="password"
                                value={apiKeys[api] || ''}
                                onChange={(e) => setApiKeys({...apiKeys, [api]: e.target.value})}
                                placeholder={`Enter your ${api} API key`}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            />
                            </div>
                        ))}
                        <button
                            onClick={saveApiKeys}
                            className="w-full mt-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                            Save API Keys (Locally)
                        </button>
                        </div>
                    </div>

                    <div className="p-4 bg-background rounded-lg border border-border/70">
                        <h3 className="text-base font-medium text-primary mb-3">Configure Agents</h3>
                        <div className="space-y-4">
                        {agents.map((agent, index) => (
                            <div key={index} className="p-3.5 bg-surface rounded-lg border border-border/50 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-primary">{agent.name}</span>
                                <input
                                type="checkbox"
                                checked={agent.enabled}
                                onChange={(e) => updateAgent(index, { enabled: e.target.checked })}
                                className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent focus:ring-offset-1 focus:ring-offset-surface"
                                />
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                <div>
                                <label className="block text-xs text-secondary mb-1">Provider</label>
                                 <select
                                    value={agent.api}
                                    onChange={(e) => {
                                        const newApi = e.target.value;
                                        const newModel = modelOptions[newApi]?.[0] || '';
                                        updateAgent(index, { api: newApi, model: newModel });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-xs"
                                >
                                    {Object.keys(modelOptions).map(apiName => (
                                        <option key={apiName} value={apiName}>{apiName}</option>
                                    ))}
                                </select>
                                </div>

                                <div>
                                <label className="block text-xs text-secondary mb-1">Model</label>
                                <select
                                    value={agent.model}
                                    onChange={(e) => updateAgent(index, { model: e.target.value })}
                                    disabled={!modelOptions[agent.api] || modelOptions[agent.api].length === 0}
                                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-xs"
                                >
                                    {modelOptions[agent.api]?.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                    )) || <option value="">No models available</option>}
                                </select>
                                </div>
                                
                                <div>
                                <label className="block text-xs text-secondary mb-1">System Prompt</label>
                                <textarea
                                    value={agent.system_prompt}
                                    onChange={(e) => updateAgent(index, { system_prompt: e.target.value })}
                                    rows={3}
                                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none text-xs leading-relaxed"
                                />
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t border-border bg-surface/50 flex justify-end">
                    <button
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
