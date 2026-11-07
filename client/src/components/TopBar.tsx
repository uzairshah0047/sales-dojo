import { Link, useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Wordmark } from "./Brand";
import { useConversation } from "@/state/ConversationContext";

export function TopBar() {
  const { totalNos, reset } = useConversation();
  const [location, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-page/85 backdrop-blur-xl">
      <div className="shell flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Sellio – til forsiden"
          className="rounded-full focus-visible:outline-offset-4"
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {totalNos > 0 && (
            <span
              className="hidden items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink-soft sm:inline-flex"
              title="Nei du har samlet i Tusen nei"
            >
              <span className="h-2 w-2 rounded-full bg-brand" />
              Nei samlet: <strong className="font-bold">{totalNos}</strong>
              <span className="text-ink-mute">/ 1000</span>
            </span>
          )}

          <button
            type="button"
            className="pill-outline !px-4 !py-2.5 text-[15px] sm:!px-5"
            onClick={() => {
              reset();
              if (location !== "/scenarier") navigate("/scenarier");
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Ny økt
          </button>
        </div>
      </div>
    </header>
  );
}
