import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Check, Home as HomeIcon, RotateCcw, Shuffle } from "lucide-react";
import { MOVE_META, MOVE_ORDER, type Outcome } from "@shared/sellio";
import { useConversation } from "@/state/ConversationContext";
import { BrandMark } from "@/components/Brand";
import { Avatar } from "@/components/Avatar";
import { OutcomePill, ScoreRing, StatChip } from "@/components/eval/ScoreRing";
import { MomentumChart } from "@/components/eval/MomentumChart";
import { MoveTally, PatienceTimeline, PhaseBars } from "@/components/eval/ReviewDetails";
import { KeyMomentCard } from "@/components/eval/KeyMomentCard";
import { AnnotatedTranscript } from "@/components/eval/AnnotatedTranscript";

const HEADLINES: Record<Exclude<Outcome, "none">, string> = {
  closed: "Avtalen er i havn.",
  lost: "Kunden gikk.",
  open: "Kunden står på gjerdet.",
};

function AnalysingState() {
  return (
    <div className="flex min-h-[calc(100dvh-72px)] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <div className="relative flex h-24 w-24 animate-breathe items-center justify-center rounded-full bg-brand-soft p-2.5">
          <BrandMark className="h-full w-full" alt="" />
        </div>
      </div>
      <h1 className="text-[26px] font-extrabold sm:text-[32px]">Analyserer samtalen …</h1>
      <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-mute">
        Vi går gjennom hvert trekk, veier det mot kundens reaksjon og ser etter det du gjorde bra –
        og det du kunne gjort annerledes.
      </p>
      <div className="mt-8 flex items-center gap-2 text-[13px] text-ink-mute">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" />
        <span className="ml-1">Dette tar vanligvis 10–20 sekunder</span>
      </div>
    </div>
  );
}

