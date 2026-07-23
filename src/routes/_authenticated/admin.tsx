import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/employees.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Panel — Carnicería Chapala" }, { name: "robots", content: "noindex" }] }),
  component: AdminShell,
});

function AdminShell() {
  const nav = useNavigate();
  const check = useServerFn(checkIsAdmin);
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    check().then((r) => setStatus(r.isAdmin ? "ok" : "denied")).catch(() => setStatus("denied"));
  }, [check]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  if (status === "loading") return <div className="p-10 text-center text-muted-foreground">Verificando…</div>;
  if (status === "denied") return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="display text-3xl">Sin acceso</h1>
      <p className="mt-3 text-sm text-muted-foreground">Tu cuenta no tiene el rol <code>admin</code>. Un administrador debe agregarte en la tabla <code>user_roles</code>.</p>
      <button onClick={signOut} className="mt-6 rounded-md border border-border px-4 py-2 text-sm">Cerrar sesión</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="ink-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="display text-xl">Panel · Carnicería Chapala</div>
          <nav className="flex gap-6 text-xs uppercase tracking-widest">
            <Link to="/admin/productos" className="opacity-70 hover:opacity-100" activeProps={{ className: "opacity-100 text-accent" }}>Productos</Link>
            <Link to="/admin/pedidos" className="opacity-70 hover:opacity-100" activeProps={{ className: "opacity-100 text-accent" }}>Pedidos</Link>
            <Link to="/admin/empleados" className="opacity-70 hover:opacity-100" activeProps={{ className: "opacity-100 text-accent" }}>Empleados</Link>
            <button onClick={signOut} className="opacity-70 hover:opacity-100">Salir</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}