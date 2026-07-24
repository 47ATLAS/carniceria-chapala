import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal } from "@/components/Reveal";
import { TiltCard } from "@/components/TiltCard";
import hero from "@/assets/hero-meat.jpg";
import cortenegro from "@/assets/corte-negro.jpeg";
import cuts from "@/assets/cuts-array.jpg";
import carneCorte from "@/assets/Carne-corte.jpeg";
import collage from "@/assets/Collage.jpeg";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galería — Carnicería Chapala" },
      { name: "description", content: "Un vistazo a nuestros cortes y a la tienda." },
      { property: "og:title", content: "Galería — Carnicería Chapala" },
      { property: "og:description", content: "Un vistazo a nuestros cortes y a la tienda." },
    ],
  }),
  component: Galeria,
});

function Galeria() {
  const imgs = [
    { src: hero, alt: "Ribeye premium" },
    { src: cortenegro, alt: "Corte de carne con guantes negros" },
    { src: cuts, alt: "Surtido de cortes" },
    { src: carneCorte, alt: "Corte de carne" },
    { src: collage, alt: "Collage de la carnicería" },
  ];
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Galería</p>
        <h1 className="display text-5xl md:text-7xl">La casa por dentro</h1>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {imgs.map((i, k) => (
            <Reveal key={k} delay={k * 0.08} className={k % 3 === 0 ? "md:row-span-2" : ""}>
              <TiltCard className="[perspective:1200px]">
                <figure>
                  <img src={i.src} alt={i.alt} loading="lazy" className="h-full w-full rounded-sm object-cover" />
                </figure>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}