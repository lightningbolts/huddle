import type { IncomingMessage } from "../types";
import type { ChatAdapter } from "./index";

/**
 * Photon Spectrum (npm: spectrum-ts, github.com/photon-hq/spectrum-ts).
 *
 * TODO, before writing this for real:
 *  1. `npm i spectrum-ts` and read Photon's docs for the message and group-thread API.
 *  2. Run the group-thread test: can the agent receive every member's message in a
 *     group iMessage thread, see the sender, and reply into the same thread?
 *  3. If group threads fail, load a different Spectrum platform here (Telegram,
 *     Discord) instead of the iMessage provider. Nothing outside adapter/ changes.
 *
 * Map each inbound platform message to IncomingMessage:
 *   threadId     the group chat id
 *   senderId     stable handle for the member (phone / Apple ID)
 *   senderName   contact display name
 *   text         message body; convert tapbacks to text ("👍", or the option number)
 *   participants group members, if Spectrum exposes them
 */
export class SpectrumAdapter implements ChatAdapter {
  async start(_onMessage: (msg: IncomingMessage) => Promise<void>): Promise<void> {
    throw new Error("SpectrumAdapter is not wired up yet. Run `npm run simulate` to exercise the agent without Spectrum.");
  }

  async send(_threadId: string, _text: string): Promise<void> {
    throw new Error("SpectrumAdapter.send is not wired up yet.");
  }
}
