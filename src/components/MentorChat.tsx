import { useState, useRef, useEffect } from 'react'
import { api } from '../api'

interface Props { userId: string }

export default function MentorChat({ userId }: Props) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!message.trim() || loading) return
    const userMsg = message.trim()
    setMessage('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const r = await api.mentorChat(userId, userMsg)
      setMessages(m => [...m, { role: 'assistant', text: r.reply }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: `Error: ${(e as Error).message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '0.75rem', color: 'var(--accent)' }}>AI Mentor Chatbot</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Ask: "What should I learn next?" or "I'm stuck" — get personalized advice.
      </p>
      <div style={{ maxHeight: '320px', overflowY: 'auto', background: 'var(--bg)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start a conversation with your AI mentor...</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '0.75rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-hover)',
              color: m.role === 'user' ? 'var(--bg)' : 'var(--text)',
              maxWidth: '85%',
            }}>
              {m.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>...</p>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask your AI mentor..."
          disabled={loading}
        />
        <button onClick={send} disabled={loading} style={{ minWidth: '100px' }}>Send</button>
      </div>
    </div>
  )
}
