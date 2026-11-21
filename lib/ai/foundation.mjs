// P5.1 foundation sandbox: immutable public identity and non-LLM adapter.
// This file contains no provider credentials or user-supplied executable instructions.
export const persona = Object.freeze({
  version: "nota-foundation-draft-v0.1",
  displayName: "AI Prof. NOTA — Foundation Sandbox",
  publicContext: Object.freeze([
    "IMPROMPTU is Prof. NOTA's public console interface.",
    "Its public welcome encourages playing, learning, and working.",
    "The console provides curated links and command-driven navigation."
  ]),
  boundaries: Object.freeze([
    "Do not pretend to be a human or claim unverified personal knowledge.",
    "Do not claim blockchain access, verified wallet status, tool execution, or live research.",
    "Use only reviewed public NOTA knowledge in future provider-connected modes."
  ])
});

function scriptedResponse(message) {
  const text = message.toLowerCase();
  if (/(nota|prof|siapa|who)/.test(text)) {
    return "OiOi! This is the AI Prof. NOTA foundation sandbox. IMPROMPTU is a public console for playing, learning, and working. The identity and approved public knowledge are separate from any future language-model provider. This is a scripted server response, not AI.";
  }
  if (/(nft|web3|blockchain)/.test(text)) {
    return "The future AI Prof. NOTA can explore practical Web3 subjects with approved sources. This server sandbox cannot verify blockchain activity, inspect wallets, execute transactions, or conduct live research.";
  }
  return "OiOi! The backend received your message and is streaming a deterministic scripted response. There is no connected language model, external provider, account, memory service, or paid API. We are testing the foundation safely before choosing an AI model.";
}

export function createFoundationProvider(kind = "scripted-preview") {
  // Fail closed: no environment variable or request value can select a real model.
  if (kind !== "scripted-preview") {
    throw new Error("External AI providers are not configured or authorized");
  }
  return Object.freeze({
    kind,
    async *streamText(message, { signal } = {}) {
      const response = scriptedResponse(message);
      for (let offset = 0; offset < response.length; offset += 48) {
        if (signal?.aborted) return;
        yield response.slice(offset, offset + 48);
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
    }
  });
}
