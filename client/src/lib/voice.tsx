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
import { getVoiceConfig, postSpeech } from "./api";

const KEY_STORAGE = "sellio:elevenlabs-key";

export type VoiceSource = "elevenlabs" | "browser" | "none";

interface VoiceContextValue {
  /** ElevenLabs is reachable (project key or a key saved in this browser). */
  configured: boolean;
  source: VoiceSource;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  speaking: boolean;
  error: string | null;
  clearError: () => void;
  savedKey: string;
  saveKey: (key: string) => void;
  speak: (text: string, gender: "female" | "male" | "mixed") => void;
  stop: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

function pickBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(voice => /nb[-_]?no/i.test(voice.lang)) ??
    voices.find(voice => /^no\b|norw/i.test(`${voice.lang} ${voice.name}`)) ??
    null
  );
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [muted, setMuted] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY_STORAGE) ?? "";
    setSavedKey(stored);

    getVoiceConfig()
      .then(config => {
        setConfigured(config.configured);
        setMuted(!(config.configured || stored));
      })
      .catch(() => {
        setConfigured(false);
        setMuted(!stored);
      });

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stop = useCallback(() => {
    requestRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "nb-NO";
      const voice = pickBrowserVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const speak = useCallback(
    (text: string, gender: "female" | "male" | "mixed") => {
      if (!text.trim() || muted) return;

      stop();
      const requestId = requestRef.current;
      const resolvedGender =
        gender === "mixed" ? (Math.random() > 0.5 ? "male" : "female") : gender;

      const useElevenLabs = configured || Boolean(savedKey);
      if (!useElevenLabs) {
        speakWithBrowser(text);
        return;
      }

      setSpeaking(true);
      postSpeech(text, resolvedGender, savedKey || undefined)
        .then(blob => {
          if (requestRef.current !== requestId) return;
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setSpeaking(false);
          audio.onerror = () => setSpeaking(false);
          void audio.play().catch(() => setSpeaking(false));
        })
        .catch((caught: { status?: number }) => {
          if (requestRef.current !== requestId) return;
          setSpeaking(false);
          if (caught?.status === 401) {
            setError("ElevenLabs-nøkkelen ble avvist. Sjekk at den er riktig.");
            return;
          }
          // No key on the server: fall back to the voice the browser already has.
          speakWithBrowser(text);
        });
    },
    [configured, muted, savedKey, speakWithBrowser, stop]
  );

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      window.localStorage.setItem(KEY_STORAGE, trimmed);
      setSavedKey(trimmed);
      setMuted(false);
      setError(null);
    } else {
      window.localStorage.removeItem(KEY_STORAGE);
      setSavedKey("");
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      configured: configured || Boolean(savedKey),
      source: configured || savedKey ? "elevenlabs" : "browser",
      muted,
      setMuted,
      toggleMuted: () => {
        if (muted) {
          setMuted(false);
        } else {
          stop();
          setMuted(true);
        }
      },
      speaking,
      error,
      clearError: () => setError(null),
      savedKey,
      saveKey,
      speak,
      stop,
    }),
    [configured, savedKey, muted, speaking, error, saveKey, speak, stop]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext);
  if (!context) throw new Error("useVoice must be used inside VoiceProvider");
  return context;
}
