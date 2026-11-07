import {
  DIFFICULTY_HINT,
  DIFFICULTY_LABEL,
  MOVE_META,
  type Difficulty,
  type MoveLabel,
} from "@shared/sellio";

const DIFFICULTY_STYLE: Record<Difficulty, { bg: string; text: string; dot: string }> = {
  gronn: { bg: "#e4f4ea", text: "#1f6b46", dot: "#2f9e6f" },
  gul: { bg: "#fff3c4", text: "#7a5600", dot: "#d9a441" },
  rod: { bg: "#ffe4e0", text: "#a02f22", dot: "#e0553f" },
};

export function DifficultyBadge({
  difficulty,
  withHint = false,
}: {
  difficulty: Difficulty;
  withHint?: boolean;
}) {
  const style = DIFFICULTY_STYLE[difficulty];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: style.bg, color: style.text }}
      title={DIFFICULTY_HINT[difficulty]}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {DIFFICULTY_LABEL[difficulty]}
      {withHint && <span className="font-normal opacity-70">· {DIFFICULTY_HINT[difficulty]}</span>}
    </span>
  );
}

export function MoveBadge({
  label,
  size = "sm",
  withLabel = true,
}: {
  label: MoveLabel;
  size?: "sm" | "md";
  withLabel?: boolean;
}) {
  const meta = MOVE_META[label];
  const padding = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2 py-0.5 text-[11.5px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding}`}
      style={{ background: meta.tint, color: meta.color }}
      title={meta.label}
    >
      <span aria-hidden="true" className="font-bold leading-none">
        {meta.short}
      </span>
      {withLabel && meta.label}
    </span>
  );
}

export function MoveGlyph({ label, className = "" }: { label: MoveLabel; className?: string }) {
  const meta = MOVE_META[label];
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${className}`}
      style={{ background: meta.tint, color: meta.color }}
      title={meta.label}
      aria-label={meta.label}
    >
      {meta.short}
    </span>
  );
}
