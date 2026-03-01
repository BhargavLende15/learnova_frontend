import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import MentorChat from '../components/MentorChat'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ user_id: string; name: string; goal: string; current_level: string } | null>(null)
  const [roadmap, setRoadmap] = useState<{ skills_gap: string[]; roadmap: { month: number; skill: string }[]; progress: Record<string, { completed?: boolean }> } | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { navigate('/'); return }
    setUser(JSON.parse(u))
    const parsed = JSON.parse(u)
    api.getRoadmap(parsed.user_id).then(r => setRoadmap(r)).catch(() => setRoadmap(null))
  }, [navigate])

  if (!user) return null

  const completed = roadmap?.progress ? Object.entries(roadmap.progress).filter(([, p]) => p?.completed).length : 0
  const total = roadmap?.roadmap?.length || roadmap?.skills_gap?.length || 1
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Welcome, {user.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Goal: {user.goal} · Level: {user.current_level}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('user'); navigate('/'); }} style={{ background: 'var(--surface-hover)', color: 'var(--text)' }}>Logout</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Progress</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{pct}%</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Skills Learned</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{completed}</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Next Topic</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{roadmap?.roadmap?.[0]?.skill || roadmap?.skills_gap?.[0] || '—'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
        <div className="flex" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/goal"><button style={{ background: 'var(--surface-hover)', color: 'var(--text)' }}>Change Goal</button></Link>
          <Link to="/assessment"><button style={{ background: 'var(--surface-hover)', color: 'var(--text)' }}>Retake Assessment</button></Link>
          <Link to="/roadmap"><button>View Roadmap</button></Link>
        </div>
      </div>

      <div id="mentor">
        <MentorChat userId={user.user_id} />
      </div>
    </div>
  )
}
