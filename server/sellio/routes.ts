import express from "express";
import { invokeLLM } from "../_core/llm";
import {
  getScenario,
  MOVE_ORDER,
  PHASE_ORDER,
  type ChatRequest,
  type ChatResponse,
  type Evaluation,
  type EvaluateRequest,
  type Outcome,
  type Scenario,
} from "../../shared/sellio";
import {
  buildCustomerSystemPrompt,
  buildEvaluationPrompt,
  buildRunOpeningPrompt,
  normaliseEvaluation,
} from "./prompts";

const CHAT_MODEL = process.env.SELLIO_CHAT_MODEL || "claude-sonnet-4-6";
const EVAL_MODEL = process.env.SELLIO_EVAL_MODEL || "claude-sonnet-4-6";

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

/* ------------------------------------------------------------------ *
 * JSON helpers
 * ------------------------------------------------------------------ */

function extractJson(content: unknown): Record<string, unknown> {
  const text = typeof content === "string" ? content : JSON.stringify(content ?? "");
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model returned no JSON object");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

async function askJson(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  schema: { name: string; schema: Record<string, unknown> },
  maxTokens: number
): Promise<Record<string, unknown>> {
  const result = await invokeLLM({
    model,
    messages,
    maxTokens,
    responseFormat: { type: "json_schema", json_schema: { ...schema, strict: true } },
  });

  if ((result as { error?: { message?: string } }).error) {
    throw new Error(
      (result as { error?: { message?: string } }).error?.message ?? "LLM error"
    );
  }

  const choice = result.choices?.[0];
  const content = choice?.message?.content;
  if (!content || (typeof content === "string" && !content.trim())) {
    throw new Error("Model returned an empty answer");
  }
  return extractJson(content);
}

/* ------------------------------------------------------------------ *
 * Chat
 * ------------------------------------------------------------------ */

const TURN_SCHEMA = {
  name: "customer_turn",
  schema: {
    type: "object",
    properties: {
      reply: { type: "string" },
      interest: { type: "integer" },
      patienceDelta: { type: "integer" },
      ended: { type: "boolean" },
      outcome: { type: "string", enum: ["none", "closed", "lost", "open"] },
      endReason: { type: "string" },
    },
    required: ["reply", "interest", "patienceDelta", "ended", "outcome", "endReason"],
    additionalProperties: false,
  },
};

function fallbackOpening(scenario: Scenario): string {
  return scenario.openingLine || "Hei?";
}

function offlineChatResponse(
  scenario: Scenario,
  state: { patience: number; interest: number; callIndex: number },
  messages: ChatRequest["messages"],
  runCustomer: ChatRequest["runCustomer"]
): ChatResponse {
  const userTurns = messages.filter(message => message.role === "user");
  const latest = userTurns.at(-1)?.text.toLowerCase() ?? "";
  const asksQuestion = /\?|hvordan|hva|hvorfor|hvilke|kan du fortelle/.test(latest);
  const pushesProduct = /pris|tilbud|pakke|abonnement|10 gb|399|149/.test(latest);
  const pushesPastNo = /men|likevel|bare|du må|du burde|sikker på/.test(latest);
  const respectful = /skjønner|forstår|helt greit|respekterer|takk for/.test(latest);
  const delta = asksQuestion && respectful ? 5 : pushesProduct || pushesPastNo ? -9 : asksQuestion ? 2 : -3;
  const patience = clamp(state.patience + delta);
  const ended = patience <= 8 || (userTurns.length >= 3 && (pushesPastNo || !asksQuestion));
  const outcome: Outcome = ended ? "lost" : "none";

  if (userTurns.length === 0) {
    return {
      reply: runCustomer?.openingStyle?.replace(/^Svar med /i, "") || fallbackOpening(scenario),
      interest: state.interest,
      patience: state.patience,
      patienceDelta: 0,
      ended: false,
      outcome: "none",
      endReason: "",
    };
  }

  let reply = "Mhm. Hva er det konkret du mener?";
  if (ended) reply = runCustomer?.temperament === "hissig" ? "Nei, dette har jeg ikke tid til. Ha det." : "Jeg tror vi stopper her. Ha en fin dag.";
  else if (respectful && asksQuestion) reply = "Greit, det setter jeg pris på. Det som er vanskelig hos oss er egentlig å vite hva vi betaler for."
  else if (pushesProduct) reply = "Det høres ut som en vanlig salgspresentasjon. Hvorfor skulle dette være relevant for oss?";
  else if (asksQuestion) reply = "Det kommer an på hva du faktisk kan hjelpe med. Hva er forskjellen fra det vi har i dag?";
  else if (userTurns.length === 1) reply = "Jeg har ikke tid til en lang presentasjon. Hva gjelder det helt konkret?";

  return {
    reply,
    interest: clamp(state.interest + (asksQuestion && respectful ? 8 : pushesProduct ? -8 : 1)),
    patience,
    patienceDelta: patience - state.patience,
    ended,
    outcome,
    endReason: ended ? "Kunden avsluttet samtalen." : "",
  };
}

function offlineEvaluation(body: EvaluateRequest, messages: EvaluateRequest["messages"]): Evaluation {
  const userMessages = messages.filter(message => message.role === "user");
  const moves = userMessages.map((message, order) => {
    const text = message.text.toLowerCase();
    const label = /\?|hvordan|hva|hvorfor/.test(text) ? "good" : /pris|tilbud|abonnement/.test(text) ? "inaccuracy" : "book";
    return { index: order, label: label as Evaluation["moves"][number]["label"], why: label === "good" ? "Du åpnet for dialog med et spørsmål." : "Dette trekket ga kunden lite rom til å dele behovet sitt." };
  });
  const tally = Object.fromEntries(MOVE_ORDER.map(label => [label, moves.filter(move => move.label === label).length]));
  const momentum = userMessages.map((_, index) => ({ index, value: clamp(42 + index * 3 + (moves[index]?.label === "good" ? 10 : 0)) }));
  const score = clamp(50 + moves.filter(move => move.label === "good").length * 8 - moves.filter(move => move.label === "inaccuracy").length * 5);
  return {
    accuracy: score,
    outcome: body.outcome === "closed" ? "closed" : body.outcome === "lost" ? "lost" : "open",
    summary: "Dette er en lokal gjennomgang fordi AI-kvoten er brukt opp. Den vurderer spørsmål, relevans og respekt for kundens tid.",
    tally,
    momentum,
    phases: PHASE_ORDER.map((key, index) => ({ key, score: clamp(score + (index === 1 ? 5 : 0) - index * 2), verdict: index === 1 ? "Her har du mest å hente." : "Et greit utgangspunkt." })),
    moves,
    keyMoments: moves.slice(0, 3).map((move, index) => ({ index: move.index, label: move.label, from: momentum[index]?.value ?? 40, to: momentum[index]?.value ?? 40, why: move.why, better: "Hva er viktigst for dere akkurat nå?", betterWhy: "Et åpent spørsmål gir kunden rom til å vise behovet." })),
    focus: ["Still ett godt spørsmål før du presenterer produktet.", "Vis at du hørte kundens innvending.", "Avslutt respektfullt når kunden setter en tydelig grense."],
    closingNote: "Du kan fortsette å trene uten AI-kvote. Når kvoten er tilbake, får du en mer nyansert gjennomgang.",
    patienceEvents: userMessages.map((_, index) => ({ index, delta: index === 0 ? -3 : 0, reason: "Lokal heuristisk vurdering." })),
  };
}

const router = express.Router();

router.post("/chat", async (req, res) => {
  const body = req.body as ChatRequest;
  const scenario = getScenario(body?.scenarioId);
  if (!scenario) {
    res.status(404).json({ error: "unknown_scenario" });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const state = {
    patience: clamp(body.state?.patience ?? scenario.patienceStart),
    interest: clamp(body.state?.interest ?? 35),
    callIndex: Math.max(1, Math.round(body.state?.callIndex ?? 1)),
  };
  const userTurns = messages.filter(message => message.role === "user");

  try {
    // The customer opens the conversation before the salesperson has said anything.
    if (userTurns.length === 0) {
      if (scenario.mode === "run" && body.runCustomer) {
        const raw = await askJson(
          CHAT_MODEL,
          [
            {
              role: "system",
              content: buildRunOpeningPrompt(scenario, body.runCustomer, state.callIndex),
            },
            { role: "user", content: "Skriv din første replikk." },
          ],
          TURN_SCHEMA,
          300
        );
        res.json({
          reply: String(raw.reply ?? "Ja, hallo?"),
          interest: clamp(Number(raw.interest) || state.interest),
          patience: state.patience,
          patienceDelta: 0,
          ended: false,
          outcome: "none",
          endReason: "",
        } satisfies ChatResponse);
        return;
      }

      res.json({
        reply: fallbackOpening(scenario),
        interest: state.interest,
        patience: state.patience,
        patienceDelta: 0,
        ended: false,
        outcome: "none",
        endReason: "",
      } satisfies ChatResponse);
      return;
    }

    const conversation = messages
      .filter(message => message.role !== "system")
      .map(message => ({
        role: (message.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: message.text,
      }));

    const raw = await askJson(
      CHAT_MODEL,
      [
        {
          role: "system",
          content: buildCustomerSystemPrompt(scenario, state, body.runCustomer),
        },
        ...conversation,
      ],
      TURN_SCHEMA,
      400
    );

    const reply = String(raw.reply ?? "").trim();
    if (!reply) {
      res.status(502).json({ error: "empty_reply" });
      return;
    }

    const delta = Math.round(Number(raw.patienceDelta) || 0);
    let patience = clamp(state.patience + delta);
    let ended = Boolean(raw.ended);
    let outcome = (raw.outcome ?? "none") as Outcome;
    let endReason = String(raw.endReason ?? "");

    if (patience <= 0) {
      patience = 0;
      ended = true;
      if (outcome !== "closed") {
        outcome = "lost";
        endReason = endReason || "Kunden la på.";
      }
    }

    if (ended && outcome === "none") {
      outcome = "open";
      endReason = endReason || "Kunden avsluttet samtalen.";
    }

    if (!ended && outcome !== "none") {
      outcome = "none";
    }

    res.json({
      reply,
      interest: clamp(Number(raw.interest) || state.interest),
      patience,
      patienceDelta: patience - state.patience,
      ended,
      outcome,
      endReason,
    } satisfies ChatResponse);
  } catch (error) {
    console.error("[sellio] chat failed:", error);
    res.json(offlineChatResponse(scenario, state, messages, body.runCustomer));
  }
});

/* ------------------------------------------------------------------ *
 * Evaluation
 * ------------------------------------------------------------------ */

const labelEnum = MOVE_ORDER;
const phaseEnum = PHASE_ORDER;

const EVAL_SCHEMA = {
  name: "sales_review",
  schema: {
    type: "object",
    properties: {
      accuracy: { type: "integer" },
      outcome: { type: "string", enum: ["closed", "lost", "open"] },
      summary: { type: "string" },
      tally: {
        type: "object",
        properties: Object.fromEntries(
          labelEnum.map(label => [label, { type: "integer" }])
        ),
        required: labelEnum,
        additionalProperties: false,
      },
      momentum: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            value: { type: "integer" },
          },
          required: ["index", "value"],
          additionalProperties: false,
        },
      },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string", enum: phaseEnum },
            score: { type: "integer" },
            verdict: { type: "string" },
          },
          required: ["key", "score", "verdict"],
          additionalProperties: false,
        },
      },
      moves: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            label: { type: "string", enum: labelEnum },
            why: { type: "string" },
          },
          required: ["index", "label", "why"],
          additionalProperties: false,
        },
      },
      keyMoments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            label: { type: "string", enum: labelEnum },
            from: { type: "integer" },
            to: { type: "integer" },
            why: { type: "string" },
            better: { type: "string" },
            betterWhy: { type: "string" },
          },
          required: ["index", "label", "from", "to", "why", "better", "betterWhy"],
          additionalProperties: false,
        },
      },
      focus: { type: "array", items: { type: "string" } },
      closingNote: { type: "string" },
      patienceEvents: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            delta: { type: "integer" },
            reason: { type: "string" },
          },
          required: ["index", "delta", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "accuracy",
      "outcome",
      "summary",
      "tally",
      "momentum",
      "phases",
      "moves",
      "keyMoments",
      "focus",
      "closingNote",
      "patienceEvents",
    ],
    additionalProperties: false,
  },
};

