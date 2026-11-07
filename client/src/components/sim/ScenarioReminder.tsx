import { useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import type { Scenario } from "@shared/sellio";

export function ScenarioReminder({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[20px] border border-line bg-white/70">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <Target className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.4} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-soft">
          {scenario.goalLine}
        </span>
        <span className="hidden text-[12px] text-ink-mute sm:inline">
          {open ? "Skjul brief" : "Vis brief"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-mute transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div className="grid gap-4 border-t border-line px-4 py-3.5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
              Målet
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{scenario.callGoal}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
              Du kan tilby
            </p>
            <ul className="mt-1 space-y-1 text-[13.5px] leading-relaxed text-ink-soft">
              {scenario.products.map(product => (
                <li key={product}>· {product}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
