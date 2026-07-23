import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { VariableProximity } from "@/components/VariableProximity";
import { Reveal } from "@/components/Reveal";
import { TiltCard } from "@/components/TiltCard";
import { listProducts } from "@/lib/products.functions";

const productsQO = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Carnicería Chapala" },
      { name: "description", content: "Cortes de res, cerdo, pollo y embutidos artesanales, con disponibilidad en tiempo real." },
      { property: "og:title", content: "Catálogo — Carnicería Chapala" },
      { property: "og:description", content: "Nuestros cortes disponibles hoy." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: Catalogo,
});

const CATS = [
  { id: "todos", label: "Todos" },
  { id: "res", label: "Res" },
  { id: "cerdo", label: "Cerdo" },
  { id: "pollo", label: "Pollo" },
  { id: "embutidos", label: "Embutidos" },
] as const;

function Catalogo() {
  const { data: products } = useSuspenseQuery(productsQO);
  const [cat, setCat] = useState<string>("todos");
  const titleRef = useRef<HTMLDivElement>(null);
  const filtered = cat === "todos" ? products : products.filter((p) => p.categoria === cat);
  return (
    <SiteLayout>
      <section ref={titleRef} className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Catálogo</p>
        <h1 className="display text-5xl md:text-7xl">
          <VariableProximity
            containerRef={titleRef}
            label="Cortes disponibles hoy"
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            radius={140}
          />
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Actualizado en tiempo real. Si no está en stock, vuelve mañana o pregúntanos por WhatsApp.</p>
        <div className="mt-10 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${cat === c.id ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground/70 hover:border-accent"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Reveal key={p.id_producto} delay={(i % 6) * 0.05}>
              <TiltCard className="group rounded-sm border border-border/60 bg-card p-5 [perspective:1000px] transition-shadow hover:shadow-xl hover:shadow-black/10">
                <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
                  <h3 className="display text-2xl">{p.nombre}</h3>
                  <div className="text-lg font-semibold text-accent">${Number(p.precio).toFixed(2)}</div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.descripcion}</p>
                <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-widest">
                  <span className="text-muted-foreground">{p.categoria}</span>
                  {p.stock > 0 ? (
                    <span className="text-accent">{p.stock} disponibles</span>
                  ) : (
                    <span className="text-destructive">Agotado</span>
                  )}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}