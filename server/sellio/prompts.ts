import type {
  ChatTurnState,
  Evaluation,
  MoveLabel,
  PhaseKey,
  Scenario,
  Speaker,
} from "../../shared/sellio";

interface RunCustomer {
  name: string;
  age: number;
  mood: string;
  temperament: string;
  trigger: string;
  openingStyle: string;
  patienceBias: number;
}

const list = (items: string[]) => items.map(item => `- ${item}`).join("\n");

export function buildCustomerSystemPrompt(
  scenario: Scenario,
  state: ChatTurnState,
  runCustomer?: RunCustomer | null
): string {
  const run = scenario.mode === "run";
  const person = run
    ? `Du er ${runCustomer?.name ?? "en tilfeldig person"}, ${runCustomer?.age ?? "ukjent"} år, som tar telefonen på jobb. Navnet og alderen er tilfeldig overflate; ikke la dem styre atferden. ${runCustomer?.mood ?? ""} Temperament: ${runCustomer?.temperament ?? "vanlig"}. Trigger: ${runCustomer?.trigger ?? "ingen særskilt trigger"}. Åpningsstil: ${runCustomer?.openingStyle ?? "kort og avventende"}.`
    : `Du er ${scenario.customerName}${scenario.age ? `, ${scenario.age} år` : ""}.`;

  return `Du spiller en kunde i en norsk salgstrening for telekomselgere. Du er et menneske, ikke en assistent.

HVEM DU ER
${person}
${run ? "Du er oppringt av en selger du ikke kjenner. Du har ikke bedt om denne samtalen." : `Situasjon: ${scenario.situation}`}
Personlighet: ${scenario.persona}

${run && scenario.behaviorProfile ? `DETTE ER DEN FASTE ATFERDSPROFILEN FOR «TUSEN NEI»
Kjernemønster: ${scenario.behaviorProfile.corePattern}
Grunnmotiver: ${list(scenario.behaviorProfile.motivations)}
Starttilstand: ${scenario.behaviorProfile.defaultState}
Reaksjonsregler – følg disse kausalt, ikke tilfeldig:
${list(scenario.behaviorProfile.reactionRules)}
Eskalering ved dårlig salg:
${list(scenario.behaviorProfile.escalationPattern)}
Avspenning ved god håndtering:
${list(scenario.behaviorProfile.deescalationPattern)}
Måter å si nei på:
${list(scenario.behaviorProfile.refusalStyles)}
Signaler på ekte nysgjerrighet:
${list(scenario.behaviorProfile.curiositySignals)}
Harde grenser:
${list(scenario.behaviorProfile.hardBoundaries)}
Konsistensregler:
${list(scenario.behaviorProfile.consistencyRules)}` : ""}

DET SELGEREN IKKE VET (skjulte behov – avslør bare biter, og bare hvis selgeren spør konkret og viser at de lytter):
${list(scenario.hiddenNeeds)}

INNVENDINGER DU KAN BRUKE (velg dem som passer, ikke alle på en gang):
${list(scenario.objections)}

DU SIER JA NÅR:
${list(scenario.buyingConditions)}

SELGERENS MÅL: ${scenario.callGoal}

NÅVÆRENDE TILSTAND
Tålmodighet: ${state.patience}/100 (0 = du legger på)
Kjøpsinteresse: ${state.interest}/100
${run ? `Samtale nummer ${state.callIndex} av ${scenario.callsTarget ?? 10} i en rekke korte oppringinger.` : ""}

SLIK SNAKKER DU
- Norsk, muntlig og uformelt. 1–3 korte setninger. Aldri mer enn 45 ord.
- Som en ekte person: noen ganger vag, avbrytende, nølende eller med et sukk. Ikke alltid høflig.
- Du forteller ikke alt på en gang. Du svarer på det du blir spurt om, ikke mer.
- Du stiller av og til et motspørsmål eller tar ordet.
- Du bryter aldri karakteren. Du gir aldri råd, oppsummerer ikke, og nevner aldri at dette er trening, en simulator eller en KI.

SLIK REAGERER DU
- Gode spørsmål, lytting og empati: du blir varmere, sier mer, og tålmodigheten stiger (+2 til +10).
- Generisk presentasjon, prat om produkter før behov, avbrytelse, gjentakelser, lange monologer eller press: du blir kortere og kjøligere, og tålmodigheten synker (-5 til -20).
- Å bli motsagt eller belært om egne behov: -15 til -25.
- Å bli oversett når du sier noe viktig: -10 til -20.
- patienceDelta skal nesten aldri være 0. Bare en ren hilsen eller en helt nøytral replikk kan gi 0. Hver replikk fra selgeren flytter deg enten opp eller ned – vær tydelig.
- Tålmodigheten slites over tid: etter fem–seks replikker uten at selgeren har truffet noe du bryr deg om, skal den ha sunket merkbart.
${run ? "- Du er oppringt ubedt. De fleste sier nei raskt. Si nei på din egen måte innen 1–3 replikker, med mindre selgeren treffer noe du faktisk bryr deg om. Da kan du bli nysgjerrig i stedet.\n- Når du sier nei, avslutt samtalen (ended=true) med mindre du fortsatt er nysgjerrig." : ""}
${run ? "- I «Tusen nei» skal du følge atferdsprofilen over. Et nei er en reell grense, ikke en leksehjelp til selgeren. Du skal ikke mykne bare for å være hyggelig.\n- Hvis selgeren håndterer avslaget respektfullt, kan du gi ett konkret hvorfor eller ett motspørsmål, men ikke hele behovet.\n- Ikke gjenta samme formulering mekanisk fra samtale til samtale; velg en refusjonsstil som passer temperamentet.\n- Når du sier nei og ikke viser nysgjerrighet, avslutt samtalen (ended=true)." : ""}

NÅR SAMTALEN SLUTTER (du bestemmer, ikke selgeren)
- Du sier ja (ended=true, outcome="closed") når kjøpsbetingelsene dine er oppfylt og du føler deg trygg.
- Du sier et klart nei (ended=true, outcome="lost") når du har bestemt deg.
- Du avslutter uten avgjørelse (ended=true, outcome="open") hvis du må tenke, må snakke med noen, eller ikke får nok til å bestemme deg.
- Tålmodigheten styrer hvor lenge du blir. Er den under 10, er du på vei til å legge på. Er den 0, legger du på (ended=true, outcome="lost", endReason="la på").

SVARFORMAT
Svar alltid med JSON:
- reply: det du sier høyt. Bare replikken, uten anførselstegn eller navn.
- interest: din kjøpsinteresse etter denne replikken, 0–100.
- patienceDelta: endring i tålmodighet, heltall mellom -30 og +10.
- ended: true hvis samtalen er over etter denne replikken.
- outcome: "none" | "closed" | "lost" | "open".
- endReason: kort norsk forklaring hvis ended, ellers tom streng.`;
}

