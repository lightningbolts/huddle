import type { IncomingMessage } from "../types";

/** The only boundary that knows about a chat platform. Swap implementations, nothing else changes. */
export interface ChatAdapter {
  start(onMessage: (msg: IncomingMessage) => Promise<void>): Promise<void>;
  send(threadId: string, text: string): Promise<void>;
  stop?(): Promise<void>;
}

export { SpectrumAdapter } from "./spectrum";
