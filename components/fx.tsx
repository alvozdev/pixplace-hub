"use client";
import { AnimatePresence, motion, MotionConfig, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Writes the pointer position to --px/--py once per frame; glass cards and buttons light up from it. */
export function PointerGlow() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--px", `${e.clientX}px`);
        root.style.setProperty("--py", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

/** Respects the visitor's reduced-motion setting for every motion component below. */
export function Motion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Blur-fade-up entrance; `i` staggers siblings. */
export function Reveal({ i = 0, className, children, ...rest }: { i?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(10px)", scale: 0.98 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.7, delay: Math.min(i, 12) * 0.06, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Glass card that tilts toward the pointer with a spring (mouse and pen only). */
export function TiltCard({ className = "", children, max = 6 }: { className?: string; children: React.ReactNode; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      className={`glass-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to a number with a spring whenever it changes. */
export function NumberTicker({ value, decimals = 0, prefix = "" }: { value: number; decimals?: number; prefix?: string }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const [shown, setShown] = useState(prefix + (0).toFixed(decimals));
  useEffect(() => spring.on("change", (v) => setShown(prefix + v.toFixed(decimals))), [spring, decimals, prefix]);
  useEffect(() => spring.set(value), [spring, value]);
  return <span className="tabular-nums">{shown}</span>;
}

/** Status message that slides in and out. */
export function Notice({ result }: { result: { ok: boolean; message: string } | null }) {
  return (
    <AnimatePresence mode="wait">
      {result && (
        <motion.p
          key={result.message}
          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: EASE }}
          className={`rounded-2xl border px-3 py-2 text-sm backdrop-blur ${
            result.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-bad/30 bg-bad/10 text-bad"
          }`}
        >
          {result.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

const SPARK_COLORS = ["#f472b6", "#a78bfa", "#38bdf8", "#fb923c", "#34d399", "#ffffff"];

interface Shot {
  id: number;
  parts: { angle: number; dist: number; size: number; dur: number; color: string }[];
}

/** A burst of sparks from the centre of its parent; fires each time `fire` turns true. */
export function Burst({ fire }: { fire: boolean }) {
  const [shots, setShots] = useState<Shot[]>([]);
  const prev = useRef(fire);
  useEffect(() => {
    if (fire && !prev.current) {
      const parts = Array.from({ length: 28 }, (_, i) => ({
        angle: (i / 28) * Math.PI * 2 + Math.random() * 0.3,
        dist: 90 + Math.random() * 140,
        size: 3 + Math.random() * 5,
        dur: 1.3 + Math.random() * 0.5,
        color: SPARK_COLORS[i % SPARK_COLORS.length],
      }));
      setShots((s) => [...s, { id: Date.now(), parts }]);
    }
    prev.current = fire;
  }, [fire]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {shots.map((shot) => (
        <div key={shot.id} className="absolute left-1/2 top-1/2">
          {shot.parts.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 12px ${p.color}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist + 40, opacity: 0, scale: 1 }}
              transition={{ duration: p.dur, ease: [0.1, 0.8, 0.3, 1] }}
              onAnimationComplete={() => i === 0 && setShots((s) => s.filter((x) => x.id !== shot.id))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Round avatar with a spinning glow ring, for niches and the brand. */
export function GlowAvatar({ label, size = 44, live = true }: { label: string; size?: number; live?: boolean }) {
  return (
    <span className={`relative inline-grid shrink-0 rounded-full ${live ? "glow-ring" : ""}`} style={{ width: size, height: size }}>
      <span
        className={`grid place-items-center rounded-full bg-[#10101a] font-display font-semibold text-ink ${live ? "" : "ring-1 ring-white/15"}`}
        style={{ fontSize: size * 0.3 }}
      >
        {label}
      </span>
    </span>
  );
}
