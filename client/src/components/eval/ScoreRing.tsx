import { useEffect, useState } from "react";
import type { Outcome } from "@shared/sellio";

const OUTCOME_META: Record<
  Exclude<Outcome, "none">,
  { label: string; bg: string; text: string }
> = {
  closed: { label: "Avtale i havn", bg: "#2f9e6f", text: "#ffffff" },
  lost: { label: "Tapt", bg: "#e0553f", text: "#ffffff" },
  open: { label: "Uavklart", bg: "#d9a441", text: "#3a2a00" },
};

export function OutcomePill({ outcome }: { outcome: Outcome }) {
  const meta = OUTCOME_META[(outcome === "none" ? "open" : outcome) as Exclude<Outcome, "none">];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold"
      style={{ background: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {meta.label}
    </span>
  );
}

export function ScoreRing({ score, size = 190 }: { score: number; size?: number }) {
  const [progress, setProgress] = useState(0);
  const radius = 84;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(score), 120);
    return () => window.clearTimeout(timer);
  }, [score]);

  const offset = circumference - (circumference * progress) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`Nøyaktighet ${score} av 100`}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="13" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#ff7300"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text
          x="100"
          y="104"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="56"
          fontWeight="800"
          letterSpacing="-2"
        >
          {score}
        </text>
        <text
          x="100"
          y="132"
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="11.5"
          fontWeight="600"
          letterSpacing="2"
        >
          AV 100
        </text>
      </svg>
    </div>
  );
}

export function StatChip({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-2xl px-3.5 py-2.5 ${
        tone === "dark" ? "bg-white/[0.07]" : "bg-page"
      }`}
    >
      <p
        className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
          tone === "dark" ? "text-white/45" : "text-ink-mute"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-[15px] font-bold leading-none ${
          tone === "dark" ? "text-white" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
