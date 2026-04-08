import { http } from "@/services/http";

async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    const r = await p;
    return r.data;
  } catch (e: any) {
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Request failed";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

type AnyApi = any;

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    unwrap<AnyApi>(http.post("/api/auth/register", data)),
  login: (email: string, password: string) =>
    unwrap<AnyApi>(http.post("/api/auth/login", { email, password })),
  me: () => unwrap<AnyApi>(http.get("/api/auth/me")),
  goals: () => unwrap<AnyApi>(http.get("/catalog/goals")),
  skills: (goal: string) =>
    unwrap<AnyApi>(http.get(`/catalog/skills/${encodeURIComponent(goal)}`)),
  saveGoalSkills: (data: { user_id: string; career_goal: string; selected_skills: string[] }) =>
    unwrap<AnyApi>(http.post("/user/goal-skills", data)),
  getGoalSkills: (userId: string) => unwrap<AnyApi>(http.get(`/user/goal-skills/${encodeURIComponent(userId)}`)),
  assessmentStart: (user_id: string, skills?: string[]) =>
    unwrap<AnyApi>(http.post("/assessment/start", { user_id, skills: skills ?? null })),
  assessmentAnswer: (session_id: string, question_id: string, selected_option: string) =>
    unwrap<AnyApi>(http.post("/assessment/answer", { session_id, question_id, selected_option })),
  assessmentFinalize: (session_id: string) =>
    unwrap<AnyApi>(http.post("/assessment/finalize", { session_id })),
  latestResult: (userId: string) =>
    unwrap<AnyApi>(http.get(`/assessment/latest-result/${encodeURIComponent(userId)}`)),
  generateRoadmap: (userId: string) =>
    unwrap<AnyApi>(http.post(`/roadmap/generate/${encodeURIComponent(userId)}`)),
  getRoadmap: (userId: string) => unwrap<AnyApi>(http.get(`/roadmap/${encodeURIComponent(userId)}`)),
  progressUpdate: (data: {
    user_id: string;
    item_id: string;
    item_type: "topic" | "project";
    completed: boolean;
    performance_score?: number | null;
  }) => unwrap<AnyApi>(http.post("/progress/update", data)),

  getDirectResources: (topic: string) =>
    unwrap<AnyApi>(http.get(`/api/resources?topic=${encodeURIComponent(topic)}`)),

  saveNotes: (data: { userId: string; topicId: string; notes: string }) =>
    unwrap<AnyApi>(http.post("/save-notes", data)),
  getNotes: (userId: string, topicId: string) =>
    unwrap<AnyApi>(http.get(`/save-notes?userId=${encodeURIComponent(userId)}&topicId=${encodeURIComponent(topicId)}`)),
  getSkillMapData: (userId: string) =>
    unwrap<AnyApi>(http.post("/get-skill-map-data", { userId })),
  updateGamification: (data: { userId: string; score: number; efficiency: number }) =>
    unwrap<AnyApi>(http.post("/update-gamification", data)),
  getGamification: (userId: string) =>
    unwrap<AnyApi>(http.get(`/update-gamification?userId=${encodeURIComponent(userId)}`)),

  dailyLogin: (userId: string) => unwrap<AnyApi>(http.post("/api/daily-login", { userId })),
  completeTopic: (userId: string, topicId: string) => unwrap<AnyApi>(http.post("/api/complete-topic", { userId, topicId })),
  profile: (userId: string) => unwrap<AnyApi>(http.get(`/api/profile/${encodeURIComponent(userId)}`)),
};