router.post("/evaluate", async (req, res) => {
  const body = req.body as EvaluateRequest;
  const scenario = getScenario(body?.scenarioId);
  if (!scenario) {
    res.status(404).json({ error: "unknown_scenario" });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.some(message => message.role === "user")) {
    res.status(400).json({ error: "no_salesperson_messages" });
    return;
  }

  try {
    const raw = await askJson(
      EVAL_MODEL,
      [
        {
          role: "system",
          content:
            "Du er en norsk salgssjef som gjennomgår en salgssamtale. Du svarer bare med JSON som følger skjemaet.",
        },
        {
          role: "user",
          content: buildEvaluationPrompt({
            scenario,
            messages,
            outcome: body.outcome ?? "open",
            patience: clamp(body.patience ?? scenario.patienceStart),
            interest: clamp(body.interest ?? 40),
            callsCompleted: body.callsCompleted,
            nos: body.nos,
          }),
        },
      ],
      EVAL_SCHEMA,
      4000
    );

    const evaluation: Evaluation = normaliseEvaluation(
      raw as unknown as Partial<Evaluation>,
      messages
    );
    res.json(evaluation);
  } catch (error) {
    console.error("[sellio] evaluate failed:", error);
    res.json(offlineEvaluation(body, messages));
  }
});

