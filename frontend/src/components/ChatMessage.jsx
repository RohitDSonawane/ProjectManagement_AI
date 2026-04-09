import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a conversational chat message bubble.
 * role: 'ai' | 'user'
 */
export default function ChatMessage({ role, content }) {
  const isAI = role === 'ai'

  return (
    <div className={`chat-message ${role}`}>
      <div className={`message-avatar ${role}`}>
        {role === 'ai' ? '🤖' : '👤'}
      </div>
      <div className={`message-bubble ${isAI ? 'markdown-content' : ''}`}>
        {isAI ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content ?? '')}</ReactMarkdown>
        ) : (
          content
        )}
      </div>
    </div>
  )
}