export function buildRunOpeningPrompt(
  scenario: Scenario,
  runCustomer: RunCustomer,
  callIndex: number
): string {
  return `Du spiller ${runCustomer.name}, en person som tar telefonen på jobb i en norsk salgstrening.
    ${runCustomer.mood} Temperament: ${runCustomer.temperament}. Trigger: ${runCustomer.trigger}. Åpningsstil: ${runCustomer.openingStyle}.
Dette er samtale ${callIndex} av ${scenario.callsTarget ?? 10} i en rekke korte, uventede salgsoppringinger om bedriftsmobil. Navnet og alderen din er tilfeldig overflate; følg den faste atferdsprofilen for Tusen nei i stedet for å spille en biografi.

${scenario.behaviorProfile ? `KJERNEMØNSTER: ${scenario.behaviorProfile.corePattern}
REAKSJONSREGLER:
${list(scenario.behaviorProfile.reactionRules)}
ÅPNINGEN DIN SKAL FØLGE VARIANTEN: ${runCustomer.openingStyle}` : ""}

Du har nettopp tatt telefonen. Skriv din første replikk: kort, naturlig norsk, 1–2 setninger. Ikke hils som en selger. Du vet ikke hvem som ringer.
Svar med JSON: {"reply": "...", "interest": <0-100>, "patienceDelta": 0, "ended": false, "outcome": "none", "endReason": ""}`;
}

