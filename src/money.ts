export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Finds the first dollar amount in text, e.g. "$120", "120 dollars", "$45.50". */
export function parseDollars(text: string): number | undefined {
  const m =
    text.match(/\$\s?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/) ??
    text.match(/(\d{1,6}(?:\.\d{1,2})?)\s?(?:dollars|bucks|usd)\b/i);
  if (!m) return undefined;
  return Math.round(parseFloat(m[1].replace(/,/g, "")) * 100);
}
