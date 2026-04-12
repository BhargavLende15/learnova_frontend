"use client";

import { useState, useEffect } from "react";
import { http } from "@/services/http";

export default function MentorPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uid = localStorage.getItem("learnova_user_id");
      setUserId(uid || "");
    }
  }, []);

  async function send() {
    if (!message) return;

    const res = await http.post("/mentor/chat", {
      user_id: userId,
      message,
    });

    setChat([...chat, { user: message, bot: res.data.reply }]);
    setMessage("");
  }

  return (
    <div className="container">
      <h1>AI Mentor 🤖</h1>

      <div>
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.user}</p>
            <p><b>Mentor:</b> {c.bot}</p>
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={send}>Send</button>
    </div>
  );
}