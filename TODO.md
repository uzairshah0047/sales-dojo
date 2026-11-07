# TODO – Sales Dojo MVP (user flow)

## 1. Design system and shared shell
- [x] Design tokens: accent #ff7300, text #000000 / #2d2c2b / #141313, page #fafafa, surface #ffffff, dark #141313.
- [x] Friendly rounded sans (DM Sans via Google Fonts), weights 300–800, hero 76px → 44px on mobile.
- [x] Pill buttons (primary solid orange, secondary outlined), 20–24px card radius, soft shadows, 8px spacing grid.
- [x] Slim shared top bar: wordmark left, "Ny økt" right; visible focus states on every interactive element.
- [x] Friendly flat blob-character avatars rendered as SVG for each customer.

## 2. Scenario library (single JSON data file)
- [x] 6 placeholder telecom scenarios: new mobile subscription (student, Grønn), switching provider (parent, Gul), plan upgrade (existing customer, Gul), home fibre (couple, Gul), business package (owner loyal to competitor, Rød), retention call (frustrated customer, Rød).
- [x] Flagship scenario "Tusen nei": run of short cold calls, most customers say no in different ways, 10 calls target, browser-persisted visible counter "Nei samlet: 0 / 1000".
- [x] Tusen nei has a detailed identity-independent behavioral profile: the customer protects time and control, reacts causally to listening, pressure, honesty and boundary violations, escalates through clear stages, reveals needs in small pieces, and uses varied refusal styles while staying consistent. Name and age are randomly generated for each contact.
- [x] Each scenario carries persona, situation, difficulty, goal line, background, products, call goal, hidden needs, objections, buying conditions, patience start and success condition.

## 3. Home
- [x] Headline, one-sentence explanation and single primary button "Start å øve".
- [x] Three-step strip: velg kunde → ha samtalen → få tilbakemelding.

## 4. Scenario picker + briefing
- [x] Responsive card grid (1 column mobile, 2–3 desktop) with avatar, name, situation, difficulty tag and goal line; Tusen nei shown as a wide flagship banner.
- [x] Clicking a card opens a briefing panel with customer background, products, call goal and "Begynn samtalen".

## 5. Simulation (the live conversation)
- [x] Chat view with customer identity at top, "Avslutt og få tilbakemelding" always visible, collapsible scenario reminder.
- [x] Text input, Enter to send, typing indicator, customer opens the conversation.
- [x] In-character AI customer: short natural Norwegian, hidden needs not volunteered, never coaches or breaks character.
- [x] Dynamic ending driven by hidden patience and the scenario success condition (no timer, no turn limit); outcomes: buy, decline, undecided.
- [x] Early-end confirmation dialog.
- [x] "Tusen nei" run: call counter, next customer, no-counter increments, gentle transition between calls.
- [x] ElevenLabs text-to-speech for customer replies with mute/unmute, graceful text-only operation without a key.
- [x] Error state with inline retry that keeps the transcript.

## 6. Evaluation (sales review)
- [x] Loading state "Analyserer samtalen …" then large 0–100 score, outcome and revealed patience.
- [x] Move classification tally (Strålende → Blunder) with one-line explanation per user message.
- [x] Interactive deal-momentum graph (0–100) whose points jump to the transcript exchange.
- [x] Phase scores: Opening, Uncovering the need, Handling objections, Communication and rapport, Product relevance, Closing; weakest phase highlighted as training focus.
- [x] 3–5 key moments with classification, momentum change, why it landed that way and a concrete better line, plus "Prøv fra her".
- [x] "Neste økt" with three specific things to try; collapsible annotated transcript.
- [x] "Tusen nei" evaluation: bounce-back, curiosity about the no, respectful persistence, energy over time and a warm closing note.
- [x] Actions: Try again, Another scenario, Home.

## 7. State, routing and delivery
- [x] Four-screen routing with one conversation object and briefing / active / ending / evaluated states; survives refresh.
- [x] Two backend endpoints for chat and evaluation; retry from a key moment restores the customer's mood.
- [x] `manus-routes.json`, logo metadata, checkpoint and publish.
