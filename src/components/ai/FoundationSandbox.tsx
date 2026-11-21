import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type Message = { id: number; role: "visitor" | "nota"; text: string };
const hello: Message = {
  id: 0, role: "nota",
  text: "OiOi! This is the Preview-only Foundation Sandbox. It streams scripted text from a server endpoint, not from an AI model."
};

export default function FoundationSandbox({ active }: { active: boolean }) {
  const [messages, setMessages] = useState<Message[]>([hello]);
  const [draft, setDraft] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const serial = useRef(1);
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) input.current?.focus();
    else request.current?.abort();
  }, [active]);

  useEffect(() => {
    if (active) transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages, active]);

  async function submit(question: string) {
    const message = question.trim();
    if (!message || busy || request.current || message.length > 1000) return;

    const controller = new AbortController();
    request.current = controller;
    const visitorId = serial.current++;
    const replyId = serial.current++;
    setMessages((old) => [...old.slice(-19), { id: visitorId, role: "visitor", text: message }, { id: replyId, role: "nota", text: "" }]);
    setLastQuestion(message);
    setDraft("");
    setNotice("");
    setBusy(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify({ message }),
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
        throw new Error("foundation_unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let completed = false;
      while (!completed) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value || new Uint8Array(), { stream: !done });
        let divider = pending.indexOf("\n\n");
        while (divider >= 0) {
          const frame = pending.slice(0, divider);
          pending = pending.slice(divider + 2);
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const packet = JSON.parse(line.slice(6)) as { type?: string; text?: string; code?: string };
            if (packet.type === "delta" && typeof packet.text === "string") {
              setMessages((old) => old.map((entry) =>
                entry.id === replyId ? { ...entry, text: entry.text + packet.text } : entry
              ));
            } else if (packet.type === "error") {
              throw new Error("stream_failed");
            } else if (packet.type === "done") {
              completed = true;
            }
          }
          divider = pending.indexOf("\n\n");
        }
        if (done && !completed) throw new Error("stream_incomplete");
      }
    } catch (error) {
      if (controller.signal.aborted) {
        setNotice("Stream stopped. No message was stored.");
      } else {
        setNotice("The Preview backend could not stream a reply. No external AI request was made.");
      }
      setMessages((old) => old.map((entry) => entry.id === replyId && !entry.text
        ? { ...entry, text: "[No completed reply]" } : entry));
    } finally {
      if (request.current === controller) request.current = null;
      setBusy(false);
      input.current?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  }

  function clear() {
    request.current?.abort();
    setMessages([hello]);
    setLastQuestion("");
    setDraft("");
    setNotice("");
  }

  return (
    <section data-testid="foundation-panel" aria-label="AI Foundation streaming sandbox"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-nota-border bg-nota-gray-dark/[.96] font-nota text-sm text-nota-white shadow-terminal">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/[.4] bg-nota-black/[.70] px-4 py-2.5">
        <span className="font-semibold">impromptu: foundation@nota: ~</span>
        <span className="rounded border border-nota-yellow/[.45] px-2 py-0.5 text-xs font-bold text-nota-yellow">SERVER SANDBOX · NO LLM</span>
      </header>
      <div ref={transcript} className="terminal-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        <p className="text-xs font-bold text-nota-cyan">==== P5.1 · Backend streaming test ====</p>
        {messages.map((entry) => (
          <div key={entry.id} data-testid={entry.role === "visitor" ? "foundation-visitor" : "foundation-nota"}>
            <p className={entry.role === "visitor" ? "font-bold text-nota-yellow" : "font-bold text-nota-cyan"}>
              {entry.role === "visitor" ? "visitor@nota ~ #" : "sandbox@nota ~ #"}
            </p>
            <p className="whitespace-pre-wrap break-words text-nota-white">{entry.text || "Streaming..."}</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="border-t border-nota-border bg-nota-black/[.35] p-3">
        <label htmlFor="foundation-input" className="mb-2 block text-xs font-bold text-nota-cyan">Message for sandbox backend</label>
        <textarea id="foundation-input" data-testid="foundation-input" ref={input} rows={2} maxLength={1000}
          value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown}
          placeholder="This exercises server streaming, not a real AI model..."
          className="w-full resize-none rounded border border-nota-border bg-nota-gray-dark px-3 py-2 text-nota-white outline-none placeholder:text-nota-gray focus:border-nota-cyan"/>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-nota-gray">Preview only · Not an LLM · No persistent chat</span>
          <div className="flex items-center gap-2">
            <button type="button" data-testid="foundation-clear" onClick={clear}
              className="rounded border border-nota-border px-3 py-1.5 hover:border-nota-cyan">Clear</button>
            <button type="button" data-testid="foundation-stop" disabled={!busy} onClick={() => request.current?.abort()}
              className="rounded border border-nota-border px-3 py-1.5 disabled:opacity-40">Stop</button>
            <button type="button" data-testid="foundation-retry" disabled={!lastQuestion || busy}
              onClick={() => void submit(lastQuestion)}
              className="rounded border border-nota-border px-3 py-1.5 disabled:opacity-40">Retry</button>
            <button type="submit" data-testid="foundation-send" disabled={!draft.trim() || busy}
              className="rounded bg-nota-cyan px-3 py-1.5 font-bold text-nota-black disabled:opacity-40">Send</button>
          </div>
        </div>
        {notice && <p data-testid="foundation-notice" role="status" className="mt-2 text-xs text-nota-yellow">{notice}</p>}
        <p className="mt-2 text-xs text-nota-gray">Enter to send · Shift+Enter newline · Stream can be stopped.</p>
      </form>
    </section>
  );
}
