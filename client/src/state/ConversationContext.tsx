import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getScenario,
  type ChatResponse,
  type Evaluation,
  type Outcome,
  type RunCustomer,
  type Scenario,
  type TranscriptMessage,
} from "@shared/sellio";
import { postChat, postEvaluate } from "@/lib/api";
import { useVoice } from "@/lib/voice";

export type Phase = "idle" | "active" | "ending" | "evaluating" | "evaluated";

interface CallRecord {
  name: string;
  no: boolean;
  temperament: string;
}

interface ConversationState {
  scenarioId: string | null;
  phase: Phase;
  messages: TranscriptMessage[];
  patience: number;
  interest: number;
  callIndex: number;
  callCustomer: RunCustomer | null;
  runQueue: RunCustomer[];
  calls: CallRecord[];
  callsCompleted: number;
  nos: number;
  totalNos: number;
  outcome: Outcome;
  endReason: string;
  evaluation: Evaluation | null;
  pending: boolean;
  error: string | null;
}

interface ConversationContextValue extends ConversationState {
  scenario: Scenario | null;
  startScenario: (id: string) => void;
  send: (text: string) => void;
  resend: () => void;
  endEarly: () => void;
  retryEvaluation: () => void;
  retryFrom: (messageIndex: number) => void;
  reset: () => void;
  clearError: () => void;
}

