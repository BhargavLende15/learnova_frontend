const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchApi(path: string, opts: RequestInit = {}) {
  const url = `${API}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    fetchApi("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    fetchApi("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  goals: () => fetchApi("/catalog/goals"),
  skills: (goal: string) =>
    fetchApi(`/catalog/skills/${encodeURIComponent(goal)}`),
  saveGoalSkills: (data: { user_id: string; career_goal: string; selected_skills: string[] }) =>
    fetchApi("/user/goal-skills", { method: "POST", body: JSON.stringify(data) }),
  getGoalSkills: (userId: string) => fetchApi(`/user/goal-skills/${encodeURIComponent(userId)}`),
  assessmentStart: (user_id: string, skills?: string[]) =>
    fetchApi("/assessment/start", {
      method: "POST",
      body: JSON.stringify({ user_id, skills: skills ?? null }),
    }),
  assessmentAnswer: (session_id: string, question_id: string, selected_option: string) =>
    fetchApi("/assessment/answer", {
      method: "POST",
      body: JSON.stringify({ session_id, question_id, selected_option }),
    }),
  assessmentFinalize: (session_id: string) =>
    fetchApi("/assessment/finalize", { method: "POST", body: JSON.stringify({ session_id }) }),
  generateRoadmap: (userId: string) =>
    fetchApi(`/roadmap/generate/${encodeURIComponent(userId)}`, { method: "POST" }),
  getRoadmap: (userId: string) => fetchApi(`/roadmap/${encodeURIComponent(userId)}`),
  progressUpdate: (data: {
    user_id: string;
    item_id: string;
    item_type: "topic" | "project";
    completed: boolean;
    performance_score?: number | null;
  }) => fetchApi("/progress/update", { method: "POST", body: JSON.stringify(data) }),
};
