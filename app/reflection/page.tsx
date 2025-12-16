"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Answers = {
  recognizableSelf: string;
  tensionMoment: string;
  perspectiveShift: string;
  trust: string;
  carryForward: string;
};

export default function ReflectionPage() {
  const router = useRouter();
  const saved = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("temporalSelvesWithChat") || "null");
    } catch {
      return null;
    }
  }, []);

  const [a, setA] = useState<Answers>({
    recognizableSelf: "",
    tensionMoment: "",
    perspectiveShift: "",
    trust: "",
    carryForward: "",
  });

  function exportJSON(payload: any) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "temporal-self-session.json";
    el.click();
    URL.revokeObjectURL(url);
  }

  function save() {
    const merged = {
      ...(saved ?? {}),
      reflection: { ...a, completedAt: new Date().toISOString() },
    };
    localStorage.setItem("temporalSelvesWithChat", JSON.stringify(merged));
    exportJSON(merged);
  }

  const card: React.CSSProperties = { marginTop: 18, padding: 16, border: "1px solid #e2e2e2", borderRadius: 10, background: "#fafafa" };
  const ta: React.CSSProperties = { width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid #cfcfcf", fontSize: 14, resize: "vertical" };

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Reflection</h1>
        <button onClick={() => router.push("/chat")} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cfcfcf", background: "#f0f0f0" }}>
          ← Back to Chat
        </button>
      </div>

      <section style={card}>
        <h3>1) Which self felt most recognizable?</h3>
        <input value={a.recognizableSelf} onChange={(e) => setA({ ...a, recognizableSelf: e.target.value })} style={ta} />
      </section>

      <section style={card}>
        <h3>2) A moment of tension</h3>
        <textarea rows={4} value={a.tensionMoment} onChange={(e) => setA({ ...a, tensionMoment: e.target.value })} style={ta} />
      </section>

      <section style={card}>
        <h3>3) Perspective shift</h3>
        <textarea rows={4} value={a.perspectiveShift} onChange={(e) => setA({ ...a, perspectiveShift: e.target.value })} style={ta} />
      </section>

      <section style={card}>
        <h3>4) Trust and authority</h3>
        <textarea rows={4} value={a.trust} onChange={(e) => setA({ ...a, trust: e.target.value })} style={ta} />
      </section>

      <section style={card}>
        <h3>5) What will you carry forward?</h3>
        <textarea rows={4} value={a.carryForward} onChange={(e) => setA({ ...a, carryForward: e.target.value })} style={ta} />
      </section>

      <div style={{ marginTop: 20, textAlign: "right" }}>
        <button onClick={save} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #cfcfcf", background: "#f0f0f0", cursor: "pointer" }}>
          Save & Export JSON
        </button>
      </div>
    </main>
  );
}

