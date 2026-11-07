import { ArrowRight, Check, Phone, Target, User } from "lucide-react";
import type { Scenario } from "@shared/sellio";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Avatar } from "./Avatar";
import { DifficultyBadge } from "./Badges";

interface BriefingDialogProps {
  scenario: Scenario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBegin: (scenario: Scenario) => void;
}

export function BriefingDialog({ scenario, open, onOpenChange, onBegin }: BriefingDialogProps) {
  if (!scenario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[620px] gap-0 overflow-y-auto rounded-[28px] border-line bg-white p-0">
        <div className="flex items-center gap-4 px-6 pb-5 pt-6" style={{ background: scenario.avatar.bg }}>
          <Avatar config={scenario.avatar} className="h-[72px] w-[72px]" ring />
          <div className="min-w-0">
            <DialogTitle className="text-[22px] font-extrabold leading-tight">
              {scenario.customerName}
              {scenario.age ? `, ${scenario.age}` : ""}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[14px] text-ink-soft/75">
              {scenario.title} · {scenario.situation}
            </DialogDescription>
            <div className="mt-2">
              <DifficultyBadge difficulty={scenario.difficulty} withHint />
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <section>
            <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              <User className="h-3.5 w-3.5" strokeWidth={2.4} />
              Bakgrunn
            </h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-ink-soft">{scenario.background}</p>
          </section>

          <section>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              Du kan tilby
            </h3>
            <ul className="mt-2 space-y-1.5">
              {scenario.products.map(product => (
                <li key={product} className="flex items-start gap-2 text-[14.5px] text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f9e6f]" strokeWidth={3} />
                  {product}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-brand-soft px-4 py-3.5">
            <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a85300]">
              <Target className="h-3.5 w-3.5" strokeWidth={2.4} />
              Målet med samtalen
            </h3>
            <p className="mt-1.5 text-[14.5px] font-medium leading-relaxed text-ink">
              {scenario.callGoal}
            </p>
          </section>

          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-mute">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            {scenario.mode === "run"
              ? "Ti korte samtaler på rad. Du kan avslutte når du vil – nei teller som fremgang."
              : "Kunden snakker først. Du kan avslutte når som helst og få gjennomgangen."}
          </p>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <button type="button" className="pill-outline" onClick={() => onOpenChange(false)}>
            Tilbake
          </button>
          <button type="button" className="pill-primary" onClick={() => onBegin(scenario)}>
            Begynn samtalen
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
