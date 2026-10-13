"use client";
import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  dec = 0,
  className = "",
  prefix = "",
  suffix = "",
}: {
  value: number;
  dec?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (done.current) return;
      done.current = true;
      const dur = 1000;
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(value * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setN(value);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return <span ref={ref} className={className}>{prefix}{n.toFixed(dec)}{suffix}</span>;
}
