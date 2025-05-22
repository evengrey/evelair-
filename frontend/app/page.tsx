'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Settings, Plus, Bot, User } from 'lucide-react'

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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState('default')
  const [agents, setAgents] = useState<Agent[]>([
    { name: 'claude', api: 'anthropic', model: 'claude-3-5-sonnet-20241022', system_prompt: '你是一个善于分析和批判性思考的AI助手。', enabled: true },
    { name: 'gpt', api: 'openai', model: 'gpt-4', system_prompt: '你是一个创造性和实用性并重的AI助手。', enabled: true },
    { name: 'gemini', api: 'gemini', model: 'gemini-1.5-pro', system_prompt: '你是一个注重逻辑和准确性的AI助手。', enabled: true }
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/history/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [threadId])

  const sendMessage = async () => {
    if (!input.trim()) return

    try {
      const response = await fetch(`http://localhost:8000/chat?thread_id=${threadId}&message=${encodeURIComponent(input)}`, {
        method: 'POST'
      })
      if (response.ok) {
        setInput('')
        await loadHistory()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const saveApiKeys = async () => {
    try {
      await fetch('http://localhost:8000/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeys)
      })
    } catch (error) {
      console.error('Failed to save API keys:', error)
    }
  }

  const updateAgent = (index: number, updates: Partial<Agent>) => {
    const newAgents = [...agents]
    newAgents[index] = { ...newAgents[index], ...updates }
    setAgents(newAgents)
  }

  const getAvatarColor = (name: string) => {
    const colors = ['bg-orange-400', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500']
    return colors[name.length % colors.length]
  }

  return (
    <div className="flex h-screen bg-background text-primary">
      {/* Left Sidebar - Chat History */}
      <div className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setThreadId(`thread_${Date.now()}`)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
        <div className="p-4 text-sm text-secondary">
          Thread: {threadId}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">MAD-LLM Hub</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className="flex gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                message.speaker_type === 'user' ? 'bg-accent' : getAvatarColor(message.speaker_name)
              }`}>
                {message.speaker_type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex-1">
                <div className="text-sm text-secondary mb-1 flex items-center gap-2">
                  <span>{message.speaker_type === 'user' ? 'You' : message.speaker_name}</span>
                  {message.timestamp && (
                    <span className="text-xs">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
                <div className="prose max-w-none">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message (@agent to mention specific AI)..."
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Agent Settings */}
      {showSettings && (
        <div className="w-80 bg-surface border-l border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Agent Configuration</h2>
          </div>

          {/* API Keys */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-secondary mb-3">API Keys</h3>
            <div className="space-y-3">
              {['openai', 'anthropic', 'gemini', 'deepseek'].map(api => (
                <div key={api}>
                  <label className="block text-sm mb-1 capitalize">{api}</label>
                  <input
                    type="password"
                    value={apiKeys[api] || ''}
                    onChange={(e) => setApiKeys({...apiKeys, [api]: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
              <button
                onClick={saveApiKeys}
                className="w-full px-3 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors text-sm"
              >
                Save Keys
              </button>
            </div>
          </div>

          {/* Agents */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-secondary mb-3">Agents</h3>
            <div className="space-y-4">
              {agents.map((agent, index) => (
                <div key={index} className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{agent.name}</span>
                    <input
                      type="checkbox"
                      checked={agent.enabled}
                      onChange={(e) => updateAgent(index, { enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="block text-secondary mb-1">Model</label>
                      <select
                        value={agent.model}
                        onChange={(e) => updateAgent(index, { model: e.target.value })}
                        className="w-full px-2 py-1 bg-surface border border-border rounded focus:outline-none focus:border-accent"
                      >
                        {modelOptions[agent.api]?.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-secondary mb-1">System Prompt</label>
                      <textarea
                        value={agent.system_prompt}
                        onChange={(e) => updateAgent(index, { system_prompt: e.target.value })}
                        rows={3}
                        className="w-full px-2 py-1 bg-surface border border-border rounded focus:outline-none focus:border-accent resize-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
