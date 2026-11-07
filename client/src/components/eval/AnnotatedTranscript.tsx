import { ChevronDown } from "lucide-react";
import type { TranscriptMessage } from "@shared/sellio";
import { MoveBadge } from "../Badges";

interface AnnotatedTranscriptProps {
  messages: TranscriptMessage[];
  open: boolean;
  onToggle: () => void;
  highlight: number | null;
  onSelect: (index: number) => void;
}

export function AnnotatedTranscript({
  messages,
  open,
  onToggle,
  highlight,
  onSelect,
}: AnnotatedTranscriptProps) {
  const userCount = messages.filter(message => message.role === "user").length;

  return (
    <div className="card-soft overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left sm:px-6"
      >
        <div className="flex-1">
          <p className="text-[16px] font-bold">Hele samtalen, merket</p>
          <p className="mt-0.5 text-[13px] text-ink-mute">
            {messages.length} replikker · {userCount} trekk fra deg
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-ink-mute transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div className="max-h-[560px] space-y-3 overflow-y-auto border-t border-line px-4 py-4 sm:px-6">
          {messages.map((message, index) => {
            if (message.role === "system") {
              return (
                <p
                  key={message.id}
                  className="py-2 text-center text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-mute"
                >
                  {message.text}
                </p>
              );
            }

            const isUser = message.role === "user";
            const isHighlighted = highlight === index;

            return (
              <button
                key={message.id}
                id={`msg-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                className={`flex w-full flex-col gap-1.5 rounded-2xl p-2.5 text-left transition ${
                  isHighlighted ? "bg-brand-soft ring-2 ring-brand/40" : "hover:bg-page"
                } ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
                    {isUser ? "Du" : (message.speakerName ?? "Kunde")} · {index + 1}
                  </span>
                  {isUser && message.label && <MoveBadge label={message.label} />}
                </div>
                <p
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    isUser
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-ink-soft"
                  }`}
                >
                  {message.text}
                </p>
                {isUser && message.note && (
                  <p className="max-w-[88%] text-[12.5px] leading-relaxed text-ink-mute">
                    {message.note}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
