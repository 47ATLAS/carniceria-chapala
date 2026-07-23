import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { VariableProximity } from "@/components/VariableProximity";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { TiltCard } from "@/components/TiltCard";
import hero from "@/assets/hero-meat.jpg";
import cuts from "@/assets/cuts-array.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  return (
    <SiteLayout>
      <section ref={heroRef} className="relative overflow-hidden ink-bg">
        <AuroraBackground />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-20 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-32 lg:pb-40">
          <div className="relative z-10 flex flex-col justify-center text-primary-foreground">
            <p className="mb-6 text-xs uppercase tracking-[0.35em] text-accent">Chapala · Desde 1972</p>
            <h1 className="display text-6xl leading-[0.9] md:text-8xl">
              <VariableProximity
                containerRef={heroRef}
                label={"Carne fresca."}
                className="block"
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 900"
                radius={160}
              />
              <VariableProximity
                containerRef={heroRef}
                label={"Oficio real."}
                className="block text-accent"
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 900"
                radius={160}
              />
            </h1>
            <p className="mt-8 max-w-md text-lg text-primary-foreground/70">
              Cortes premium, embutidos artesanales y atención a la antigua. Aparta tu pedido y recógelo listo en tienda.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/pedido" className="btn-shine glow-pulse rounded-md bg-accent px-6 py-3 text-sm uppercase tracking-widest text-accent-foreground transition-transform hover:scale-105">
                Apartar pedido
              </Link>
              <Link to="/catalogo" className="btn-shine rounded-md border border-primary-foreground/30 px-6 py-3 text-sm uppercase tracking-widest text-primary-foreground hover:border-accent hover:text-accent">
                Ver catálogo
              </Link>
            </div>
          </div>
          <div className="relative z-10">
            <img src={hero} alt="Ribeye premium recién cortado" width={1600} height={1200} className="h-full w-full rounded-sm object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 md:grid-cols-3">
          {[
            { n: "01", t: "Ganado local", d: "Trabajamos solo con ranchos cercanos, con manejo transparente y alimentación limpia." },
            { n: "02", t: "Corte a mano", d: "Cada pieza se limpia y se corta como debe ser. Sin prisa, sin máquina." },
            { n: "03", t: "Todos los días", d: "Producto fresco cada mañana. Lo que no está hoy, mañana lo tenemos." },
          ].map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <div className="text-xs uppercase tracking-[0.3em] text-accent">{f.n}</div>
              <h3 className="display mt-3 text-3xl">{f.t}</h3>
              <p className="mt-3 text-muted-foreground">{f.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 rounded-sm border border-border bg-card p-10 md:grid-cols-3">
          {[
            { n: 52, s: "+", t: "Años de oficio" },
            { n: 24, s: "", t: "Cortes distintos" },
            { n: 3200, s: "+", t: "Familias del lago" },
          ].map((k, i) => (
            <Reveal key={k.t} delay={i * 0.1} className="text-center">
              <div className="display text-6xl text-accent md:text-7xl">
                <AnimatedCounter to={k.n} suffix={k.s} />
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">{k.t}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <TiltCard className="[perspective:1200px]">
              <img src={cuts} alt="Surtido de cortes" loading="lazy" className="rounded-sm object-cover" />
            </TiltCard>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Catálogo del día</p>
            <h2 className="display mt-4 text-4xl md:text-6xl">Lo que hay hoy en el mostrador.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">Consulta disponibilidad en tiempo real. Cambia todos los días.</p>
            <Link to="/catalogo" className="mt-8 inline-block border-b border-accent pb-1 text-sm uppercase tracking-widest text-accent">Ver catálogo →</Link>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
