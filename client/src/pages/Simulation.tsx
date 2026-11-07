import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Flag } from "lucide-react";
import { getScenario, type AvatarConfig } from "@shared/sellio";
import { useConversation } from "@/state/ConversationContext";
import { Avatar } from "@/components/Avatar";
import { DifficultyBadge } from "@/components/Badges";
import { ChatBubble, TypingBubble } from "@/components/sim/ChatBubble";
import { Composer, EndDialog } from "@/components/sim/Composer";
import { ScenarioReminder } from "@/components/sim/ScenarioReminder";
import { VoiceControl } from "@/components/sim/VoiceControl";

const RUN_PALETTES: AvatarConfig[] = [
  { skin: "#f3c9a8", hair: "#2f2a26", hairStyle: "short", shirt: "#dcefe2", bg: "#dcefe2" },
  { skin: "#d9a87f", hair: "#4a3527", hairStyle: "long", shirt: "#ffe8d6", bg: "#ffe8d6" },
  { skin: "#eec2a2", hair: "#1f1a17", hairStyle: "bun", shirt: "#ece5ff", bg: "#ece5ff" },
  { skin: "#e8b892", hair: "#8a6a4f", hairStyle: "curly", shirt: "#fff3c4", bg: "#fff3c4" },
  { skin: "#f6d3b8", hair: "#7a4a2b", hairStyle: "short", shirt: "#e6eef5", bg: "#e6eef5" },
  { skin: "#d8a882", hair: "#b9b2a8", hairStyle: "short", shirt: "#ffe0e0", bg: "#ffe0e0" },
  { skin: "#c68b5f", hair: "#141313", hairStyle: "curly", shirt: "#dcefe2", bg: "#dcefe2" },
  { skin: "#f0c4a0", hair: "#5b3a21", hairStyle: "bun", shirt: "#fff3c4", bg: "#fff3c4" },
  { skin: "#e5b191", hair: "#2b2622", hairStyle: "long", shirt: "#ece5ff", bg: "#ece5ff" },
  { skin: "#fbe0c9", hair: "#a8622c", hairStyle: "curly", shirt: "#e6eef5", bg: "#e6eef5" },
];

function avatarForName(name: string, fallback: AvatarConfig): AvatarConfig {
  if (!name) return fallback;
  let hash = 5381;
  for (const character of name) {
    hash = (hash * 33 + character.charCodeAt(0)) % 100003;
  }
  return RUN_PALETTES[hash % RUN_PALETTES.length];
}

