import { useRef, useState } from 'react'

const SUGGESTED_PROMPTS = [
  { emoji: '⚡', text: 'Explain Agile methodology' },
  { emoji: '🔄', text: 'How does Scrum work?' },
  { emoji: '📋', text: 'What is Kanban?' },
  { emoji: '🎯', text: 'Risk management in projects' },
  { emoji: '🏃', text: 'Sprint planning best practices' },
  { emoji: '📊', text: 'Stakeholder management' },
]

export default function ChatInput({ onSend, isLoading, isDisabled = false }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const handleInput = (e) => {
    setValue(e.target.value)
    // Auto-resize
    const ta = textareaRef.current
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading || isDisabled) return
    onSend(trimmed)
    setValue('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="input-bar-wrapper">
      <div className="input-bar-inner">
        <div className="input-bar">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="chat-textarea"
            placeholder={
              isDisabled
                ? 'Backend is offline. Start backend and retry...'
                : 'Ask about any PM concept: Agile, Scrum, Kanban, Risk Management...'
            }
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading || isDisabled}
            aria-label="Chat input"
          />
          <button
            id="send-btn"
            className="send-btn"
            onClick={handleSend}
            disabled={!value.trim() || isLoading || isDisabled}
            aria-label="Send message"
            title="Send (Enter)"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
        <p className="input-hint">
          Press <kbd>Enter</kbd> to send and <kbd>Shift + Enter</kbd> for a new line
        </p>
      </div>
    </div>
  )
}

export { SUGGESTED_PROMPTS }
