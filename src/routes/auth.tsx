import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso admin — Carnicería Chapala" },
      { name: "description", content: "Acceso al panel de administración." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
      }
      nav({ to: "/admin" });
    } catch (e) {
      setErr((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Panel</p>
        <h1 className="display text-5xl">Acceso admin</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Solo personal autorizado. Los usuarios recién creados necesitan que un admin les asigne el rol en la base de datos.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input required type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="w-full rounded-md wine-bg px-4 py-3 text-sm uppercase tracking-widest disabled:opacity-50">
            {loading ? "…" : mode === "in" ? "Entrar" : "Crear cuenta"}
          </button>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground hover:text-accent">
            {mode === "in" ? "¿No tienes cuenta? Crear una" : "Ya tengo cuenta"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}