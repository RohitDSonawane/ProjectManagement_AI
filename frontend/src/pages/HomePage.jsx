import { useEffect, useRef, useState } from 'react'
import ChatInput, { SUGGESTED_PROMPTS } from '../components/ChatInput'
import ChatMessage from '../components/ChatMessage'
import CaseStudyCard from '../components/CaseStudyCard'
import LoadingState from '../components/LoadingState'
import { generateResponse, getBackendHealth, getPublicHistory } from '../api/client'

function mapHistoryToMessages(historyRows) {
  if (!Array.isArray(historyRows)) return []

  const messages = []

  for (const row of [...historyRows].reverse()) {
    if (row?.query) {
      messages.push({ role: 'user', type: 'chat', content: row.query })
    }

    const card = row?.card_json
    if (row?.route === 'chat' && card?.response) {
      messages.push({ role: 'ai', type: 'chat', content: card.response })
    } else if (row?.route === 'case_study' && card && typeof card === 'object') {
      messages.push({ role: 'ai', type: 'case_study', content: card })
    }
  }

  return messages
}

export default function HomePage() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [error, setError] = useState(null)
  const [connectionState, setConnectionState] = useState('checking')
  const [hasHydratedHistory, setHasHydratedHistory] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const bootstrap = async () => {
    setError(null)
    setIsBootstrapping(true)
    setConnectionState('checking')

    try {
      await getBackendHealth()
      setConnectionState('online')

      const historyResult = await getPublicHistory(8)
      const mapped = mapHistoryToMessages(historyResult?.history)
      if (mapped.length > 0) {
        setHasHydratedHistory(true)
        setMessages(mapped)
      }
    } catch (err) {
      setConnectionState('offline')
      setError(err.message || 'Unable to connect to backend. Make sure the API server is running on port 8000.')
    } finally {
      setIsBootstrapping(false)
    }
  }

  useEffect(() => {
    bootstrap()
  }, [])

  const handleSend = async (query) => {
    if (connectionState === 'offline') {
      setError('Backend is offline. Start the backend server, then retry.')
      return
    }

    setError(null)

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', type: 'chat', content: query }])
    setIsLoading(true)

    try {
      const result = await generateResponse(query)
      setConnectionState('online')

      if (result.type === 'chat') {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', type: 'chat', content: result.content },
        ])
      } else if (result.type === 'case_study') {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', type: 'case_study', content: result.content },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', type: 'chat', content: 'I received an unexpected response format.' },
        ])
      }
    } catch (err) {
      if (/fetch|network|failed/i.test(err.message || '')) {
        setConnectionState('offline')
      }
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  const isEmpty = messages.length === 0
  const connectionLabel =
    connectionState === 'online'
      ? 'Backend connected'
      : connectionState === 'offline'
      ? 'Backend offline'
      : 'Checking backend...'

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">🧠</div>
          <span className="header-logo-text">PM Learning Agent</span>
        </div>
        <div className="header-right">
          <span className="header-badge">AI Powered</span>
          <span className={`connection-pill ${connectionState}`}>{connectionLabel}</span>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        <div className="chat-container">
          {hasHydratedHistory && (
            <div className="history-chip">Loaded your recent conversation history</div>
          )}

          {/* Empty / Hero State */}
          {isEmpty && !isLoading && !isBootstrapping && (
            <div className="hero">
              <div className="hero-icon">🧠</div>
              <h1 className="hero-title">
                Learn PM Through Real-World Stories
              </h1>
              <p className="hero-subtitle">
                Ask about any Project Management concept and I'll generate an AI-powered
                case study grounded in real company examples.
              </p>
              <div className="suggested-prompts">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    className="suggested-prompt-btn"
                    disabled={connectionState !== 'online'}
                    onClick={() => handleSend(p.text)}
                  >
                    <span>{p.emoji}</span>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isBootstrapping && <LoadingState label="Connecting to backend and loading history..." />}

          {/* Messages */}
          {messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <ChatMessage key={idx} role="user" content={msg.content} />
              )
            }
            if (msg.type === 'chat') {
              return (
                <ChatMessage key={idx} role="ai" content={msg.content} />
              )
            }
            if (msg.type === 'case_study') {
              return (
                <CaseStudyCard key={idx} content={msg.content} />
              )
            }
            return null
          })}

          {/* Loading */}
          {isLoading && <LoadingState />}

          {/* Error */}
          {error && (
            <div className="error-banner" role="alert">
              <span>❌ {error}</span>
              <div className="error-actions">
                <button type="button" className="retry-btn" onClick={bootstrap}>
                  Retry connection
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        isDisabled={isBootstrapping || connectionState === 'offline'}
      />
    </div>
  )
}
