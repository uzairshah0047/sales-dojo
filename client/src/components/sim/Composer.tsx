import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function Composer({ onSend, disabled, placeholder }: ComposerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 132)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-line bg-white px-3 py-3 sm:px-4">
      <div className="flex items-end gap-2 rounded-[22px] border border-line bg-page/60 px-3 py-2 transition focus-within:border-brand/50 focus-within:bg-white">
        <textarea
          ref={inputRef}
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={placeholder ?? "Skriv det du ville sagt …"}
          aria-label="Din replikk"
          className="max-h-[132px] min-h-[38px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-snug outline-none placeholder:text-ink-mute/70 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send replikk"
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mute"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>
      <p className="mt-1.5 hidden px-2 text-[11.5px] text-ink-mute sm:block">
        Enter sender · Shift + Enter gir ny linje
      </p>
    </div>
  );
}

interface EndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  hasMessages: boolean;
}

export function EndDialog({ open, onOpenChange, onConfirm, hasMessages }: EndDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-[420px] gap-0 rounded-[26px] border-line bg-white p-0">
        <div className="px-6 pb-2 pt-6">
          <DialogTitle className="text-[21px] font-extrabold leading-tight">
            Avslutte samtalen?
          </DialogTitle>
          <DialogDescription className="mt-2 text-[14.5px] leading-relaxed text-ink-soft/80">
            {hasMessages
              ? "Du får gjennomgangen av hvert trekk med en gang. Transkriptet blir med videre."
              : "Du har ikke sagt noe ennå, så det blir ingen gjennomgang."}
          </DialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end">
          <button type="button" className="pill-outline" onClick={() => onOpenChange(false)}>
            Fortsett
          </button>
          <button type="button" className="pill-primary" onClick={onConfirm}>
            Avslutt og få tilbakemelding
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
