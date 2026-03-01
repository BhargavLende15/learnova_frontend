import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

interface Question { skill: string; question_id: string; question: string }

export default function Assessment() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ user_id: string; goal: string } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { navigate('/'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    api.getQuestions(parsed.goal || 'Data Scientist').then(r => setQuestions(r.questions || [])).catch(e => setErr((e as Error).message))
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setErr('')
    setLoading(true)
    try {
      const ans = Object.entries(answers).map(([qid, answer]) => {
        const q = questions.find(x => x.question_id === qid)
        return { skill: q?.skill || '', question_id: qid, answer }
      }).filter(a => a.answer.trim())
      await api.submitAssessment({ user_id: user.user_id, answers: ans })
      setSubmitted(true)
      setTimeout(() => navigate('/roadmap'), 1500)
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  if (questions.length === 0 && !err) return <div className="container">Loading questions...</div>

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Diagnostic Assessment</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Answer based on your knowledge. Scores will determine your skill profile.</p>

      {submitted ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--success)' }}>Assessment submitted! Redirecting to your roadmap...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: '1.5rem' }}>
            {questions.map((q, i) => (
              <div key={q.question_id} className="card">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{q.skill}</p>
                <p style={{ marginBottom: '0.75rem' }}><strong>Q{i + 1}:</strong> {q.question}</p>
                <textarea
                  value={answers[q.question_id] || ''}
                  onChange={e => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                  placeholder="Your answer..."
                  rows={2}
                />
              </div>
            ))}
          </div>
          {err && <p style={{ color: '#f87171', marginTop: '1rem' }}>{err}</p>}
          <button type="submit" disabled={loading} style={{ marginTop: '1.5rem' }}>{loading ? 'Submitting...' : 'Submit Assessment'}</button>
        </form>
      )}
      <div style={{ marginTop: '2rem' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  )
}
