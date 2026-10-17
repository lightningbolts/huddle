import type { Option } from "../types";
import { CATALOG, type CatalogItem } from "./data";

export interface Catalog {
  /** Three ranked options within budget, best first. */
  rank(input: RankInput): Option[];
}

export interface RankInput {
  goal: string;
  budget: number; // cents
  preferences: string[];
  exclude?: string[]; // item ids
  count?: number;
}

const STOPWORDS = new Set(["a", "an", "the", "for", "and", "or", "to", "of", "we", "our", "my", "something", "get", "buy", "want", "need", "some", "with", "is", "it"]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => (w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w));
}

function matches(item: CatalogItem, words: string[]): string[] {
  const hay = [...item.tags, ...tokens(item.title), item.merchant.toLowerCase()];
  return [...new Set(words.filter((w) => hay.some((h) => h === w || h.startsWith(w) || w.startsWith(h))))];
}

/** Words after "no"/"not"/"avoid"/"hate" are treated as exclusions. */
function negatives(prefs: string[]): string[] {
  const out: string[] = [];
  for (const p of prefs) {
    const re = /\b(?:no|not|avoid|hate|without)\s+([a-z-]+)/gi;
    for (const m of p.matchAll(re)) out.push(...tokens(m[1]));
  }
  return out;
}

/** "nothing over $80", "under 50 dollars", "max $40" tighten the price ceiling. */
function priceCeiling(prefs: string[]): number | undefined {
  const caps = prefs.flatMap((p) =>
    [...p.matchAll(/\b(?:over|under|below|max|less than|no more than)\s*\$?\s?(\d+(?:\.\d{1,2})?)/gi)].map((m) => Math.round(parseFloat(m[1]) * 100)),
  );
  return caps.length ? Math.min(...caps) : undefined;
}

export class CuratedCatalog implements Catalog {
  constructor(private items: CatalogItem[] = CATALOG) {}

  rank({ goal, budget, preferences, exclude = [], count = 3 }: RankInput): Option[] {
    const goalWords = tokens(goal);
    const neg = negatives(preferences);
    const prefWords = tokens(preferences.join(" ")).filter((w) => !neg.includes(w));
    const ceiling = Math.min(budget, priceCeiling(preferences) ?? budget);

    const scored = this.items
      .filter((i) => i.price <= ceiling && !exclude.includes(i.id))
      .filter((i) => matches(i, neg).length === 0)
      .map((i) => {
        const g = matches(i, goalWords);
        const p = matches(i, prefWords);
        // Goal fit matters most, then preferences, then using the budget well.
        const score = g.length * 3 + p.length * 2 + i.price / ceiling;
        return { item: i, score, prefHits: p };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map(({ item, prefHits }) => ({
      id: item.id,
      title: item.title,
      merchant: item.merchant,
      price: item.price,
      reason: prefHits.length ? `${item.reason} Fits: ${prefHits.slice(0, 2).join(", ")}.` : item.reason,
    }));
  }
}