const SESSION_KEY = "sellio:session";
const NOS_KEY = "sellio:nos";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function readTotalNos(): number {
  const raw = Number(window.localStorage.getItem(NOS_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const RUN_FIRST_NAMES = [
  "Eli", "Trond", "Marit", "Sindre", "Anne", "Geir", "Kamilla", "Petter",
  "Hanne", "Ola", "Ingrid", "Frode", "Maja", "Jon", "Heidi", "Arild",
  "Nora", "Thomas", "Liv", "Bjørn", "Silje", "Kjetil", "Ragnhild", "Pål",
];

const RUN_LAST_NAMES = [
  "Berg", "Dahl", "Haugen", "Solberg", "Nilsen", "Lund", "Moen", "Aas",
  "Rønning", "Hansen", "Eide", "Lie", "Bakke", "Sæther", "Vik", "Strand",
];

function randomRunCustomer(template: RunCustomer, usedNames: Set<string>): RunCustomer {
  let name = "";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const first = RUN_FIRST_NAMES[Math.floor(Math.random() * RUN_FIRST_NAMES.length)];
    const last = RUN_LAST_NAMES[Math.floor(Math.random() * RUN_LAST_NAMES.length)];
    const candidate = `${first} ${last}`;
    if (!usedNames.has(candidate)) {
      name = candidate;
      usedNames.add(candidate);
      break;
    }
  }
  return {
    ...template,
    name: name || "En tilfeldig kunde",
    age: 24 + Math.floor(Math.random() * 39),
  };
}

function initialState(): ConversationState {
  return {
    scenarioId: null,
    phase: "idle",
    messages: [],
    patience: 50,
    interest: 30,
    callIndex: 1,
    callCustomer: null,
    runQueue: [],
    calls: [],
    callsCompleted: 0,
    nos: 0,
    totalNos: typeof window === "undefined" ? 0 : readTotalNos(),
    outcome: "none",
    endReason: "",
    evaluation: null,
    pending: false,
    error: null,
  };
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConversationState>(initialState);
  const stateRef = useRef(state);
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const set = useCallback(
    (patch: Partial<ConversationState> | ((current: ConversationState) => Partial<ConversationState>)) => {
      const next = {
        ...stateRef.current,
        ...(typeof patch === "function" ? patch(stateRef.current) : patch),
      };
      stateRef.current = next;
      setState(next);
    },
    []
  );

  /* Restore an in-flight session so a refresh never loses the conversation. */
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<ConversationState>;
      if (!saved.scenarioId || !getScenario(saved.scenarioId)) return;
      const phase: Phase =
        saved.phase === "evaluating" || saved.phase === "ending" ? "active" : (saved.phase ?? "active");
      const restored: ConversationState = {
        ...initialState(),
        ...saved,
        phase,
        pending: false,
        error: null,
        totalNos: readTotalNos(),
      };
      stateRef.current = restored;
      setState(restored);
    } catch {
      /* ignore a broken snapshot */
    }
  }, []);

  useEffect(() => {
    if (!state.scenarioId) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    const { pending, error, ...rest } = state;
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(rest));
  }, [state]);

  const speak = useCallback((text: string, gender: "female" | "male" | "mixed") => {
    voiceRef.current.speak(text, gender);
  }, []);

  const requestOpening = useCallback(
    async (callIndex: number, customer: RunCustomer | null) => {
      const scenario = getScenario(stateRef.current.scenarioId ?? undefined);
      if (!scenario) return;
      set({ pending: true, error: null });
      try {
        const response = await postChat({
          scenarioId: scenario.id,
          messages: [],
          state: {
            patience: stateRef.current.patience,
            interest: stateRef.current.interest,
            callIndex,
          },
          runCustomer: customer,
        });
        const message: TranscriptMessage = {
          id: uid(),
          role: "customer",
          text: response.reply,
          at: Date.now(),
          call: callIndex,
          speakerName: customer?.name ?? scenario.customerName,
        };
        const latest = stateRef.current;
        if (
          latest.scenarioId !== scenario.id ||
          latest.callIndex !== callIndex ||
          (latest.callCustomer?.name ?? null) !== (customer?.name ?? null) ||
          latest.messages.some(item => item.role === "customer" && item.call === callIndex)
        ) {
          return;
        }
        set(current => ({ messages: [...current.messages, message], pending: false }));
        speak(response.reply, scenario.voice);
      } catch (error) {
        set({
          pending: false,
          error: error instanceof Error ? error.message : "Kunne ikke hente kunden.",
        });
      }
    },
    [set, speak]
  );

  const startNextCall = useCallback(async () => {
    const scenario = getScenario(stateRef.current.scenarioId ?? undefined);
    if (!scenario) return;
    const nextIndex = stateRef.current.callIndex + 1;
    const customer = stateRef.current.runQueue[nextIndex - 1] ?? null;
    const divider: TranscriptMessage = {
      id: uid(),
      role: "system",
      text: `${nextIndex}. samtale · ${customer?.name ?? "ny kunde"}`,
      at: Date.now(),
      call: nextIndex,
    };
    set(current => ({
      callIndex: nextIndex,
      callCustomer: customer,
      phase: "active",
      patience: scenario.patienceStart,
      interest: 28,
      outcome: "none",
      endReason: "",
      messages: [...current.messages, divider],
    }));
    await requestOpening(nextIndex, customer);
  }, [requestOpening, set]);

  const finish = useCallback(
    async (outcome: Outcome) => {
      const current = stateRef.current;
      const scenario = getScenario(current.scenarioId ?? undefined);
      if (!scenario) return;
      set({ phase: "evaluating", outcome });
      try {
        const evaluation = await postEvaluate({
          scenarioId: scenario.id,
          messages: current.messages
            .filter(message => message.role !== "system")
            .map(message => ({ role: message.role, text: message.text })),
          outcome,
          patience: current.patience,
          interest: current.interest,
          callsCompleted: current.callsCompleted,
          nos: current.nos,
        });
        set({ evaluation, phase: "evaluated", error: null });
      } catch (error) {
        set({
          phase: "evaluated",
          evaluation: null,
          error:
            error instanceof Error
              ? error.message
              : "Gjennomgangen kunne ikke lages. Transkriptet er trygt.",
        });
      }
    },
    [set]
  );

  const handleEnd = useCallback(
    async (response: ChatResponse) => {
      const current = stateRef.current;
      const scenario = getScenario(current.scenarioId ?? undefined);
      if (!scenario) return;

      if (scenario.mode === "run") {
        const isNo = response.outcome === "lost";
        const record: CallRecord = {
          name: current.callCustomer?.name ?? "Kunde",
          no: isNo,
          temperament: current.callCustomer?.temperament ?? "",
        };
        const calls = [...current.calls, record];
        const nos = current.nos + (isNo ? 1 : 0);
        let totalNos = current.totalNos;
        if (isNo) {
          totalNos += 1;
          window.localStorage.setItem(NOS_KEY, String(totalNos));
        }
        set({
          calls,
          callsCompleted: calls.length,
          nos,
          totalNos,
          phase: "ending",
          endReason: response.endReason,
        });

        const target = scenario.callsTarget ?? 10;
        if (calls.length >= target) {
          window.setTimeout(() => void finish("open"), 1100);
        } else {
          window.setTimeout(() => void startNextCall(), 1700);
        }
        return;
      }

      set({ phase: "ending", outcome: response.outcome, endReason: response.endReason });
      window.setTimeout(() => void finish(response.outcome), 1200);
    },
    [finish, set, startNextCall]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const current = stateRef.current;
      const scenario = getScenario(current.scenarioId ?? undefined);
      if (!trimmed || !scenario || current.pending) return;

      const userMessage: TranscriptMessage = {
        id: uid(),
        role: "user",
        text: trimmed,
        at: Date.now(),
        call: current.callIndex,
        snapshot: { patience: current.patience, interest: current.interest },
      };
      const messages = [...current.messages, userMessage];
      set({ messages, pending: true, error: null });

      const transcript = messages
        .filter(
          message =>
            message.role !== "system" &&
            (scenario.mode === "single" || message.call === current.callIndex)
        )
        .map(message => ({ role: message.role, text: message.text }));

      try {
        const response = await postChat({
          scenarioId: scenario.id,
          messages: transcript,
          state: {
            patience: current.patience,
            interest: current.interest,
            callIndex: current.callIndex,
          },
          runCustomer: current.callCustomer,
        });
        const customerMessage: TranscriptMessage = {
          id: uid(),
          role: "customer",
          text: response.reply,
          at: Date.now(),
          call: current.callIndex,
          speakerName: current.callCustomer?.name ?? scenario.customerName,
        };
        set(latest => ({
          messages: [...latest.messages, customerMessage],
          patience: response.patience,
          interest: response.interest,
          pending: false,
        }));
        speak(response.reply, scenario.voice);
        if (response.ended) await handleEnd(response);
      } catch (error) {
        set({
          pending: false,
          error:
            error instanceof Error
              ? error.message
              : "Kunden svarte ikke. Prøv igjen – samtalen er beholdt.",
        });
      }
    },
    [handleEnd, set, speak]
  );

  const resend = useCallback(async () => {
    const current = stateRef.current;
    const scenario = getScenario(current.scenarioId ?? undefined);
    if (!scenario || current.pending) return;
    const lastUser = [...current.messages].reverse().find(message => message.role === "user");
    if (!lastUser) return;

    set({ pending: true, error: null });
    const transcript = current.messages
      .filter(
        message =>
          message.role !== "system" &&
          (scenario.mode === "single" || message.call === current.callIndex)
      )
      .map(message => ({ role: message.role, text: message.text }));

    try {
      const response = await postChat({
        scenarioId: scenario.id,
        messages: transcript,
        state: {
          patience: current.patience,
          interest: current.interest,
          callIndex: current.callIndex,
        },
        runCustomer: current.callCustomer,
      });
      const customerMessage: TranscriptMessage = {
        id: uid(),
        role: "customer",
        text: response.reply,
        at: Date.now(),
        call: current.callIndex,
        speakerName: current.callCustomer?.name ?? scenario.customerName,
      };
      set(latest => ({
        messages: [...latest.messages, customerMessage],
        patience: response.patience,
        interest: response.interest,
        pending: false,
      }));
      speak(response.reply, scenario.voice);
      if (response.ended) await handleEnd(response);
    } catch (error) {
      set({
        pending: false,
        error: error instanceof Error ? error.message : "Kunden svarte ikke.",
      });
    }
  }, [handleEnd, set, speak]);

  const startScenario = useCallback(
    (id: string) => {
      const scenario = getScenario(id);
      if (!scenario) return;
      voiceRef.current.stop();

      const base = initialState();
      const startInterest = scenario.mode === "run" ? 26 : 32;

      if (scenario.mode === "run") {
        const target = scenario.callsTarget ?? 10;
        const usedNames = new Set<string>();
        const queue = shuffle(scenario.runCustomers ?? [])
          .slice(0, target)
          .map(template => randomRunCustomer(template, usedNames));
        const first = queue[0] ?? null;
        const divider: TranscriptMessage = {
          id: uid(),
          role: "system",
          text: `1. samtale · ${first?.name ?? "ny kunde"}`,
          at: Date.now(),
          call: 1,
        };
        set({
          ...base,
          scenarioId: id,
          phase: "active",
          patience: scenario.patienceStart,
          interest: startInterest,
          callIndex: 1,
          callCustomer: first,
          runQueue: queue,
          messages: [divider],
        });
        void requestOpening(1, first);
        return;
      }

      const opening: TranscriptMessage[] = scenario.openingLine
        ? [
            {
              id: uid(),
              role: "customer",
              text: scenario.openingLine,
              at: Date.now(),
              call: 1,
              speakerName: scenario.customerName,
            },
          ]
        : [];

      set({
        ...base,
        scenarioId: id,
        phase: "active",
        patience: scenario.patienceStart,
        interest: startInterest,
        messages: opening,
      });
      if (scenario.openingLine) speak(scenario.openingLine, scenario.voice);
    },
    [requestOpening, set, speak]
  );

  const endEarly = useCallback(() => {
    const current = stateRef.current;
    if (!current.messages.some(message => message.role === "user")) {
      voiceRef.current.stop();
      set({ ...initialState(), totalNos: current.totalNos });
      return;
    }
    voiceRef.current.stop();
    void finish(current.outcome === "none" ? "open" : current.outcome);
  }, [finish, set]);

  const retryEvaluation = useCallback(() => {
    void finish(stateRef.current.outcome === "none" ? "open" : stateRef.current.outcome);
  }, [finish]);

  const retryFrom = useCallback(
    (messageIndex: number) => {
      const current = stateRef.current;
      const target = current.messages[messageIndex];
      if (!target || target.role !== "user" || !target.snapshot) return;
      voiceRef.current.stop();
      set({
        messages: current.messages.slice(0, messageIndex),
        patience: target.snapshot.patience,
        interest: target.snapshot.interest,
        phase: "active",
        evaluation: null,
        outcome: "none",
        endReason: "",
        error: null,
        pending: false,
      });
    },
    [set]
  );

  const reset = useCallback(() => {
    voiceRef.current.stop();
    window.sessionStorage.removeItem(SESSION_KEY);
    set(initialState());
  }, [set]);

  const scenario = useMemo(() => getScenario(state.scenarioId ?? undefined) ?? null, [state.scenarioId]);

  const value = useMemo<ConversationContextValue>(
    () => ({
      ...state,
      scenario,
      startScenario,
      send,
      resend,
      endEarly,
      retryEvaluation,
      retryFrom,
      reset,
      clearError: () => set({ error: null }),
    }),
    [state, scenario, startScenario, send, resend, endEarly, retryEvaluation, retryFrom, reset, set]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) throw new Error("useConversation must be used inside ConversationProvider");
  return context;
}
