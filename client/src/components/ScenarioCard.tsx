import { ArrowUpRight, Target } from "lucide-react";
import type { Scenario } from "@shared/sellio";
import { DifficultyBadge } from "./Badges";
import { Avatar } from "./Avatar";

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
  variant?: "grid" | "wide";
}

function Meta({ scenario }: { scenario: Scenario }) {
  return (
    <span className="text-[13px] font-medium text-ink-mute">
      {scenario.mode === "run" ? "Ringerekke · 10 samtaler" : "Én samtale"}
    </span>
  );
}

export function ScenarioCard({ scenario, onSelect, variant = "grid" }: ScenarioCardProps) {
  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={() => onSelect(scenario)}
        className="card-soft card-lift group flex w-full flex-col overflow-hidden text-left focus-visible:outline-offset-4 md:flex-row"
        aria-label={`${scenario.title} – ${scenario.customerName}. Åpne brief.`}
      >
        <div
          className="flex items-center gap-4 px-5 py-5 md:w-[290px] md:shrink-0 md:flex-col md:items-start md:justify-center md:px-7 md:py-7"
          style={{ background: scenario.avatar.bg }}
        >
          <Avatar config={scenario.avatar} className="h-[68px] w-[68px] md:h-20 md:w-20" ring />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {scenario.tag && (
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
                  {scenario.tag}
                </span>
              )}
              <DifficultyBadge difficulty={scenario.difficulty} />
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft/75">
              {scenario.situation}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 px-5 py-5 md:px-7 md:py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              {scenario.title}
            </p>
            <h3 className="mt-1 text-[24px] font-extrabold leading-tight sm:text-[28px]">
              {scenario.customerName}
            </h3>
            <p className="mt-2 line-clamp-3 max-w-[66ch] text-[14px] leading-relaxed text-ink-soft/80">
              {scenario.background}
            </p>
            <p className="mt-3 inline-flex items-start gap-2 text-[14.5px] font-medium leading-snug text-ink-soft">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.4} />
              {scenario.goalLine}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Meta scenario={scenario} />
            <span className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink transition-colors group-hover:text-brand">
              Se brief
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario)}
      className="card-soft card-lift group relative flex w-full flex-col overflow-hidden text-left focus-visible:outline-offset-4"
      aria-label={`${scenario.title} – ${scenario.customerName}. Åpne brief.`}
    >
      <div
        className="relative flex items-center gap-4 px-5 py-5"
        style={{ background: scenario.avatar.bg }}
      >
        <Avatar
          config={scenario.avatar}
          className="h-16 w-16"
          ring
          label={`Illustrasjon av ${scenario.customerName}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[19px] font-bold leading-tight">
              {scenario.customerName}
            </h3>
            {scenario.age && (
              <span className="text-[13.5px] font-medium text-ink-soft/60">{scenario.age}</span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink-soft/75">
            {scenario.situation}
          </p>
        </div>

        <span className="absolute right-4 top-4">
          <DifficultyBadge difficulty={scenario.difficulty} />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            {scenario.title}
          </p>
          <p className="mt-2 inline-flex items-start gap-2 text-[14.5px] font-medium leading-snug text-ink-soft">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.4} />
            {scenario.goalLine}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Meta scenario={scenario} />
          <span className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink transition-colors group-hover:text-brand">
            Se brief
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
