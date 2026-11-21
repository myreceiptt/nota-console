import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface Message {
  id: number;
  role: "visitor" | "nota";
  text: string;
}

interface MockChatProps {
  active: boolean;
}

const initialMessage: Message = {
  id: 0,
  role: "nota",
  text: "OiOi! Welcome to the 0101 Universe. This is a local, scripted preview of AI Prof. NOTA. What would you like to explore?",
};

function mockReply(message: string): string {
  const question = message.toLowerCase();

  if (question.includes("prof") || question.includes("nota") || question.includes("siapa")) {
    return "OiOi! This demonstration introduces Prof. NOTA as a creative identity exploring playing, learning, working, and the 0101 Universe. A real AI would need approved sources before making factual claims about Prof. NOTA.";
  }

  if (question.includes("web3") || question.includes("blockchain") || question.includes("nft")) {
    return "In a future AI mode, we could explore practical Web3 ideas together and point to approved Prof. NOTA projects. For now, this is only a scripted reply: no blockchain access, transactions, or live research.";
  }

  if (question.includes("help") || question.includes("bantu") || question.includes("command")) {
    return "Try Console Mode for the original !prof!, !links!, and other commands. This mock chat demonstrates conversational input and safe output without using an AI model.";
  }

  return "OiOi! Your message was received by this local UI demonstration. A future AI Prof. NOTA could respond with a contextual conversation here. No AI model, server chat endpoint, or knowledge service is connected in this preview.";
}

export default function MockChat({ active }: MockChatProps) {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [draft, setDraft] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    if (active) {
      const element = messagesRef.current;
      element?.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  }, [messages, active]);

  function sendMessage() {
    const message = draft.trim();
    if (!message) return;

    const visitor: Message = { id: nextId.current++, role: "visitor", text: message };
    const reply: Message = { id: nextId.current++, role: "nota", text: mockReply(message) };
    setMessages((previous) => [...previous.slice(-23), visitor, reply]);
    setLastQuestion(message);
    setDraft("");
    inputRef.current?.focus();
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  }

  function retryLast() {
    if (!lastQuestion) return;
    const reply: Message = { id: nextId.current++, role: "nota", text: mockReply(lastQuestion) };
    setMessages((previous) => [...previous.slice(-24), reply]);
  }

  function clearChat() {
    setMessages([initialMessage]);
    setLastQuestion("");
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-solid border-nota-border bg-nota-gray-dark/[.96] font-nota text-sm text-nota-white shadow-terminal"
      data-testid="mock-chat-panel"
      aria-label="AI Prof. NOTA mock chat"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/[.4] bg-nota-black/[.70] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-nota-cyan">✦</span>
          <span className="font-semibold text-nota-white">impromptu: ai@nota: ~</span>
        </div>
        <span className="rounded border border-nota-yellow/[.45] px-2 py-0.5 text-xs font-bold tracking-wide text-nota-yellow">
          MOCK ONLY
        </span>
      </header>

      <div ref={messagesRef} className="terminal-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        <p className="text-xs text-nota-cyan">==== AI Prof. NOTA · 0101 Universe (simulation) ====</p>
        {messages.map((message) => (
          <div key={message.id} className="space-y-1" data-testid={message.role === "visitor" ? "mock-message-visitor" : "mock-message-nota"}>
            <p className={message.role === "visitor" ? "font-bold text-nota-yellow" : "font-bold text-nota-cyan"}>
              {message.role === "visitor" ? "visitor@nota ~ #" : "ai@nota ~ #"}
            </p>
            <p className="whitespace-pre-wrap break-words text-nota-white">{message.text}</p>
          </div>
        ))}
      </div>

      <form className="border-t border-nota-border bg-nota-black/[.35] p-3" onSubmit={submitMessage}>
        <label htmlFor="mock-chat-input" className="mb-2 block text-xs font-bold text-nota-cyan">
          Your message
        </label>
        <textarea
          ref={inputRef}
          id="mock-chat-input"
          data-testid="mock-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleInputKeyDown}
          maxLength={1000}
          rows={2}
          placeholder="Ask a question, or explore the idea of AI Prof. NOTA..."
          className="w-full resize-none rounded border border-nota-border bg-nota-gray-dark px-3 py-2 text-nota-white outline-none placeholder:text-nota-gray focus:border-nota-cyan"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-nota-gray">Local scripted responses · No AI calls · No chat storage</span>
          <div className="flex items-center gap-2">
            <button type="button" data-testid="mock-clear" onClick={clearChat} className="rounded border border-nota-border px-3 py-1.5 text-nota-white hover:border-nota-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-nota-cyan">
              Clear
            </button>
            <button type="button" data-testid="mock-retry" onClick={retryLast} disabled={!lastQuestion} className="rounded border border-nota-border px-3 py-1.5 text-nota-white hover:border-nota-cyan disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-nota-cyan">
              Retry
            </button>
            <button type="submit" data-testid="mock-send" disabled={!draft.trim()} className="rounded bg-nota-cyan px-3 py-1.5 font-bold text-nota-black hover:bg-nota-yellow disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-nota-cyan">
              Send
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-nota-gray">Enter to send · Shift+Enter for a new line. This Preview does not use a language model.</p>
      </form>
    </section>
  );
}
