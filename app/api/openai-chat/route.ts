export const runtime = "nodejs";

type Body = {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  // optional: allow overriding model later
  model?: string;
};

export async function POST(req: Request) {
  try {
    const projectId = process.env.DF_PROJECT_ID;
    const apiKey = process.env.DF_API_KEY;

    if (!projectId || !apiKey) {
      return Response.json(
        { error: "Missing DF_PROJECT_ID or DF_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Body;
    const systemPrompt = (body.systemPrompt || "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!systemPrompt || messages.length === 0) {
      return Response.json(
        { error: "Bad request: need systemPrompt + messages[]" },
        { status: 400 }
      );
    }

    // Convert your (systemPrompt + messages) into DF LocalAI format.
    // DF expects the same format as their OpenAI example:
    // { api_token, task: "chat", messages, model }
    const dfMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    /**
     * =========================
     * STUDENT-EDITABLE ZONE (MODEL SELECTION)
     * Per DF docs: you can start with model empty string but still include it.
     * Students can change model if DF deploys more models.
     * =========================
     */
    const model = typeof body.model === "string" ? body.model : "";

    const url = `https://data.id.tue.nl/api/vendor/localai/${projectId}`;

    const dfRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Do NOT send apiKey to the browser; keep it server-side here.
      body: JSON.stringify({
        api_token: apiKey,
        task: "chat",
        model, // must be included even if empty
        messages: dfMessages,
      }),
    });

    const text = await dfRes.text();

    if (!dfRes.ok) {
      return Response.json(
        { error: `DF LocalAI request failed (${dfRes.status})`, detail: text },
        { status: 500 }
      );
    }

    // DF example says response json has `content`
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      // if DF returns plain text for some reason
      return Response.json({ content: text });
    }

    return Response.json({ content: json?.content ?? "" });
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
