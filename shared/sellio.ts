import scenarioData from "./scenarios.json";

/* ------------------------------------------------------------------ *
 * Scenario library
 * ------------------------------------------------------------------ */

export type Difficulty = "gronn" | "gul" | "rod";
export type ScenarioMode = "single" | "run";
export type VoiceGender = "female" | "male" | "mixed";

export interface AvatarConfig {
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bun" | "curly";
  shirt: string;
  bg: string;
}

export interface RunCustomer {
  name: string;
  mood: string;
  temperament: string;
}

export interface Scenario {
  id: string;
  mode: ScenarioMode;
  tag?: string;
  title: string;
  customerName: string;
  age: number | null;
  situation: string;
  difficulty: Difficulty;
  goalLine: string;
  background: string;
  products: string[];
  callGoal: string;
  persona: string;
  hiddenNeeds: string[];
  objections: string[];
  buyingConditions: string[];
  patienceStart: number;
  successCondition: string;
  openingLine: string;
  voice: VoiceGender;
  avatar: AvatarConfig;
  callsTarget?: number;
  runCustomers?: RunCustomer[];
}

export const scenarios = scenarioData as Scenario[];

export function getScenario(id: string | undefined): Scenario | undefined {
  if (!id) return undefined;
  return scenarios.find(scenario => scenario.id === id);
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  gronn: "Grønn",
  gul: "Gul",
  rod: "Rød",
};

export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  gronn: "Rolig kunde som er åpen for å kjøpe",
  gul: "Kunden har innvendinger og begrenset tålmodighet",
  rod: "Kunden er skeptisk og nær ved å avslutte",
};

/* ------------------------------------------------------------------ *
 * Conversation
 * ------------------------------------------------------------------ */

export type Speaker = "customer" | "user" | "system";
export type Outcome = "none" | "closed" | "lost" | "open";

export interface TranscriptMessage {
  id: string;
  role: Speaker;
  text: string;
  at: number;
  /** Which cold call inside a run this message belongs to (1-based). */
  call?: number;
  /** Name of the customer in the current call, used by the run scenario. */
  speakerName?: string;
  /** Filled in by the evaluation. */
  label?: MoveLabel;
  note?: string;
  /** Conversation state right before this user message, used by "retry from here". */
  snapshot?: { patience: number; interest: number };
}

export type MoveLabel =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "miss"
  | "blunder";

export const MOVE_ORDER: MoveLabel[] = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "book",
  "inaccuracy",
  "mistake",
  "miss",
  "blunder",
];

export const MOVE_META: Record<
  MoveLabel,
  { label: string; short: string; color: string; tint: string }
> = {
  brilliant: { label: "Strålende", short: "!!", color: "#6d5ae6", tint: "#efeaff" },
  great: { label: "Sterk", short: "!", color: "#2f9e6f", tint: "#e4f4ec" },
  best: { label: "Beste", short: "★", color: "#2b8a5f", tint: "#e9f6ef" },
  excellent: { label: "Utmerket", short: "✓", color: "#3f9e6a", tint: "#eef7f2" },
  good: { label: "God", short: "·", color: "#7b8794", tint: "#f1f2f4" },
  book: { label: "Standard", short: "≡", color: "#9aa3ad", tint: "#f4f5f7" },
  inaccuracy: { label: "Unøyaktig", short: "?!", color: "#c08a2e", tint: "#fdf3e2" },
  mistake: { label: "Feil", short: "?", color: "#d97706", tint: "#fdf0e4" },
  miss: { label: "Tapt sjanse", short: "∅", color: "#c2703c", tint: "#fbeee6" },
  blunder: { label: "Blunder", short: "✕", color: "#d64545", tint: "#fdeaea" },
};

export type PhaseKey =
  | "opening"
  | "need"
  | "objections"
  | "rapport"
  | "relevance"
  | "closing";

export const PHASE_ORDER: PhaseKey[] = [
  "opening",
  "need",
  "objections",
  "rapport",
  "relevance",
  "closing",
];

export const PHASE_LABEL: Record<PhaseKey, string> = {
  opening: "Åpningen",
  need: "Kartlegge behov",
  objections: "Håndtere innvendinger",
  rapport: "Kommunikasjon og kontakt",
  relevance: "Relevans i tilbudet",
  closing: "Avslutning",
};

export interface PhaseScore {
  key: PhaseKey;
  score: number;
  verdict: string;
}

export interface KeyMoment {
  index: number;
  label: MoveLabel;
  from: number;
  to: number;
  why: string;
  better: string;
  betterWhy: string;
}

export interface MoveReview {
  index: number;
  label: MoveLabel;
  why: string;
}

export interface PatienceEvent {
  index: number;
  delta: number;
  reason: string;
}

export interface Evaluation {
  accuracy: number;
  outcome: Outcome;
  summary: string;
  tally: Partial<Record<MoveLabel, number>>;
  momentum: { index: number; value: number }[];
  phases: PhaseScore[];
  moves: MoveReview[];
  keyMoments: KeyMoment[];
  focus: string[];
  closingNote: string;
  patienceEvents: PatienceEvent[];
}

/* ------------------------------------------------------------------ *
 * API payloads
 * ------------------------------------------------------------------ */

export interface ChatTurnState {
  patience: number;
  interest: number;
  callIndex: number;
}

export interface ChatRequest {
  scenarioId: string;
  messages: { role: Speaker; text: string }[];
  state: ChatTurnState;
  runCustomer?: { name: string; mood: string; temperament: string } | null;
}

export interface ChatResponse {
  reply: string;
  interest: number;
  patience: number;
  patienceDelta: number;
  ended: boolean;
  outcome: Outcome;
  endReason: string;
}

export interface EvaluateRequest {
  scenarioId: string;
  messages: { role: Speaker; text: string }[];
  outcome: Outcome;
  patience: number;
  interest: number;
  callsCompleted?: number;
  nos?: number;
}

export type EvaluateResponse = Evaluation;
