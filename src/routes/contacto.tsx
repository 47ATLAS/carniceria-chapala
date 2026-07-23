import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { VariableProximity } from "@/components/VariableProximity";
import { Reveal } from "@/components/Reveal";
import { MapPin, Phone, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Carnicería Chapala" },
      { name: "description", content: "Encuéntranos en Av. Madero 245, Centro, Chapala. Tel. (376) 765 4321." },
      { property: "og:title", content: "Contacto — Carnicería Chapala" },
      { property: "og:description", content: "Cómo contactarnos y visitarnos." },
    ],
  }),
  component: Contacto,
});

function Contacto() {
  const titleRef = useRef<HTMLDivElement>(null);
  return (
    <SiteLayout>
      <section ref={titleRef} className="mx-auto max-w-5xl px-6 py-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Contacto</p>
        <h1 className="display text-5xl md:text-7xl">
          <VariableProximity
            containerRef={titleRef}
            label="Ven a la tienda"
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            radius={140}
          />
        </h1>
        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <div className="space-y-8">
            <Reveal><div className="flex gap-4"><MapPin className="mt-1 h-5 w-5 text-accent" /><div><div className="text-xs uppercase tracking-widest text-muted-foreground">Dirección</div><p>Av. Madero 245, Centro,<br/>Chapala, Jalisco</p></div></div></Reveal>
            <Reveal delay={0.08}><div className="flex gap-4"><Phone className="mt-1 h-5 w-5 text-accent" /><div><div className="text-xs uppercase tracking-widest text-muted-foreground">Teléfono</div><p>(376) 765 4321</p></div></div></Reveal>
            <Reveal delay={0.16}><div className="flex gap-4"><Clock className="mt-1 h-5 w-5 text-accent" /><div><div className="text-xs uppercase tracking-widest text-muted-foreground">Horario</div><p>Lun–Sáb 8:00–19:00<br/>Domingo 8:00–14:00</p></div></div></Reveal>
            <Reveal delay={0.24}><div className="flex gap-4"><MessageCircle className="mt-1 h-5 w-5 text-accent" /><div><div className="text-xs uppercase tracking-widest text-muted-foreground">WhatsApp</div><a href="https://wa.me/5213331234567" className="underline underline-offset-4 hover:text-accent">Escríbenos</a></div></div></Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="aspect-square overflow-hidden rounded-sm border border-border">
              <iframe title="Mapa" src="https://www.google.com/maps?q=Chapala+Jalisco&output=embed" className="h-full w-full" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}