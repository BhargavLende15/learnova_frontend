import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Home() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', goal: 'Data Scientist', current_level: 'Beginner' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const r = await api.login(form.email, form.password)
        localStorage.setItem('user', JSON.stringify(r))
        navigate('/dashboard')
      } else {
        const r = await api.register(form)
        localStorage.setItem('user', JSON.stringify(r))
        navigate('/assessment')
      }
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>Learnova</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Career Roadmap AI · Skill Gap Analysis · AI Mentor</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button type="button" onClick={() => setMode('login')} style={{ flex: 1, background: mode === 'login' ? 'var(--accent)' : 'var(--surface-hover)', color: mode === 'login' ? 'var(--bg)' : 'var(--text)' }}>
            Login
          </button>
          <button type="button" onClick={() => setMode('register')} style={{ flex: 1, background: mode === 'register' ? 'var(--accent)' : 'var(--surface-hover)', color: mode === 'register' ? 'var(--bg)' : 'var(--text)' }}>
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Career Goal</label>
                <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Web Developer">Web Developer</option>
                  <option value="AI Engineer">AI Engineer</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Current Level</label>
                <select value={form.current_level} onChange={e => setForm({ ...form, current_level: e.target.value })}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </>
          )}
          {err && <p style={{ color: '#f87171' }}>{err}</p>}
          <button type="submit" disabled={loading}>{loading ? '...' : mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
      </div>
      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        After login: <Link to="/goal">Select Goal</Link> → <Link to="/assessment">Assessment</Link> → <Link to="/roadmap">Roadmap</Link>
      </p>
    </div>
  )
}