/* ------------------------------------------------------------------ *
 * ElevenLabs voice
 * ------------------------------------------------------------------ */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_IDS: Record<"female" | "male", string> = {
  female: "EXAVITQu4vr4xnSDxMaL",
  male: "pNInz6obpgDQGcFmaJgB",
};

interface ElevenVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

let voiceCache: { key: string; at: number; voices: ElevenVoice[] } | null = null;

function resolveKey(req: express.Request, bodyKey?: unknown): string {
  const headerKey = req.header("x-elevenlabs-key");
  const fromBody = typeof bodyKey === "string" ? bodyKey.trim() : "";
  return (fromBody || headerKey || process.env.ELEVENLABS_API_KEY || "").trim();
}

async function listVoices(key: string): Promise<ElevenVoice[]> {
  if (voiceCache && voiceCache.key === key && Date.now() - voiceCache.at < 10 * 60_000) {
    return voiceCache.voices;
  }
  const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": key, accept: "application/json" },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw Object.assign(new Error(detail.slice(0, 300) || "voice_list_failed"), {
      status: response.status,
    });
  }
  const payload = (await response.json()) as { voices?: ElevenVoice[] };
  const voices = payload.voices ?? [];
  voiceCache = { key, at: Date.now(), voices };
  return voices;
}

