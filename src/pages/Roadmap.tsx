import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

interface Milestone { month: number; skill: string; reason?: string }

export default function Roadmap() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ user_id: string } | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [data, setData] = useState<{
    goal: string
    current_level: string
    skills_gap: string[]
    roadmap: Milestone[]
    progress: Record<string, { completed?: boolean }>
    explanation?: string
    agent_analysis?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { navigate('/'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    api.getRoadmap(parsed.user_id).then(setData).catch(e => setErr((e as Error).message)).finally(() => setLoading(false))
  }, [navigate])

  if (!user) return null

  if (loading) return <div className="container" style={{ paddingTop: '3rem' }}>Generating your roadmap...</div>
  if (err) return <div className="container" style={{ paddingTop: '3rem', color: '#f87171' }}>{err}</div>
  if (!data) return null

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Your Learning Roadmap</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Goal: {data.goal} · Level: {data.current_level}</p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', color: 'var(--accent)' }}>Skills Gap</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Skills to develop for your target role:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {data.skills_gap.map(s => <span key={s} style={{ background: 'var(--surface-hover)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem' }}>{s}</span>)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', color: 'var(--accent)' }}>Timeline (Explainable AI)</h3>
        <div className="grid" style={{ gap: '1rem' }}>
          {data.roadmap.map(m => {
            const done = data.progress[m.skill]?.completed
            return (
              <div key={m.month} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', opacity: done ? 0.7 : 1 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: '80px' }}>Month {m.month}</span>
                <div style={{ flex: 1 }}>
                  <strong>{m.skill}</strong> {done && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Done</span>}
                  {m.reason && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{m.reason}</p>}
                </div>
                {!done && (
                  <button
                    onClick={async () => {
                      setUpdating(m.skill)
                      try {
                        await api.updateProgress({ user_id: user!.user_id, skill: m.skill, completed: true, weeks_taken: 4 })
                        setData(d => d ? { ...d, progress: { ...d.progress, [m.skill]: { completed: true } } } : d)
                      } finally { setUpdating(null) }
                    }}
                    disabled={updating === m.skill}
                    style={{ background: 'var(--success)', color: '#000', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    {updating === m.skill ? '...' : 'Mark done'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {data.explanation && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Why this order?</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{data.explanation}</p>
        </div>
      )}

      {data.agent_analysis && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>AI Skill Analysis</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{data.agent_analysis}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/dashboard"><button style={{ background: 'var(--surface-hover)', color: 'var(--text)' }}>← Dashboard</button></Link>
        <Link to="/dashboard#mentor"><button>Chat with AI Mentor</button></Link>
      </div>
    </div>
  )
}
