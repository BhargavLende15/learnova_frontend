import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import GoalSelection from './pages/GoalSelection'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/goal" element={<GoalSelection />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
