import { useEffect, useState } from "react";
import type { AvatarConfig, TranscriptMessage } from "@shared/sellio";
import { Avatar } from "../Avatar";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function TypedText({ text, animate }: { text: string; animate: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(animate && !reduced ? 0 : text.length);

  useEffect(() => {
    if (!animate || reduced) {
      setVisible(text.length);
      return;
    }
    setVisible(0);
    const step = Math.max(11, Math.round(760 / Math.max(text.length, 1)));
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(index);
      if (index >= text.length) window.clearInterval(timer);
    }, step);
    return () => window.clearInterval(timer);
  }, [text, animate, reduced]);

  if (visible >= text.length) return <>{text}</>;

  return (
    <span className="typewriter-caret" onClick={() => setVisible(text.length)}>
      {text.slice(0, visible)}
    </span>
  );
}

interface ChatBubbleProps {
  message: TranscriptMessage;
  avatar: AvatarConfig;
  animate?: boolean;
  showSpeakerName?: boolean;
}

export function ChatBubble({
  message,
  avatar,
  animate = false,
  showSpeakerName = false,
}: ChatBubbleProps) {
  if (message.role === "system") {
    return (
      <div className="my-4 flex items-center gap-3" role="separator" aria-label={message.text}>
        <span className="h-px flex-1 bg-line" />
        <span className="rounded-full bg-page px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
          {message.text}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex w-full gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar config={avatar} className="mt-auto h-8 w-8" />}

      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && showSpeakerName && message.speakerName && (
          <span className="mb-1 pl-1 text-[11.5px] font-semibold text-ink-mute">
            {message.speakerName}
          </span>
        )}
        <div
          className={`animate-pop-in px-4 py-2.5 text-[15px] leading-[1.55] ${
            isUser
              ? "rounded-[20px] rounded-tr-md bg-ink text-white"
              : "rounded-[20px] rounded-tl-md border border-line bg-white text-ink-soft"
          }`}
        >
          <TypedText text={message.text} animate={animate} />
        </div>
      </div>
    </div>
  );
}

export function TypingBubble({ avatar, name }: { avatar: AvatarConfig; name?: string }) {
  return (
    <div className="flex w-full gap-2.5">
      <Avatar config={avatar} className="mt-auto h-8 w-8" />
      <div className="flex flex-col items-start">
        {name && <span className="mb-1 pl-1 text-[11.5px] font-semibold text-ink-mute">{name}</span>}
        <div
          className="flex items-center gap-1.5 rounded-[20px] rounded-tl-md border border-line bg-white px-4 py-3.5"
          role="status"
          aria-label="Kunden skriver"
        >
          <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-ink/25" />
        </div>
      </div>
    </div>
  );
}
