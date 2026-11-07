import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BlobMark } from "@/components/Brand";
import { MoveBadge } from "@/components/Badges";
import { getScenario, scenarios } from "@shared/sellio";

const STEPS = [
  {
    number: "01",
    title: "Velg en kunde",
    body: "Sju kunder med hver sin situasjon, sine innvendinger og sin tålmodighet. Du får en kort brief før du ringer.",
    tint: "bg-sage",
  },
  {
    number: "02",
    title: "Ta samtalen",
    body: "Kunden snakker norsk, svarer kort og gir seg ikke gratis. Du skriver, kunden svarer – som på telefon.",
    tint: "bg-peach",
  },
  {
    number: "03",
    title: "Få gjennomgangen",
    body: "Hvert trekk får en merkelapp, en forklaring og et konkret bedre alternativ. Så prøver du igjen.",
    tint: "bg-lilac",
  },
];

function HeroChat() {
  const morten = getScenario("bytte-leverandor");

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div
        className="blob-bg left-[-18%] top-[6%] h-64 w-64"
        style={{ background: "#ffd7b8" }}
        aria-hidden="true"
      />
      <div
        className="blob-bg bottom-[-6%] right-[-12%] h-56 w-56"
        style={{ background: "#dcefe2" }}
        aria-hidden="true"
      />

      <div className="card-soft relative z-10 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          {morten && <Avatar config={morten.avatar} className="h-10 w-10" ring />}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">Morten Berg, 41</p>
            <p className="truncate text-[12.5px] text-ink-mute">Familieabonnement · Gul</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-[#1f6b46]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2f9e6f]" />
            på linja
          </span>
        </div>

        <div className="space-y-3 px-5 py-5">
          <div className="max-w-[85%] rounded-[20px] rounded-tl-md border border-line bg-white px-4 py-3 text-[14.5px] leading-relaxed text-ink-soft">
            Ja, hei. Jeg har fem minutter. Hva er dette?
          </div>
          <div className="ml-auto max-w-[85%] rounded-[20px] rounded-tr-md bg-ink px-4 py-3 text-[14.5px] leading-relaxed text-white">
            Jeg ser dere har fire abonnementer i dag. Hvordan bruker barna mobilen, egentlig?
          </div>
          <div className="max-w-[85%] rounded-[20px] rounded-tl-md border border-line bg-white px-4 py-3 text-[14.5px] leading-relaxed text-ink-soft">
            Den yngste bruker vel mye … har ikke helt oversikten.
          </div>
          <div className="flex items-center gap-1.5 pl-2 pt-1" aria-label="Kunden skriver">
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25" />
          </div>
        </div>
      </div>

      <div className="card-soft animate-float-slow absolute -bottom-12 -right-10 z-20 hidden w-[208px] p-4 sm:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
          Trekk 3
        </p>
        <div className="mt-2 flex items-center gap-2">
          <MoveBadge label="mistake" />
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">
          Generisk pitch der kunden ba om tall.
        </p>
      </div>

    </div>
  );
}