function chooseVoice(
  voices: ElevenVoice[],
  gender: "female" | "male"
): ElevenVoice | undefined {
  const score = (voice: ElevenVoice) => {
    const labels = voice.labels ?? {};
    const language = `${labels.language ?? ""} ${labels.language_family ?? ""}`.toLowerCase();
    const voiceGender = (labels.gender ?? "").toLowerCase();
    let value = 0;
    if (language.includes("no") || language.includes("norw")) value += 4;
    if (voiceGender === gender) value += 3;
    if (labels.use_case?.includes("conversational")) value += 1;
    return value;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

router.get("/voice/config", (_req, res) => {
  res.set("Cache-Control", "no-store").json({
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
    provider: "elevenlabs",
    model: "eleven_multilingual_v2",
  });
});

router.post("/voice/tts", async (req, res) => {
  const text = String(req.body?.text ?? "").trim().slice(0, 900);
  const gender = req.body?.gender === "male" ? "male" : "female";
  const key = resolveKey(req, req.body?.key);

  if (!key) {
    res.status(503).json({ error: "voice_not_configured" });
    return;
  }
  if (!text) {
    res.status(400).json({ error: "empty_text" });
    return;
  }

  const synth = async (voiceId: string) =>
    fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          language_code: "no",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    );

  try {
    let voiceId = DEFAULT_VOICE_IDS[gender];
    let voices: ElevenVoice[] = [];
    try {
      voices = await listVoices(key);
      const picked = chooseVoice(voices, gender);
      if (picked) voiceId = picked.voice_id;
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        res.status(401).json({ error: "invalid_key" });
        return;
      }
    }

    let response = await synth(voiceId);
    if (!response.ok && (response.status === 400 || response.status === 404) && voices.length > 0) {
      const alternative = voices.find(voice => voice.voice_id !== voiceId);
      if (alternative) response = await synth(alternative.voice_id);
    }

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 401) {
        res.status(401).json({ error: "invalid_key" });
        return;
      }
      console.error("[sellio] elevenlabs error", response.status, detail.slice(0, 200));
      res.status(502).json({ error: "tts_failed", status: response.status });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res
      .status(200)
      .set({
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      })
      .end(buffer);
  } catch (error) {
    console.error("[sellio] tts failed", error);
    res.status(502).json({ error: "tts_failed" });
  }
});

export const sellioRouter = router;
