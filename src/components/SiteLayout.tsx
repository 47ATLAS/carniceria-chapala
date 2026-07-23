import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { IntroSequence } from "./Intro";
import { WhatsAppButton } from "./WhatsAppButton";
import { ChatWidget } from "./ChatWidget";
import { PageTransition } from "./PageTransition";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/pedido", label: "Pedido" },
  { to: "/galeria", label: "Galería" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    if (sessionStorage.getItem("cc_loaded")) { setShowLoader(false); return; }
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {showLoader && (
        <IntroSequence
          onDone={() => {
            sessionStorage.setItem("cc_loaded", "1");
            setShowLoader(false);
          }}
        />
      )}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="display text-2xl tracking-tight">
            Carnicería <span className="text-accent">Chapala</span>
          </Link>
          <nav className="hidden gap-8 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm uppercase tracking-wider text-foreground/70 transition-colors hover:text-accent"
                activeProps={{ className: "text-accent" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link to="/auth" className="hidden text-xs uppercase tracking-widest text-muted-foreground hover:text-accent md:block">
            Admin
          </Link>
          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menú">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border md:hidden">
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm uppercase tracking-wider">
                  {n.label}
                </Link>
              ))}
              <Link to="/auth" onClick={() => setOpen(false)} className="py-2 text-xs uppercase tracking-widest text-muted-foreground">
                Admin
              </Link>
            </div>
          </div>
        )}
      </header>
      <main><PageTransition>{children}</PageTransition></main>
      <footer className="mt-24 border-t border-border/50 py-10">
        <div className="mx-auto max-w-7xl px-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-between gap-6">
            <div>
              <div className="display text-xl text-foreground">Carnicería Chapala</div>
              <p className="mt-1">Av. Madero 245, Centro, Chapala, Jalisco.</p>
            </div>
            <div>
              <p>Lun–Sáb 8:00–19:00 · Dom 8:00–14:00</p>
              <p>Tel. (376) 765 4321</p>
            </div>
          </div>
          <div className="mt-8 text-xs opacity-60">© {new Date().getFullYear()} Carnicería Chapala.</div>
        </div>
      </footer>
      <WhatsAppButton />
      <ChatWidget />
    </div>
  );
}