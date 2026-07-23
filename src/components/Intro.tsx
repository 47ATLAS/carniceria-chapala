import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const BRAND = "Carnicería Chapala".split("");
const LOAD = "CARGANDO".split("");

type Phase = "brand" | "loader" | "gone";

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("brand");

  useEffect(() => {
    const t = setTimeout(() => setPhase("loader"), 1750);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "loader") return;
    let done = false;
    const start = performance.now();
    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = performance.now() - start;
      const wait = Math.max(0, 900 - elapsed);
      setTimeout(() => {
        setPhase("gone");
        setTimeout(onDone, 600);
      }, wait);
    };
    (async () => {
      try {
        if (typeof document !== "undefined" && document.readyState !== "complete") {
          await new Promise((r) => window.addEventListener("load", () => r(null), { once: true }));
        }
        await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.catch?.(() => {});
      } catch {}
      finish();
    })();
    const hard = setTimeout(finish, 6000);
    return () => clearTimeout(hard);
  }, [phase, onDone]);

  return (
    <AnimatePresence>
      {phase !== "gone" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[999] flex items-center justify-center ink-bg"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <AnimatePresence mode="wait">
            {phase === "brand" ? (
              <motion.div
                key="brand"
                className="flex flex-wrap justify-center px-6"
                exit={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {BRAND.map((ch, i) => (
                  <motion.span
                    key={i}
                    className="display text-4xl md:text-7xl text-primary-foreground inline-block"
                    initial={{ opacity: 0, filter: "blur(14px)", scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </motion.span>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex overflow-hidden"
              >
                {LOAD.map((l, i) => (
                  <span
                    key={i}
                    className="display text-5xl md:text-7xl text-primary-foreground inline-block"
                    style={{
                      animation: `letterBob 1600ms cubic-bezier(0.4,0,0.2,1) ${i * 90}ms infinite`,
                    }}
                  >
                    {l === " " ? "\u00A0" : l}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <style>{`@keyframes letterBob { 0% { transform: translateY(110%); } 35%, 65% { transform: translateY(0); } 100% { transform: translateY(-110%); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}