import type { Thread } from "../types";

/** Per-thread state. Swap MemoryStore for a MongoDB-backed one without touching callers. */
export interface Store {
  get(threadId: string): Promise<Thread | undefined>;
  save(thread: Thread): Promise<void>;
  delete(threadId: string): Promise<void>;
}

export class MemoryStore implements Store {
  private threads = new Map<string, Thread>();

  async get(threadId: string) {
    const t = this.threads.get(threadId);
    return t ? structuredClone(t) : undefined;
  }

  async save(thread: Thread) {
    this.threads.set(thread.id, structuredClone(thread));
  }

  async delete(threadId: string) {
    this.threads.delete(threadId);
  }
}

export function newThread(id: string): Thread {
  return {
    id,
    stage: "idle",
    members: [],
    options: [],
    excludedItemIds: [],
    createdAt: Date.now(),
  };
}
