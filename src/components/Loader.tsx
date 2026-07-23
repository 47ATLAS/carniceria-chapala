import { useEffect, useState } from "react";

const LETTERS = "CARGANDO".split("");

export function InitialLoader() {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1400);
    const t2 = setTimeout(() => setGone(true), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (gone) return null;
  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center ink-bg transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}
      aria-hidden={fade}
    >
      <div className="flex overflow-hidden">
        {LETTERS.map((l, i) => (
          <span
            key={i}
            className="display text-6xl md:text-8xl text-primary-foreground inline-block"
            style={{
              transform: "translateY(120%)",
              animation: `letterUp 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms forwards`,
            }}
          >
            {l === " " ? "\u00A0" : l}
          </span>
        ))}
      </div>
      <style>{`@keyframes letterUp { to { transform: translateY(0); } }`}</style>
    </div>
  );
}