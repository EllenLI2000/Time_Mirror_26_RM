
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TemporalSelf = {
  name: string;
  shortBio: string;
};

export default function Page() {
  const router = useRouter();
  const [past, setPast] = useState<TemporalSelf>({ name: "", shortBio: "" });
  const [future, setFuture] = useState<TemporalSelf>({ name: "", shortBio: "" });

  const canGo =
    past.name.trim() && past.shortBio.trim() && future.name.trim() && future.shortBio.trim();

  function next() {
    const sessionId =
      localStorage.getItem("sessionId") ??
      (() => {
        const id = crypto.randomUUID();
        localStorage.setItem("sessionId", id);
        return id;
      })();

    localStorage.setItem(
      "temporalSelves",
      JSON.stringify({
        sessionId,
        createdAt: new Date().toISOString(),
        pastSelf: past,
        futureSelf: future,
      })
    );
    router.push("/chat");
  }

  const box: React.CSSProperties = {
    border: "1px solid #e2e2e2",
    borderRadius: 10,
    padding: 16,
    background: "#fafafa",
  };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cfcfcf",
    fontSize: 14,
  };

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Customize Past & Future Selves</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Past self</h2>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Name (required)</div>
            <input style={input} value={past.name} onChange={(e) => setPast({ ...past, name: e.target.value })} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Short bio (required)</div>
            <input
              style={input}
              value={past.shortBio}
              onChange={(e) => setPast({ ...past, shortBio: e.target.value })}
              placeholder="1–2 sentences"
            />
          </div>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Future self</h2>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Name (required)</div>
            <input style={input} value={future.name} onChange={(e) => setFuture({ ...future, name: e.target.value })} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Short bio (required)</div>
            <input
              style={input}
              value={future.shortBio}
              onChange={(e) => setFuture({ ...future, shortBio: e.target.value })}
              placeholder="1–2 sentences"
            />
          </div>
        </section>
      </div>

      <div style={{ marginTop: 18, textAlign: "right" }}>
        <button
          disabled={!canGo}
          onClick={next}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #cfcfcf",
            background: canGo ? "#f0f0f0" : "#e0e0e0",
            cursor: canGo ? "pointer" : "not-allowed",
          }}
        >
          Next → Chat
        </button>
      </div>
    </main>
  );
}
