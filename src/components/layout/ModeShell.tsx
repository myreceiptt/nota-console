import { useEffect, useRef, useState } from "react";
import TerminalContainer from "../terminal/TerminalContainer";
import MockChat from "../ai/MockChat";
import FoundationSandbox from "../ai/FoundationSandbox";
import PrivatePilotAccess from "../ai/PrivatePilotAccess";

// Build-time Preview-only opt-in; Production defaults to the original three modes.
const pilotVisible = import.meta.env.VITE_P51R_PREVIEW_UI === "true";

type Mode = "console" | "ai" | "foundation" | "pilot";

export default function ModeShell() {
  const [mode, setMode] = useState<Mode>(() => pilotVisible && /(?:^#|&)access_token=/.test(window.location.hash) ? "pilot" : "console");
  const consoleFocusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "console") consoleFocusRef.current?.focus();
  }, [mode]);

  return (
    <div className="relative h-full w-full" data-testid="impromptu-mode-shell">
      <nav
        className="absolute bottom-full left-0 z-10 mb-2 flex items-center gap-2"
        role="group"
        aria-label="IMPROMPTU interface mode"
      >
        <button
          type="button"
          data-testid="mode-console"
          aria-pressed={mode === "console"}
          onClick={() => setMode("console")}
          className={`rounded-md border px-3 py-1.5 font-nota text-xs font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-nota-cyan ${
            mode === "console"
              ? "border-nota-cyan bg-nota-black text-nota-cyan"
              : "border-nota-border bg-nota-black/[.75] text-nota-white hover:border-nota-cyan"
          }`}
        >
          {pilotVisible ? "CONOTA" : "CONSOLE"}
        </button>
        {!pilotVisible && <button
          type="button"
          data-testid="mode-ai"
          aria-pressed={mode === "ai"}
          onClick={() => setMode("ai")}
          className={`rounded-md border px-3 py-1.5 font-nota text-xs font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-nota-cyan ${
            mode === "ai"
              ? "border-nota-yellow bg-nota-black text-nota-yellow"
              : "border-nota-border bg-nota-black/[.75] text-nota-white hover:border-nota-yellow"
          }`}
        >
          AI CHAT <span className="text-[.65rem] opacity-80">MOCK</span>
        </button>}
        {!pilotVisible && <button
          type="button"
          data-testid="mode-foundation"
          aria-pressed={mode === "foundation"}
          onClick={() => setMode("foundation")}
          className={mode === "foundation"
            ? "rounded-md border border-nota-yellow bg-nota-black px-3 py-1.5 font-nota text-xs font-bold text-nota-yellow"
            : "rounded-md border border-nota-border bg-nota-black/[.75] px-3 py-1.5 font-nota text-xs font-bold text-nota-white hover:border-nota-yellow"}
        >
          FOUNDATION <span className="text-[.65rem] opacity-80">SANDBOX</span>
        </button>}
        {pilotVisible && <button
          type="button"
          data-testid="mode-pilot"
          aria-pressed={mode === "pilot"}
          onClick={() => setMode("pilot")}
          className={mode === "pilot"
            ? "rounded-md border border-nota-cyan bg-nota-black px-3 py-1.5 font-nota text-xs font-bold text-nota-cyan"
            : "rounded-md border border-nota-border bg-nota-black/[.75] px-3 py-1.5 font-nota text-xs font-bold text-nota-white hover:border-nota-cyan"}
        >NOTAGENT</button>}
      </nav>

      <div
        ref={consoleFocusRef}
        tabIndex={-1}
        className={mode === "console" ? "h-full w-full outline-none" : "hidden"}
        aria-hidden={mode !== "console"}
        data-testid="console-mode-panel"
      >
        <TerminalContainer active={mode === "console"} />
      </div>
      <div
        className={mode === "ai" ? "h-full w-full" : "hidden"}
        aria-hidden={mode !== "ai"}
        data-testid="ai-mode-panel"
      >
        <MockChat active={mode === "ai"} />
      </div>
      <div
        className={mode === "foundation" ? "h-full w-full" : "hidden"}
        aria-hidden={mode !== "foundation"}
        data-testid="foundation-mode-panel"
      >
        <FoundationSandbox active={mode === "foundation"} />
      </div>
      {pilotVisible && <div
        className={mode === "pilot" ? "h-full w-full" : "hidden"}
        aria-hidden={mode !== "pilot"}
        data-testid="pilot-mode-panel"
      >
        <PrivatePilotAccess active={mode === "pilot"} />
      </div>}
    </div>
  );
}
