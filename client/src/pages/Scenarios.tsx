import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { scenarios, type Difficulty, type Scenario } from "@shared/sellio";
import { ScenarioCard } from "@/components/ScenarioCard";
import { BriefingDialog } from "@/components/BriefingDialog";
import { useConversation } from "@/state/ConversationContext";

const FILTERS: { key: Difficulty | "alle"; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "gronn", label: "Grønn" },
  { key: "gul", label: "Gul" },
  { key: "rod", label: "Rød" },
];

export default function Scenarios() {
  const [filter, setFilter] = useState<Difficulty | "alle">("alle");
  const [selected, setSelected] = useState<Scenario | null>(null);
  const { startScenario } = useConversation();
  const [, navigate] = useLocation();

  const visible = useMemo(
    () => (filter === "alle" ? scenarios : scenarios.filter(item => item.difficulty === filter)),
    [filter]
  );

  const flagship = filter === "alle" ? visible.find(item => item.mode === "run") : undefined;
  const gridScenarios = flagship ? visible.filter(item => item.id !== flagship.id) : visible;

  const begin = (scenario: Scenario) => {
    startScenario(scenario.id);
    setSelected(null);
    navigate(`/ovelse/${scenario.id}`);
  };

  return (
    <div className="relative pb-24">
      <div
        className="blob-bg right-[-6%] top-[-8%] h-72 w-72"
        style={{ background: "#ffe8d6" }}
        aria-hidden="true"
      />

      <div className="shell relative z-10 pt-10 sm:pt-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Kundebibliotek</span>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.04] sm:text-[46px]">
              Hvem vil du øve på?
            </h1>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-ink-soft/80">
              Hver kunde har egne behov, innvendinger og tålmodighet. Du får bare det en selger
              realistisk ville visst før samtalen.
            </p>
          </div>

          <div
            className="flex shrink-0 gap-1 rounded-full border border-line bg-white p-1"
            role="group"
            aria-label="Filtrer på vanskelighetsgrad"
          >
            {FILTERS.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`rounded-full px-3.5 py-2 text-[13.5px] font-medium transition ${
                  filter === item.key
                    ? "bg-ink text-white"
                    : "text-ink-soft hover:bg-black/[0.04]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {flagship && (
          <div className="mt-9">
            <ScenarioCard scenario={flagship} onSelect={setSelected} variant="wide" />
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gridScenarios.map(scenario => (
            <ScenarioCard key={scenario.id} scenario={scenario} onSelect={setSelected} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-12 text-center text-[15px] text-ink-mute">
            Ingen kunder med denne vanskelighetsgraden ennå.
          </p>
        )}
      </div>

      <BriefingDialog
        scenario={selected}
        open={Boolean(selected)}
        onOpenChange={open => !open && setSelected(null)}
        onBegin={begin}
      />
    </div>
  );
}
