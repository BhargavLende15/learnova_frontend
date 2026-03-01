const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchApi(path: string, opts: RequestInit = {}) {
  const url = `${API}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  register: (data: { name: string; email: string; password: string; goal: string; current_level: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getQuestions: (goal: string) => fetchApi(`/assessment/questions/${encodeURIComponent(goal)}`),
  submitAssessment: (data: { user_id: string; answers: { skill: string; question_id: string; answer: string }[] }) =>
    fetchApi('/assessment/submit', { method: 'POST', body: JSON.stringify(data) }),
  getRoadmap: (userId: string) => fetchApi(`/roadmap/${userId}`),
  updateProgress: (data: { user_id: string; skill: string; completed: boolean; weeks_taken?: number }) =>
    fetchApi('/progress/update', { method: 'POST', body: JSON.stringify(data) }),
  mentorChat: (userId: string, message: string) =>
    fetchApi('/mentor/chat', { method: 'POST', body: JSON.stringify({ user_id: userId, message }) }),
};
