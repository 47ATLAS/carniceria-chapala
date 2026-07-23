import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    session_id: z.string().min(6),
    message: z.string().min(1).max(500),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Fetch context: products
    const { data: prods } = await sb.from("productos").select("nombre, precio, stock, categoria");
    // Fetch history for this session
    const { data: history } = await sb.from("chat_messages")
      .select("role, content").eq("session_id", data.session_id).order("created_at").limit(20);

    const catalog = (prods ?? []).map((p) =>
      `- ${p.nombre} (${p.categoria}): $${Number(p.precio).toFixed(2)} MXN, stock: ${p.stock}`,
    ).join("\n");

    const system = `Eres el asistente de Carnicería Chapala, una carnicería artesanal en Chapala, Jalisco.
Responde en español, breve, amable y directo. Solo hablas de:
- Horarios: Lun-Sáb 8:00-19:00, Dom 8:00-14:00.
- Ubicación: Av. Madero 245, Centro, Chapala, Jalisco.
- Productos, precios y disponibilidad (usa el catálogo).
- Cómo apartar un pedido en el sitio (sección "Pedido") o por WhatsApp.
Si preguntan algo fuera de tema, redirige amablemente.

Catálogo actual:
${catalog}`;

    const key = process.env.LOVABLE_API_KEY!;
    const messages = [
      { role: "system", content: system },
      ...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: data.message },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "google/gemini-3.6-flash", messages }),
    });
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("Estamos recibiendo muchas consultas, intenta en un momento.");
      if (res.status === 402) throw new Error("Servicio de asistente temporalmente no disponible.");
      throw new Error(`Error del asistente: ${errText}`);
    }
    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "Lo siento, no pude responder.";

    // Persist user + assistant
    await sb.from("chat_messages").insert([
      { session_id: data.session_id, role: "user", content: data.message },
      { session_id: data.session_id, role: "assistant", content: reply },
    ]);

    return { reply };
  });

export const getChatHistory = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ session_id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows } = await sb.from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", data.session_id)
      .order("created_at");
    return rows ?? [];
  });