export default function Evaluation() {
  const conversation = useConversation();
  const [, navigate] = useLocation();
  const [highlight, setHighlight] = useState<number | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const { scenario, evaluation, phase, scenarioId, messages } = conversation;

  useEffect(() => {
    if (!scenarioId) navigate("/scenarier");
  }, [scenarioId, navigate]);

  const labelsByIndex = useMemo(() => {
    const map = new Map<number, { label: (typeof messages)[number]["label"]; why: string }>();
    evaluation?.moves.forEach(move => map.set(move.index, { label: move.label, why: move.why }));
    return map;
  }, [evaluation]);

  if (!scenario || !scenarioId) return null;

  if (phase === "evaluating") return <AnalysingState />;

  if (!evaluation) {
    return (
      <div className="shell flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-[26px] font-extrabold">Gjennomgangen stoppet</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-mute">
          {conversation.error ?? "Noe gikk galt da vi skulle lage tilbakemeldingen."} Transkriptet er
          fortsatt lagret, så du kan prøve igjen uten å miste samtalen.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="pill-primary" onClick={conversation.retryEvaluation}>
            Prøv igjen
          </button>
          <button type="button" className="pill-outline" onClick={() => navigate("/scenarier")}>
            Velg ny kunde
          </button>
        </div>
      </div>
    );
  }

  const outcome = evaluation.outcome === "none" ? "open" : evaluation.outcome;
  const userMoves = messages.filter(message => message.role === "user");
  const startPatience = scenario.patienceStart;
  const isRun = scenario.mode === "run";
  const bestMove = [...evaluation.moves].sort(
    (a, b) => MOVE_ORDER.indexOf(a.label) - MOVE_ORDER.indexOf(b.label)
  )[0];

  /**
   * The real patience change for every move, taken from the conversation state.
   * The review's own deltas are used for the reasoning, never for the numbers,
   * so the timeline always adds up to the final patience.
   */
  const patienceEvents = (() => {
    const moves = messages
      .map((message, index) => ({ message, index }))
      .filter(entry => entry.message.role === "user" && entry.message.snapshot);

    return moves
      .map((entry, order) => {
        const before = entry.message.snapshot!.patience;
        const after = moves[order + 1]?.message.snapshot?.patience ?? conversation.patience;
        const reason =
          evaluation.patienceEvents.find(event => event.index === entry.index)?.reason ?? "";
        return { index: entry.index, delta: after - before, reason };
      })
      .filter(event => event.delta !== 0 || event.reason);
  })();

  const selectIndex = (index: number) => {
    setHighlight(index);
    setTranscriptOpen(true);
    window.setTimeout(() => {
      document.getElementById(`msg-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const retryScenario = () => {
    conversation.startScenario(scenario.id);
    navigate(`/ovelse/${scenario.id}`);
  };

  const retryFrom = (index: number) => {
    conversation.retryFrom(index);
    navigate(`/ovelse/${scenario.id}`);
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="blob-bg left-[-8%] top-[-32%] h-[300px] w-[300px] opacity-25"
          style={{ background: "#ff7300" }}
          aria-hidden="true"
        />
        <div
          className="blob-bg bottom-[-40%] right-[-4%] h-[340px] w-[340px] opacity-20"
          style={{ background: "#ece5ff" }}
          aria-hidden="true"
        />

        <div className="shell relative z-10 py-10 sm:py-14">
          <div className="grid items-center gap-9 lg:grid-cols-[260px_1fr] lg:gap-14">
            <div className="flex items-center gap-6 lg:flex-col lg:items-start">
              <ScoreRing score={evaluation.accuracy} size={180} />
              <div className="flex flex-col gap-2.5">
                <OutcomePill outcome={outcome} />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Nøyaktighet
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Salgsgjennomgang · {scenario.title}
              </span>

              <h1 className="mt-4 text-[32px] font-extrabold leading-[1.02] text-white sm:text-[44px]">
                {HEADLINES[outcome as Exclude<Outcome, "none">]}
              </h1>

              {evaluation.summary && (
                <p className="mt-4 max-w-[62ch] text-[15.5px] leading-[1.65] text-white/70">
                  {evaluation.summary}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <StatChip tone="dark" label="Trekk fra deg" value={String(userMoves.length)} />
                <StatChip
                  tone="dark"
                  label="Tålmodighet"
                  value={`${startPatience} → ${conversation.patience}`}
                />
                {isRun && (
                  <>
                    <StatChip tone="dark" label="Nei i økten" value={String(conversation.nos)} />
                    <StatChip
                      tone="dark"
                      label="Samtaler"
                      value={`${conversation.callsCompleted} av ${scenario.callsTarget ?? 10}`}
                    />
                  </>
                )}
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={retryScenario}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
                  {isRun ? "Ta ringerekka igjen" : "Prøv dette scenariet igjen"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/scenarier")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-[15px] font-medium text-white transition hover:bg-white/10"
                >
                  <Shuffle className="h-4 w-4" strokeWidth={2.2} />
                  Ny kunde
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[15px] font-medium text-white/70 transition hover:text-white"
                >
                  <HomeIcon className="h-4 w-4" strokeWidth={2.2} />
                  Forsiden
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Momentum */}
      <section className="shell relative z-20 -mt-6">
        <div className="card-soft p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                Momentum
              </p>
              <h2 className="mt-1 text-[22px] font-extrabold">Kjøpsinteressen gjennom samtalen</h2>
            </div>
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-ink-mute">
              Hvert punkt er en replikk fra deg. Fall betyr at kunden ble kjøligere, hopp betyr at du
              traff.
            </p>
          </div>

          <div className="mt-4">
            <MomentumChart
              points={evaluation.momentum}
              messages={messages}
              onSelect={selectIndex}
              selected={highlight}
            />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              Slik spilte du
            </p>
            <MoveTally tally={evaluation.tally} />
          </div>
        </div>
      </section>

      {/* Run summary */}
      {isRun && conversation.calls.length > 0 && (
        <section className="shell mt-4">
          <div className="card-soft p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              Ringerekka
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {conversation.calls.map((call, index) => (
                <span
                  key={`${call.name}-${index}`}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                    call.no ? "bg-page text-ink-soft" : "bg-sage text-[#1f6b46]"
                  }`}
                >
                  <span className="text-[11px] font-bold opacity-50">{index + 1}</span>
                  {call.name}
                  <span className="text-[11.5px] opacity-70">{call.no ? "nei" : "kanskje"}</span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-mute">
              {conversation.nos} nei og {conversation.calls.length - conversation.nos} kanskje. Det er{" "}
              {conversation.calls.length}{" "}
              {conversation.calls.length === 1 ? "samtale" : "samtaler"} du ikke hadde i går.
            </p>
          </div>
        </section>
      )}

      {/* Phases + patience */}
      <section className="shell mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card-soft p-5 sm:p-7">
          <h2 className="text-[20px] font-extrabold">Fasene i samtalen</h2>
          <p className="mt-1 text-[13px] text-ink-mute">
            Den svakeste fasen er det viktigste å trene på nå.
          </p>
          <div className="mt-5">
            <PhaseBars phases={evaluation.phases} />
          </div>
        </div>

        <div className="card-soft p-5 sm:p-7">
          <h2 className="text-[20px] font-extrabold">Tålmodigheten</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">
            Kunden hadde {startPatience} i tålmodighet da dere startet og {conversation.patience} ved
            slutt. Den var skjult for deg underveis – her ser du hva som flyttet den.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-ink/70"
                style={{ width: `${Math.max(conversation.patience, 2)}%` }}
              />
            </div>
            <span className="text-[13px] font-bold tabular-nums text-ink-soft">
              {conversation.patience}/100
            </span>
          </div>

          <div className="mt-5">
            {patienceEvents.length > 0 ? (
              <PatienceTimeline events={patienceEvents} messages={messages} />
            ) : (
              <p className="text-[13.5px] leading-relaxed text-ink-mute">
                Tålmodigheten holdt seg stabil gjennom hele samtalen.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Key moments */}
      {evaluation.keyMoments.length > 0 && (
        <section className="shell mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                Nøkkeløyeblikk
              </p>
              <h2 className="mt-1 text-[26px] font-extrabold sm:text-[30px]">
                Der samtalen snudde
              </h2>
            </div>
            <p className="max-w-[36ch] text-[13px] leading-relaxed text-ink-mute">
              De største svingningene, med en replikk du faktisk kunne brukt i stedet.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {evaluation.keyMoments.map(moment => (
              <KeyMomentCard
                key={`${moment.index}-${moment.label}`}
                moment={moment}
                message={messages[moment.index]}
                onRetry={retryFrom}
                canRetry={!isRun && Boolean(messages[moment.index]?.snapshot)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Training focus */}
      <section className="shell mt-10">
        <div className="relative overflow-hidden rounded-[30px] bg-peach px-5 py-7 sm:px-9 sm:py-9">
          <div className="relative z-10 grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a85300]">
                Neste økt
              </p>
              <h2 className="mt-2 text-[26px] font-extrabold leading-[1.08] sm:text-[32px]">
                Tre ting å prøve neste gang.
              </h2>
              <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-soft/80">
                Konkrete grep fra denne samtalen – ikke generelle råd.
              </p>
            </div>

            <ol className="space-y-3">
              {evaluation.focus.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3.5 backdrop-blur"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11.5px] font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-ink">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Transcript */}
      <section className="shell mt-6">
        <AnnotatedTranscript
          messages={messages.map((message, index) => {
            const review = labelsByIndex.get(index);
            return review
              ? { ...message, label: review.label, note: review.why }
              : message;
          })}
          open={transcriptOpen}
          onToggle={() => setTranscriptOpen(current => !current)}
          highlight={highlight}
          onSelect={selectIndex}
        />
      </section>

      {/* Closing */}
      <section className="shell mt-6">
        <div className="flex flex-col items-start gap-6 rounded-[30px] border border-line bg-white px-5 py-7 sm:flex-row sm:items-center sm:px-9">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft p-1.5">
              <BrandMark className="h-full w-full" alt="" />
            </div>
            <p className="max-w-[52ch] text-[15.5px] font-medium leading-relaxed text-ink">
              {evaluation.closingNote ||
                "Hver samtale du tar er en samtale flere. Prøv en gang til – du vet mer nå."}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2.5 sm:ml-auto sm:w-auto">
            <button type="button" onClick={retryScenario} className="pill-primary !py-3">
              Prøv igjen
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/scenarier")}
              className="pill-outline !py-3"
            >
              <Check className="h-4 w-4" strokeWidth={2.6} />
              Ny kunde
            </button>
          </div>
        </div>

        {bestMove && (
          <p className="mt-4 text-center text-[12px] text-ink-mute">
            Beste trekk: {MOVE_META[bestMove.label].label} · {userMoves.length}{" "}
            {userMoves.length === 1 ? "replikk" : "replikker"} vurdert
          </p>
        )}
      </section>
    </div>
  );
}
