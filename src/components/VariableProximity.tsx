import { forwardRef, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";

type Props = {
  label: string;
  className?: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: "linear" | "exponential";
};

function parseSettings(s: string): [string, number][] {
  return s.split(",").map((p) => {
    const [tag, val] = p.trim().split(" ");
    return [tag.replace(/['"]/g, ""), parseFloat(val)];
  });
}

export const VariableProximity = forwardRef<HTMLSpanElement, Props>(function VariableProximity(
  {
    label,
    className = "",
    fromFontVariationSettings = "'wght' 400",
    toFontVariationSettings = "'wght' 900",
    containerRef,
    radius = 100,
    falloff = "linear",
  },
  ref,
) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const fromArr = useMemo(() => parseSettings(fromFontVariationSettings), [fromFontVariationSettings]);
  const toArr = useMemo(() => parseSettings(toFontVariationSettings), [toFontVariationSettings]);
  const letters = useMemo(() => label.split(""), [label]);

  useEffect(() => {
    const handle = (ev: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [containerRef]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      letterRefs.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cr = containerRef.current?.getBoundingClientRect();
        if (!cr) return;
        const lx = r.left - cr.left + r.width / 2;
        const ly = r.top - cr.top + r.height / 2;
        const dx = mouse.current.x - lx;
        const dy = mouse.current.y - ly;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let t = Math.max(0, 1 - dist / radius);
        if (falloff === "exponential") t = t * t;
        const settings = fromArr.map(([tag, from], i) => {
          const to = toArr[i]?.[1] ?? from;
          return `'${tag}' ${from + (to - from) * t}`;
        }).join(", ");
        el.style.fontVariationSettings = settings;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fromArr, toArr, radius, falloff, containerRef]);

  return (
    <motion.span ref={ref} className={className} aria-label={label}>
      {letters.map((ch, i) => (
        <span
          key={i}
          ref={(el) => { letterRefs.current[i] = el; }}
          className="inline-block"
          style={{ transition: "font-variation-settings 60ms linear" }}
          aria-hidden
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </motion.span>
  );
});