export default function Simulation() {
  const params = useParams<{ id: string }>();
  const scenario = getScenario(params.id);
  const conversation = useConversation();
  const [, navigate] = useLocation();
  const [endOpen, setEndOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { startScenario, phase, scenarioId, messages, pending, callIndex, callCustomer } =
    conversation;

  useEffect(() => {
    if (!scenario) {
      navigate("/scenarier");
      return;
    }
    if (scenarioId !== scenario.id) startScenario(scenario.id);
  }, [scenario, scenarioId, startScenario, navigate]);

  useEffect(() => {
    if (phase === "evaluating" || phase === "evaluated") navigate("/evaluering");
  }, [phase, navigate]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: messages.length > 2 ? "smooth" : "auto" });
  }, [messages.length, pending, phase]);

  if (!scenario) return null;

  const isRun = scenario.mode === "run";
  const target = scenario.callsTarget ?? 10;
  const customerName = isRun ? (callCustomer?.name ?? "Ny kunde") : scenario.customerName;
  const avatar = isRun ? avatarForName(customerName, scenario.avatar) : scenario.avatar;
  const hasMessages = messages.some(message => message.role === "user");
  const lastCall = conversation.calls[conversation.calls.length - 1];

  const statusLine = (() => {
    if (phase !== "ending") return null;
    if (isRun) {
      return lastCall?.no
        ? `${lastCall.name} sa nei. Det er ${conversation.nos}. nei i økten.`
        : `${lastCall?.name ?? "Kunden"} er ferdig.`;
    }
    return conversation.endReason || "Kunden avslutter samtalen.";
  })();

  return (
    <div className="relative">
      <div
        className="blob-bg left-[-12%] top-[10%] h-72 w-72 opacity-50"
        style={{ background: scenario.avatar.bg }}
        aria-hidden="true"
      />

      <div className="shell relative z-10 flex h-[calc(100dvh-72px)] flex-col gap-2.5 py-3 sm:gap-3 sm:py-5">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-[22px] border border-line bg-white px-3 py-2.5 sm:px-4 sm:py-3">
          <Avatar config={avatar} className="h-11 w-11 sm:h-12 sm:w-12" ring />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-bold leading-tight sm:text-[17px]">
              {customerName}
            </h1>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              {isRun ? (
                <span className="shrink-0 text-[12px] font-medium text-ink-mute">
                  Samtale {callIndex} av {target}
                </span>
              ) : (
                <span className="shrink-0">
                  <DifficultyBadge difficulty={scenario.difficulty} />
                </span>
              )}
              <span className="truncate text-[12.5px] text-ink-mute">{scenario.title}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <VoiceControl />
            <button
              type="button"
              onClick={() => setEndOpen(true)}
              className="pill-outline !px-3.5 !py-2 text-[13.5px] sm:!px-4 sm:!py-2.5"
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="hidden sm:inline">Avslutt og få tilbakemelding</span>
              <span className="sm:hidden">Avslutt</span>
            </button>
          </div>
        </div>

        {isRun ? (
          <div className="flex items-center gap-3 rounded-[18px] border border-line bg-white/70 px-3.5 py-2">
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: target }).map((_, index) => {
                const done = conversation.calls[index];
                return (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === conversation.calls.length && phase === "active"
                        ? "w-5 bg-brand"
                        : done
                          ? done.no
                            ? "w-1.5 bg-ink/40"
                            : "w-1.5 bg-[#2f9e6f]"
                          : "w-1.5 bg-line"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[12.5px] font-medium text-ink-soft">
              Nei i økten: <strong className="font-bold">{conversation.nos}</strong>
            </p>
            <p className="ml-auto text-[12px] text-ink-mute sm:hidden">
              Nei samlet: {conversation.totalNos} / 1000
            </p>
          </div>
        ) : (
          <ScenarioReminder scenario={scenario} />
        )}

        {/* Chat */}
        <div className="card-soft flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            <div className="flex min-h-full flex-col justify-end gap-3">
              {messages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  avatar={avatar}
                  showSpeakerName={isRun}
                  animate={index === messages.length - 1 && message.role === "customer"}
                />
              ))}

              {pending && <TypingBubble avatar={avatar} name={isRun ? customerName : undefined} />}

              {statusLine && (
                <div className="flex justify-center pt-1">
                  <span className="animate-pop-in rounded-full bg-ink px-4 py-2 text-[12.5px] font-medium text-white">
                    {statusLine}
                  </span>
                </div>
              )}
            </div>
          </div>

          {conversation.error && (
            <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-blush px-3.5 py-2.5 text-[13px] text-[#a02f22] sm:mx-4">
              <span className="flex-1">{conversation.error}</span>
              <button
                type="button"
                onClick={() => conversation.resend()}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#a02f22]"
              >
                Prøv igjen
              </button>
            </div>
          )}

          <Composer
            onSend={conversation.send}
            disabled={pending || phase !== "active"}
            placeholder={
              phase === "ending"
                ? "Kunden avslutter …"
                : isRun
                  ? `Svar ${customerName} …`
                  : "Skriv det du ville sagt …"
            }
          />
        </div>
      </div>

      <EndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        hasMessages={hasMessages}
        onConfirm={() => {
          setEndOpen(false);
          conversation.endEarly();
        }}
      />
    </div>
  );
}
