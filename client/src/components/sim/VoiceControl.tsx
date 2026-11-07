import { useState } from "react";
import { KeyRound, Volume2, VolumeX } from "lucide-react";
import { useVoice } from "@/lib/voice";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

export function VoiceControl() {
  const voice = useVoice();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const label = voice.muted ? "Stemme av" : "Stemme på";

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={voice.toggleMuted}
          aria-pressed={!voice.muted}
          className={`pill inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition ${
            voice.muted
              ? "border-line bg-white text-ink-mute hover:text-ink"
              : "border-transparent bg-brand-soft text-[#a85300]"
          }`}
          title={
            voice.muted
              ? "Slå på kundens stemme"
              : voice.source === "elevenlabs"
                ? "Kunden snakker via ElevenLabs"
                : "Kunden snakker med nettleserens stemme"
          }
        >
          {voice.muted ? (
            <VolumeX className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <Volume2 className={`h-4 w-4 ${voice.speaking ? "animate-pulse" : ""}`} strokeWidth={2.2} />
          )}
          <span className="hidden sm:inline">{label}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setDraft(voice.savedKey);
            setOpen(true);
          }}
          className="rounded-full p-2 text-ink-mute transition hover:bg-black/[0.04] hover:text-ink"
          aria-label="Innstillinger for stemme"
          title="Innstillinger for stemme"
        >
          <KeyRound className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-[460px] gap-0 rounded-[26px] border-line bg-white p-0">
          <div className="px-6 pb-2 pt-6">
            <DialogTitle className="text-[20px] font-extrabold">Stemme</DialogTitle>
            <DialogDescription className="mt-1.5 text-[14px] leading-relaxed text-ink-soft/80">
              Kunden leses opp med ElevenLabs. Legg inn en API-nøkkel for å bruke den stemmen du
              selv har valgt i ElevenLabs-kontoen din.
            </DialogDescription>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div
              className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                voice.configured ? "bg-sage text-[#1f6b46]" : "bg-page text-ink-soft/80"
              }`}
            >
              {voice.configured
                ? "ElevenLabs er aktiv. Nøkkelen lagres bare i denne nettleseren."
                : "Ingen nøkkel er satt. Uten nøkkel bruker appen nettleserens norske stemme."}
            </div>

            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                ElevenLabs API-nøkkel
              </span>
              <input
                type="password"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                placeholder="xi-…"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand/60"
              />
            </label>

            {voice.error && (
              <p className="rounded-2xl bg-blush px-4 py-3 text-[13px] text-[#a02f22]">
                {voice.error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
            {voice.savedKey && (
              <button
                type="button"
                className="pill-ghost mr-auto"
                onClick={() => {
                  voice.saveKey("");
                  setDraft("");
                }}
              >
                Fjern nøkkel
              </button>
            )}
            <button type="button" className="pill-outline" onClick={() => setOpen(false)}>
              Lukk
            </button>
            <button
              type="button"
              className="pill-primary"
              onClick={() => {
                voice.saveKey(draft);
                setOpen(false);
              }}
            >
              Lagre
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
