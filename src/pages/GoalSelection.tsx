import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function GoalSelection() {
  const navigate = useNavigate()

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) navigate('/')
  }, [navigate])

  const goals = [
    { id: 'Data Scientist', desc: 'Python, Statistics, ML, SQL' },
    { id: 'Web Developer', desc: 'HTML, CSS, JS, React, Node' },
    { id: 'AI Engineer', desc: 'Python, ML, DL, TensorFlow, PyTorch' },
  ]

  const handleSelect = (goal: string) => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    u.goal = goal
    localStorage.setItem('user', JSON.stringify(u))
    navigate('/assessment')
  }

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Select Career Goal</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Choose your target role for personalized skill assessment</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {goals.map(g => (
          <div key={g.id} className="card" style={{ cursor: 'pointer' }} onClick={() => handleSelect(g.id)}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{g.id}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{g.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  )
}
