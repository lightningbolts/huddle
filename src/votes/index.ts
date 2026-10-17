import type { Member, Option } from "../types";

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, first: 1, second: 2, third: 3 };

/** Turns a reply into an option id: "2", "#2", "option two", "👍 3", or a distinctive title word. */
export function parseVote(text: string, options: Option[]): string | undefined {
  const t = text.toLowerCase().trim();
  const digit = t.match(/(?:^|[^\d$.])([1-9])(?![\d.])/);
  const n = digit ? Number(digit[1]) : Object.entries(WORD_NUMBERS).find(([w]) => new RegExp(`\\b${w}\\b`).test(t))?.[1];
  if (n && n <= options.length) return options[n - 1].id;

  const hits = options.filter((o) =>
    o.title
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.length > 3 && t.includes(w)),
  );
  return hits.length === 1 ? hits[0].id : undefined;
}

export function tally(members: Member[], options: Option[]): Map<string, number> {
  const counts = new Map(options.map((o) => [o.id, 0]));
  for (const m of members) if (m.vote && counts.has(m.vote)) counts.set(m.vote, counts.get(m.vote)! + 1);
  return counts;
}

export function allVoted(members: Member[]): boolean {
  return members.length > 0 && members.every((m) => m.vote);
}

/** Most votes wins; ties go to the cheaper option, then to the higher-ranked one. */
export function winner(members: Member[], options: Option[]): Option {
  const counts = tally(members, options);
  return [...options].sort((a, b) => {
    const diff = counts.get(b.id)! - counts.get(a.id)!;
    if (diff) return diff;
    if (a.price !== b.price) return a.price - b.price;
    return options.indexOf(a) - options.indexOf(b);
  })[0];
}
