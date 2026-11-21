import { useEffect, useRef, useState } from "react";
import TerminalContainer from "../terminal/TerminalContainer";
import MockChat from "../ai/MockChat";

type Mode = "console" | "ai";

export default function ModeShell() {
  const [mode, setMode] = useState<Mode>("console");
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
          CONSOLE
        </button>
        <button
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
        </button>
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
    </div>
  );
}
