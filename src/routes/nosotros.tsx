import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { VariableProximity } from "@/components/VariableProximity";
import { Reveal } from "@/components/Reveal";
import cortenegro from "@/assets/corte-negro.jpeg";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros — Carnicería Chapala" },
      { name: "description", content: "Tres generaciones de carniceros al servicio de Chapala. Conoce nuestra historia y compromiso con la calidad." },
      { property: "og:title", content: "Nosotros — Carnicería Chapala" },
      { property: "og:description", content: "Historia y filosofía de Carnicería Chapala." },
    ],
  }),
  component: Nosotros,
});

function Nosotros() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <SiteLayout>
      <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:py-40">
        <p className="mb-6 text-xs uppercase tracking-[0.3em] text-accent">Desde 1972</p>
        <h1 className="display text-5xl leading-[0.95] md:text-8xl">
          <VariableProximity
            containerRef={ref}
            label={"Tres generaciones "}
            className="text-foreground"
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            radius={140}
          />
          <br />
          <VariableProximity
            containerRef={ref}
            label={"cortando con oficio."}
            className="text-accent"
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            radius={140}
          />
        </h1>
        <div className="mt-16 grid gap-16 md:grid-cols-2">
          <Reveal>
            <img src={cortenegro} alt="Corte de carne con guantes negros" className="aspect-[4/5] w-full rounded-sm object-cover" loading="lazy" />
          </Reveal>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
            <Reveal delay={0.05}><p>Empezamos en 1972 con un mostrador pequeño y una regla simple: no salir hasta que el último cliente se llevara el corte que quería.</p></Reveal>
            <Reveal delay={0.15}><p>Hoy trabajamos con ganaderos locales que crían sus animales sin hormonas y con alimentación limpia. Recibimos la carne fresca cada mañana y la limpiamos a mano, sin prisa.</p></Reveal>
            <Reveal delay={0.25}><p>Creemos que un buen corte empieza mucho antes del cuchillo: en el pasto, el manejo, la madurez. Por eso preferimos vender menos, pero vender bien.</p></Reveal>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}