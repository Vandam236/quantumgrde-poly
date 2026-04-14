import Anthropic from "@anthropic-ai/sdk";

/**
 * Lazy singleton — instantiating the SDK doesn't hit the network, but it
 * does read env. We hold a module-level instance so route handlers don't
 * re-create one per request.
 */
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new MissingAnthropicKeyError();
  }
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export class MissingAnthropicKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI research briefs.",
    );
    this.name = "MissingAnthropicKeyError";
  }
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Default model for research briefs — capable but cheaper than Opus. */
export const RESEARCH_MODEL = "claude-sonnet-4-6";
