"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Stored = {
  sessionId: string;
  createdAt: string;
  pastSelf: { name: string; shortBio: string };
  futureSelf: { name: string; shortBio: string };
};

type Msg = { role: "user" | "assistant"; content: string; ts: number };

const bubbleBase: React.CSSProperties = {
  maxWidth: "80%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e2e2e2",
  whiteSpace: "pre-wrap",
  lineHeight: 1.35,
  fontSize: 14,
};

export default function ChatPage() {
  const router = useRouter();
  const [data, setData] = useState<Stored | null>(null);
  const [active, setActive] = useState<"past" | "future">("past");
  const [pastMsgs, setPastMsgs] = useState<Msg[]>([]);
  const [futureMsgs, setFutureMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const sendingRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem("temporalSelves");
    if (!raw) return;
    const parsed = JSON.parse(raw) as Stored;
    setData(parsed);

    const p0: Msg = {
      role: "assistant",
      content: `Hi — I’m your past self “${parsed.pastSelf.name}”.\nWhat’s bothering you right now?`,
      ts: Date.now(),
    };
    const f0: Msg = {
      role: "assistant",
      content: `Hi — I’m your future self “${parsed.futureSelf.name}”.\nWhat’s bothering you right now?`,
      ts: Date.now(),
    };
    setPastMsgs([p0]);
    setFutureMsgs([f0]);
  }, []);

  const currentMsgs = active === "past" ? pastMsgs : futureMsgs;

  const systemPrompt = useMemo(() => {
    if (!data) return "";
    const self = active === "past" ? data.pastSelf : data.futureSelf;
    return `
You are the user's ${active} self.
Name: ${self.name}
Short bio: ${self.shortBio}

Speak in first person. Be reflective and supportive.
Ask at most one gentle follow-up question.
Keep replies concise (2–6 sentences).
`.trim();
  }, [data, active]);

  async function callLLM(userText: string, history: Msg[]): Promise<string> {
    const messages = history
      .filter((m) => m.content !== "…")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("/api/openai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        messages: [...messages, { role: "user", content: userText }],
      }),
    });

    if (!res.ok) return "Sorry — I’m having trouble responding right now.";
    const json = await res.json();
    return (json?.content ?? "…").toString().trim() || "…";
  }

  async function send() {
    const text = input.trim();
    if (!text || !data) return;
    if (sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Msg = { role: "user", content: text, ts: Date.now() };
    const thinking: Msg = { role: "assistant", content: "…", ts: Date.now() + 1 };

    if (active === "past") setPastMsgs((m) => [...m, userMsg, thinking]);
    else setFutureMsgs((m) => [...m, userMsg, thinking]);

    setInput("");

    const history = active === "past" ? [...pastMsgs, userMsg] : [...futureMsgs, userMsg];
    const reply = await callLLM(text, history);
    const assistantMsg: Msg = { role: "assistant", content: reply, ts: Date.now() + 2 };

    if (active === "past") {
      setPastMsgs((m) => {
        const mm = [...m];
        mm[mm.length - 1] = assistantMsg;
        return mm;
      });
    } else {
      setFutureMsgs((m) => {
        const mm = [...m];
        mm[mm.length - 1] = assistantMsg;
        return mm;
      });
    }

    // persist
    localStorage.setItem(
      "temporalSelvesWithChat",
      JSON.stringify({
        ...data,
        chat: { past: active === "past" ? [...history, assistantMsg] : pastMsgs, future: active === "future" ? [...history, assistantMsg] : futureMsgs },
        updatedAt: new Date().toISOString(),
      })
    );

    sendingRef.current = false;
  }

  function next() {
    router.push("/reflection");
  }

  if (!data) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <h1>Chat</h1>
        <p>No profile found. Go back to Customize.</p>
        <button onClick={() => router.push("/")} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cfcfcf", background: "#f0f0f0" }}>
          Back
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Chat</h1>
        <button onClick={next} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cfcfcf", background: "#f0f0f0", cursor: "pointer" }}>
          Next → Reflection
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Tab active={active === "past"} title={`Past: ${data.pastSelf.name}`} onClick={() => setActive("past")} />
        <Tab active={active === "future"} title={`Future: ${data.futureSelf.name}`} onClick={() => setActive("future")} />
      </div>

      <div style={{ marginTop: 14, height: 420, border: "1px solid #e2e2e2", borderRadius: 10, padding: 12, overflowY: "auto", background: "#fff" }}>
        {currentMsgs.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ ...bubbleBase, background: isUser ? "#f0f0f0" : "#fafafa" }}>{m.content}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #cfcfcf", fontSize: 14 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button onClick={() => void send()} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #cfcfcf", background: "#f0f0f0", cursor: "pointer" }}>
          Send
        </button>
      </div>
    </main>
  );
}

function Tab(props: { active: boolean; title: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #cfcfcf",
        background: props.active ? "#f0f0f0" : "#fafafa",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {props.title}
    </button>
  );
}
