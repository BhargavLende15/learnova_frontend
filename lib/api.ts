"use client";

import { http } from "@/services/http";

// ✅ Generic API response wrapper
type ApiResponse<T> = {
  data: T;
};

// ✅ Common error handler
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  try {
    const res = await promise;
    return res.data;
  } catch (e: any) {
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Something went wrong";

    throw new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail)
    );
  }
}

// ✅ Types
type AuthResponse = {
  token?: string;
  user?: any;
};

type RoadmapResponse = any;
type AssessmentResponse = any;
type NotesResponse = { notes: string };

export const api = {
  // 🔐 AUTH
  register: (data: { name: string; email: string; password: string }) =>
    unwrap<AuthResponse>(http.post("/api/auth/register", data)),

  login: (email: string, password: string) =>
    unwrap<AuthResponse>(
      http.post("/api/auth/login", { email, password })
    ),

  me: () => unwrap<any>(http.get("/api/auth/me")),

  // 🎯 GOALS & SKILLS
  goals: () => unwrap<any>(http.get("/catalog/goals")),

  skills: (goal: string) =>
    unwrap<any>(
      http.get(`/catalog/skills/${encodeURIComponent(goal)}`)
    ),

  saveGoalSkills: (data: {
  userId: string;
  career_goal: string;
  selected_skills: string[];
}) =>
  unwrap<any>(
    http.post("/user/goal-skills", {
      user_id: data.userId, // ✅ FIX
      career_goal: data.career_goal,
      selected_skills: data.selected_skills,
    })
  ),

  getGoalSkills: (userId: string) =>
    unwrap<any>(
      http.get(`/user/goal-skills/${encodeURIComponent(userId)}`)
    ),

  // 🧠 ASSESSMENT
  assessmentStart: (userId: string, skills?: string[]) =>
    unwrap<AssessmentResponse>(
      http.post("/assessment/start", {
        user_id: userId,
        skills: skills ?? null,
      })
    ),

  assessmentAnswer: (
    sessionId: string,
    questionId: string,
    selectedOption: string
  ) =>
    unwrap<AssessmentResponse>(
      http.post("/assessment/answer", {
        session_id: sessionId,
        question_id: questionId,
        selected_option: selectedOption,
      })
    ),

  assessmentFinalize: (sessionId: string) =>
    unwrap<AssessmentResponse>(
      http.post("/assessment/finalize", { session_id: sessionId })
    ),

  latestResult: (userId: string) =>
    unwrap<AssessmentResponse>(
      http.get(
        `/assessment/latest-result/${encodeURIComponent(userId)}`
      )
    ),

  // 🗺️ ROADMAP
  generateRoadmap: (userId: string) =>
    unwrap<RoadmapResponse>(
      http.post(`/roadmap/generate/${encodeURIComponent(userId)}`)
    ),

  getRoadmap: (userId: string) =>
    unwrap<RoadmapResponse>(
      http.get(`/roadmap/${encodeURIComponent(userId)}`)
    ),

  // 📈 PROGRESS
  progressUpdate: (data: {
    userId: string;
    itemId: string;
    itemType: "topic" | "project";
    completed: boolean;
    performanceScore?: number | null;
  }) =>
    unwrap<any>(
      http.post("/progress/update", {
        user_id: data.userId,
        item_id: data.itemId,
        item_type: data.itemType,
        completed: data.completed,
        performance_score: data.performanceScore ?? null,
      })
    ),

  completeTopic: (userId: string, topicId: string) =>
    unwrap<any>(
      http.post("/api/complete-topic", { userId, topicId })
    ),

  // 📝 NOTES
  saveNotes: (data: {
    userId: string;
    topicId: string;
    notes: string;
  }) =>
    unwrap<any>(http.post("/save-notes", data)),

  getNotes: (userId: string, topicId: string) =>
    unwrap<NotesResponse>(
      http.get(
        `/save-notes?userId=${encodeURIComponent(
          userId
        )}&topicId=${encodeURIComponent(topicId)}`
      )
    ),

  // 🧩 SKILL MAP
  getSkillMapData: (userId: string) =>
    unwrap<any>(
      http.post("/get-skill-map-data", { userId })
    ),

  // 🎮 GAMIFICATION
  updateGamification: (data: {
    userId: string;
    score: number;
    efficiency: number;
  }) =>
    unwrap<any>(
      http.post("/update-gamification", data)
    ),

  getGamification: (userId: string) =>
    unwrap<any>(
      http.get(
        `/update-gamification?userId=${encodeURIComponent(userId)}`
      )
    ),

  dailyLogin: (userId: string) => unwrap<AnyApi>(http.post("/api/daily-login", { userId })),
  completeTopic: (userId: string, topicId: string) => unwrap<AnyApi>(http.post("/api/complete-topic", { userId, topicId })),
  profile: (userId: string) => unwrap<AnyApi>(http.get(`/api/profile/${encodeURIComponent(userId)}`)),

  mentorChat: (userId: string, message: string) =>
    unwrap<AnyApi>(http.post("/mentor/chat", { user_id: userId, message })),

  generateResourcePack: (topic_name: string) =>
    unwrap<AnyApi>(http.post("/generate-resources", { topic_name })),
};