function MomentumPreview() {
  return (
    <svg viewBox="0 0 320 130" className="h-auto w-full" role="img" aria-label="Kjøpsinteresse over tid">
      <defs>
        <linearGradient id="homeFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7300" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff7300" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[26, 62, 98].map(y => (
        <line key={y} x1="8" y1={y} x2="312" y2={y} stroke="#ece8e3" strokeWidth="1" />
      ))}
      <path
        d="M12 96 L62 84 L112 88 L162 54 L212 66 L262 34 L308 44 L308 118 L12 118 Z"
        fill="url(#homeFill)"
      />
      <path
        d="M12 96 L62 84 L112 88 L162 54 L212 66 L262 34 L308 44"
        fill="none"
        stroke="#ff7300"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [12, 96],
        [62, 84],
        [112, 88],
        [162, 54],
        [212, 66],
        [262, 34],
        [308, 44],
      ].map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={index === 5 ? 5.5 : 4}
          fill={index === 5 ? "#141313" : "#ffffff"}
          stroke={index === 5 ? "#141313" : "#ff7300"}
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div
          className="blob-bg left-[-10%] top-[-6%] h-[420px] w-[420px]"
          style={{ background: "#ffe8d6" }}
          aria-hidden="true"
        />
        <div
          className="blob-bg right-[-8%] top-[22%] h-[360px] w-[360px]"
          style={{ background: "#ece5ff" }}
          aria-hidden="true"
        />

        <div className="shell relative z-10 grid items-center gap-14 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={2.4} />
              AI-salgsøving for telekom
            </span>

            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[58px] lg:text-[76px]">
              Øv deg på{" "}
              <span className="relative inline-block">
                samtalen
                <svg
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-brand/45"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8c40-6 90-8 196-3"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>{" "}
              før kunden ringer.
            </h1>

            <p className="mt-7 max-w-[36ch] text-[18px] leading-[1.65] text-ink-soft/85 sm:text-[19px]">
              Realistiske AI-kunder med egne behov, innvendinger og tålmodighet. Ta samtalen, få en
              ærlig gjennomgang av hvert trekk – og prøv igjen.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/scenarier" className="pill-primary group">
                Start å øve
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#slik" className="pill-outline">
                Slik fungerer det
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-mute">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                {scenarios.length} kunder i biblioteket
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
                Ingen innlogging
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
                Norsk tale og tekst
              </span>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            <HeroChat />
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section id="slik" className="scroll-mt-24 pb-6">
        <div className="shell">
          <div className="flex flex-col gap-3 border-t border-line pt-12 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[18ch] text-[30px] font-bold leading-[1.1] sm:text-[38px]">
              Tre steg. Så er du i gang.
            </h2>
            <p className="max-w-[38ch] text-[15px] leading-relaxed text-ink-mute">
              Ingen oppsett, ingen konto. Du kan begynne å øve innen to klikk fra denne siden.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {STEPS.map(step => (
              <article
                key={step.number}
                className="card-soft card-lift relative overflow-hidden p-6"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${step.tint} text-[15px] font-bold text-ink`}
                >
                  {step.number}
                </div>
                <h3 className="text-[20px] font-bold">{step.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft/80">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Review teaser */}
      <section className="py-16 sm:py-24">
        <div className="shell grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <span className="eyebrow">Salgsgjennomgangen</span>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.06] sm:text-[44px]">
              Vi vurderer hver replikk, ikke samtalen som helhet.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[16.5px] leading-[1.65] text-ink-soft/85">
              Som en sjakkmotor går gjennom et parti: hvert trekk får en merkelapp ut fra
              situasjonen det ble spilt i. Du ser nøyaktig hvor kjøpsinteressen falt, hvilket trekk
              som snudde det, og hva du kunne sagt i stedet.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <MoveBadge label="brilliant" />
              <MoveBadge label="great" />
              <MoveBadge label="good" />
              <MoveBadge label="inaccuracy" />
              <MoveBadge label="miss" />
              <MoveBadge label="blunder" />
            </div>

            <Link
              href="/scenarier"
              className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 transition hover:text-brand"
            >
              Se en ekte gjennomgang
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="card-soft relative overflow-hidden p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                  Kjøpsinteresse
                </p>
                <p className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">
                  41 <span className="text-[15px] font-medium text-ink-mute">/ 100</span>
                </p>
              </div>
              <div className="rounded-2xl bg-page px-3 py-2 text-right">
                <p className="text-[11px] font-medium text-ink-mute">Nøyaktighet</p>
                <p className="text-[20px] font-extrabold text-brand">63</p>
              </div>
            </div>
            <div className="mt-4">
              <MomentumPreview />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Beste trekk", value: "4", tint: "bg-sage" },
                { label: "Feil", value: "1", tint: "bg-butter" },
                { label: "Blunder", value: "1", tint: "bg-blush" },
              ].map(item => (
                <div key={item.label} className={`rounded-2xl ${item.tint} px-3 py-2.5`}>
                  <p className="text-[17px] font-extrabold leading-none">{item.value}</p>
                  <p className="mt-1 text-[11.5px] font-medium text-ink-soft/80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tusen nei */}
      <section className="pb-16 sm:pb-24">
        <div className="shell">
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
            <div
              className="blob-bg left-[2%] top-[-26%] h-64 w-64 opacity-25"
              style={{ background: "#ff7300" }}
              aria-hidden="true"
            />
            <div
              className="blob-bg bottom-[-30%] right-[4%] h-72 w-72 opacity-25"
              style={{ background: "#ece5ff" }}
              aria-hidden="true"
            />

            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Flaggskip
                </span>
                <h2 className="mt-5 text-[34px] font-extrabold leading-[1.02] text-white sm:text-[48px]">
                  Tusen nei.
                  <br />
                  De fleste sier nei. Det er poenget.
                </h2>
                <p className="mt-5 max-w-[44ch] text-[16px] leading-[1.65] text-white/70">
                  Ti korte oppringinger på rad. Høflige nei, sure nei, «send meg en e-post»-nei. Du
                  øver på å holde varmen, spørre hvorfor – og ta neste samtale like åpent.
                </p>
                <Link
                  href="/scenarier"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[16px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  Prøv ringerekka
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative flex justify-center">
                <div className="w-full max-w-[300px] rounded-[26px] border border-white/12 bg-white/[0.06] p-6 text-center backdrop-blur">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    Nei samlet
                  </p>
                  <p className="mt-3 text-[56px] font-extrabold leading-none tracking-[-0.05em] text-white">
                    37
                    <span className="text-[22px] font-medium text-white/40"> / 1000</span>
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[3.7%] rounded-full bg-brand" />
                  </div>
                  <p className="mt-4 text-[13px] leading-relaxed text-white/55">
                    Hvert nei teller som fremgang. Telleren følger deg mellom øktene.
                  </p>
                </div>
                <div className="absolute -right-2 -top-6 hidden h-14 w-14 animate-breathe items-center justify-center rounded-full bg-white sm:flex">
                  <BlobMark className="h-10 w-10" tone="cream" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-20">
        <div className="shell">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[32px] border border-line bg-white px-6 py-10 sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="max-w-[24ch] text-[28px] font-extrabold leading-[1.08] sm:text-[36px]">
                Neste kunde venter allerede.
              </h2>
              <p className="mt-2 text-[15px] text-ink-mute">
                Én økt tar tre minutter. Du kan avslutte når som helst.
              </p>
            </div>
            <Link href="/scenarier" className="pill-primary shrink-0">
              Velg en kunde
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
