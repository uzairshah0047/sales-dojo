import { CornerDownRight, RotateCcw } from "lucide-react";
import type { KeyMoment, TranscriptMessage } from "@shared/sellio";
import { MoveBadge } from "../Badges";

interface KeyMomentCardProps {
  moment: KeyMoment;
  message?: TranscriptMessage;
  onRetry?: (index: number) => void;
  canRetry: boolean;
}

export function KeyMomentCard({ moment, message, onRetry, canRetry }: KeyMomentCardProps) {
  const delta = moment.to - moment.from;

  return (
    <article className="card-soft flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MoveBadge label={moment.label} size="md" />
        <span className="inline-flex items-center gap-2 rounded-full bg-page px-3 py-1 text-[12.5px] font-semibold tabular-nums text-ink-soft">
          Interesse {moment.from}
          <span aria-hidden="true">→</span>
          {moment.to}
          <span className={delta < 0 ? "text-[#c0432f]" : "text-[#2f9e6f]"}>
            ({delta > 0 ? `+${delta}` : delta})
          </span>
        </span>
      </div>

      {message && (
        <blockquote className="border-l-[3px] border-line pl-4 text-[14.5px] italic leading-relaxed text-ink-soft">
          «{message.text}»
        </blockquote>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
          Hvorfor det landet slik
        </p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{moment.why}</p>
      </div>

      <div className="rounded-2xl bg-brand-soft px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a85300]">
          <CornerDownRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          Bedre replikk
        </p>
        <p className="mt-1.5 text-[14.5px] font-medium leading-relaxed text-ink">
          «{moment.better}»
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft/80">{moment.betterWhy}</p>
      </div>

      {canRetry && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(moment.index)}
          className="pill-outline self-start !px-4 !py-2.5 text-[14px]"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
          Prøv fra her
        </button>
      )}
    </article>
  );
}