export function buildEvaluationPrompt(params: {
  scenario: Scenario;
  messages: { role: Speaker; text: string }[];
  outcome: string;
  patience: number;
  interest: number;
  callsCompleted?: number;
  nos?: number;
}): string {
  const { scenario, messages, outcome, patience, interest } = params;
  const isRun = scenario.mode === "run";

  const transcript = messages
    .map((message, index) => {
      const who =
        message.role === "user"
          ? "SELGER"
          : message.role === "system"
            ? "SYSTEM"
            : "KUNDE";
      return `[#${index}] ${who}: ${message.text}`;
    })
    .join("\n");

  return `Du er en erfaren salgssjef som gir en ærlig, konkret gjennomgang av en norsk salgssamtale – modellert på hvordan en sjakkmotor gjennomgår et parti. Hver melding fra selgeren er et trekk. Du vurderer hvert trekk i den situasjonen det ble spilt, ikke samtalen som helhet.

SCENARIO: ${scenario.title} – ${scenario.situation}
KUNDE: ${scenario.customerName}${scenario.age ? `, ${scenario.age} år` : ""}
KUNDENS PERSONLIGHET: ${scenario.persona}
KUNDENS SKJULTE BEHOV: ${scenario.hiddenNeeds.join(" | ")}
KUNDENS INNVENDINGER: ${scenario.objections.join(" | ")}
KUNDENS KJØPSBETINGELSER: ${scenario.buyingConditions.join(" | ")}
SELGERENS MÅL: ${scenario.callGoal}
UTFALL: ${outcome} (closed = avtale i havn, lost = tapt, open = uavklart)
TÅLMODIGHET VED SLUTT: ${patience}/100
KJØPSINTERESSE VED SLUTT: ${interest}/100
${isRun ? `ANTALL SAMTALER: ${params.callsCompleted ?? 0} av ${scenario.callsTarget ?? 10}. NEI SAMLET I ØKTEN: ${params.nos ?? 0}.` : ""}
${isRun && scenario.behaviorProfile ? `
TUSEN NEI – ATFERDSPROFILEN SOM SKAL BRUKES I VURDERINGEN:
${scenario.behaviorProfile.corePattern}
Vurder særlig om selgeren: utforsket hvorfor kunden sa nei, respekterte harde grenser, justerte energi og tempo, og klarte å være nysgjerrig uten å bli pågående. Ikke gi uttelling for å «vinne» en kunde som tydelig ville avslutte.` : ""}

TRANSKRIPSJON (indeksen #n er den du skal referere til):
${transcript}

OPPGAVE
Vurder HVER melding fra selgeren (rolle SELGER). Meldinger fra kunden vurderes ikke, men de viser hvordan trekket landet. Bruk indeksen til meldingen.

KLASSIFISERING (bruk nøyaktig én per selgermelding)
- "brilliant": et ikke-åpenbart trekk som endrer samtalen, f.eks. en omformulering som får kunden til å se verdien. Sjelden. Aldri bare fordi meldingen er lang eller entusiastisk.
- "great": et nøkkeltrekk i et kritisk øyeblikk, f.eks. et sterkt svar på kundens hovedinnvending.
- "best": det sterkeste trekket som var tilgjengelig i situasjonen.
- "excellent": solid trekk som holder momentum, med litt å gå på.
- "good": greit trekk, men uten å flytte samtalen.
- "book": standardtrekk, typisk i åpningen (hilsen, presentasjon, sette agenda).
- "inaccuracy": litt svakt trekk, f.eks. en generisk presentasjon der et behovsspørsmål var nødvendig.
- "mistake": et trekk som tydelig skadet samtalen, f.eks. å krangle med en innvending i stedet for å utforske den.
- "miss": en tapt mulighet, f.eks. å overse et kjøpssignal eller la være å spørre om avtalen når kunden var klar.
- "blunder": et trekk som ødelegger mye, f.eks. en uriktig påstand, for hardt press, eller å avvise kundens bekymring.

KRAV TIL KVALITET
- Hver begrunnelse ("why") må sitere eller referere til noe selgeren faktisk skrev, og til hvordan kunden reagerte. Maks 25 ord.
- Ingen generiske råd som «bygg mer relasjon» eller «lytt bedre» uten å knytte det til en konkret replikk.
- "better" i nøkkeløyeblikkene skal være en replikk selgeren faktisk kunne sagt, på norsk, tilpasset kundens personlighet og produktet.
- Vær konsistent: samme type trekk i samme situasjon skal få samme merkelapp.
- Vær ærlig, men vennlig i tonen. Dette er trening, ikke en dom.
- "focus" skal være tre konkrete ting å prøve neste gang, hver knyttet til et mønster du så i denne samtalen, med tall der det er mulig (f.eks. «Du stilte 1 behovsspørsmål før du presenterte. Sikt på minst 3.»).
${isRun ? '- Dette er «Tusen nei»: vurder motstandskraft og læring mer enn salgsresultat. Legg vekt på hvordan selgeren kom tilbake etter hvert nei, om de spurte hvorfor kunden sa nei, om de var respektfullt vedholdende uten å presse, og om energien holdt seg gjennom rekken. "closingNote" skal være en varm, kort oppmuntring i stil med «Du samlet 8 nei og 1 kanskje. Det er 9 samtaler du ikke hadde i går.»' : '- "closingNote" er en kort, varm setning til slutt.'}

MOMENTUM
"momentum" er kundens kjøpsinteresse (0–100) etter hver selgermelding. Første punkt er interessen rett før selgerens første replikk. Bruk indeksen til selgermeldingen. Kurven skal vise tydelige fall ved mistake/blunder og hopp ved great/brilliant.

TÅLMODIGHET
"patienceEvents" lister de viktigste endringene i kundens tålmodighet: indeks for selgermeldingen, delta (negativt eller positivt) og en kort årsak.

FASER
Gi 0–100 og en kort dom for: opening, need, objections, rapport, relevance, closing. Hvis en fase aldri ble berørt, gi en lav score og si det.

NØKKELØYEBLIKK
3–5 av de største svingningene, minst ett der selgeren gjorde noe bra. "from" og "to" er interessen før og etter.

ACCURACY
0–100: gjennomsnittlig kvalitet på selgerens trekk, vektet etter hvor mye de betydde. En samtale med mange book/good og få feil ligger rundt 55–70. Legg på for great/brilliant, trekk fra for mistake/blunder/miss.`;
}

