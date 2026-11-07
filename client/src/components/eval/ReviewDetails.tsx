import {
  MOVE_META,
  MOVE_ORDER,
  PHASE_LABEL,
  type Evaluation,
  type MoveLabel,
  type PhaseScore,
} from "@shared/sellio";
import { MoveBadge } from "../Badges";

export function MoveTally({ tally }: { tally: Partial<Record<MoveLabel, number>> }) {
  const entries = MOVE_ORDER.filter(label => (tally[label] ?? 0) > 0);

  if (entries.length === 0) {
    return <p className="text-[14px] text-ink-mute">Ingen trekk å klassifisere.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(label => {
        const meta = MOVE_META[label];
        return (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: meta.tint, color: meta.color }}
              aria-hidden="true"
            >
              {meta.short}
            </span>
            <span className="text-[13.5px] font-semibold text-ink">{tally[label]}</span>
            <span className="text-[13px] text-ink-soft/80">{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function PhaseBars({ phases }: { phases: PhaseScore[] }) {
  const weakest = [...phases].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-5">
      {phases.map(phase => {
        const isWeakest = phase.key === weakest?.key;
        return (
          <div key={phase.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-ink">
                {PHASE_LABEL[phase.key]}
                {isWeakest && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#a85300]">
                    Treningsfokus
                  </span>
                )}
              </p>
              <p className="shrink-0 text-[14px] font-bold tabular-nums text-ink-soft">
                {phase.score}
              </p>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.max(phase.score, 2)}%`,
                  background: isWeakest ? "#ff7300" : "#c9c2b9",
                }}
              />
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">{phase.verdict}</p>
          </div>
        );
      })}
    </div>
  );
}

export function PatienceTimeline({
  events,
  messages,
}: {
  events: Evaluation["patienceEvents"];
  messages: { role: string }[];
}) {
  if (!events || events.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {events.map((event, index) => (
        <li key={`${event.index}-${index}`} className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex min-w-[46px] justify-center rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${
              event.delta < 0 ? "bg-blush text-[#a02f22]" : "bg-sage text-[#1f6b46]"
            }`}
          >
            {event.delta > 0 ? `+${event.delta}` : event.delta}
          </span>
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">
              Trekk {moveNumber(event.index, messages)}.
            </span>{" "}
            {event.reason}
          </p>
        </li>
      ))}
    </ul>
  );
}

function moveNumber(index: number, messages: { role: string }[]) {
  return Math.max(
    1,
    messages.slice(0, index + 1).filter(message => message.role === "user").length
  );
}

export function OutcomeLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[12px] text-ink-mute">
      {(["closed", "open", "lost"] as const).map(outcome => (
        <span key={outcome} className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: outcome === "closed" ? "#2f9e6f" : outcome === "open" ? "#d9a441" : "#e0553f",
            }}
          />
          {outcome === "closed" ? "Avtale" : outcome === "open" ? "Uavklart" : "Tapt"}
        </span>
      ))}
    </div>
  );
}

export function MoveLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {MOVE_ORDER.map(label => (
        <MoveBadge key={label} label={label} />
      ))}
    </div>
  );
}