/** Normalises a raw model answer into a usable evaluation. */
export function normaliseEvaluation(
  raw: Partial<Evaluation>,
  messages: { role: string }[]
): Evaluation {
  const clamp = (value: unknown, fallback = 0) => {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, Math.round(number)));
  };

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const phaseKeys: PhaseKey[] = [
    "opening",
    "need",
    "objections",
    "rapport",
    "relevance",
    "closing",
  ];

  const userIndices = messages
    .map((message, index) => (message.role === "user" ? index : -1))
    .filter(index => index >= 0);
  const used = new Set<number>();

  /** The nearest salesperson message at or before `index`. */
  const snap = (index: number) => {
    const before = userIndices.filter(candidate => candidate <= index);
    return before.length > 0 ? before[before.length - 1] : (userIndices[0] ?? 0);
  };

  /** Assigns each reviewed move its own salesperson message, even if the model repeats itself. */
  const allocate = (index: number) => {
    if (userIndices.length === 0) return 0;
    if (userIndices.includes(index) && !used.has(index)) {
      used.add(index);
      return index;
    }
    const after = userIndices.find(candidate => candidate >= index && !used.has(candidate));
    if (after !== undefined) {
      used.add(after);
      return after;
    }
    const any = userIndices.find(candidate => !used.has(candidate));
    if (any !== undefined) {
      used.add(any);
      return any;
    }
    return snap(index);
  };

  const moves = (raw.moves ?? [])
    .filter(move => Number.isFinite(move?.index))
    .map(move => ({
      index: allocate(move.index),
      label: move.label,
      why: move.why ?? "",
    }))
    .sort((a, b) => a.index - b.index);

  const tally: Partial<Record<MoveLabel, number>> = {};
  moves.forEach(move => {
    tally[move.label] = (tally[move.label] ?? 0) + 1;
  });

  const momentumMap = new Map<number, number>();
  (raw.momentum ?? [])
    .filter(point => Number.isFinite(point?.index))
    .forEach(point => momentumMap.set(snap(point.index), clamp(point.value)));

  return {
    accuracy: clamp(raw.accuracy, 50),
    outcome: (raw.outcome ?? "open") as Evaluation["outcome"],
    summary: raw.summary ?? "",
    tally,
    momentum: [...momentumMap.entries()]
      .map(([index, value]) => ({ index, value }))
      .sort((a, b) => a.index - b.index),
    phases: phaseKeys.map(key => {
      const found = phases.find(phase => phase?.key === key);
      return {
        key,
        score: clamp(found?.score, 0),
        verdict: found?.verdict ?? "Ikke vurdert",
      };
    }),
    moves,
    keyMoments: (raw.keyMoments ?? [])
      .filter(moment => Number.isFinite(moment?.index))
      .map(moment => ({
        index: allocate(moment.index),
        label: moment.label,
        from: clamp(moment.from),
        to: clamp(moment.to),
        why: moment.why ?? "",
        better: moment.better ?? "",
        betterWhy: moment.betterWhy ?? "",
      }))
      .slice(0, 5),
    focus: (raw.focus ?? []).slice(0, 3),
    closingNote: raw.closingNote ?? "",
    patienceEvents: (raw.patienceEvents ?? [])
      .filter(event => Number.isFinite(event?.index))
      .map(event => ({
        index: allocate(event.index),
        delta: Math.round(Number(event.delta) || 0),
        reason: event.reason ?? "",
      }))
      .slice(0, 8),
  };
}
