import currenciesJson from "@/data/claimCurrencies.json";

export type ClaimCurrency = {
  code: string;
  nameHe: string;
  /** Extra search terms (destination / aliases). */
  aliases: string[];
};

/** World currencies for claim amounts — searchable by code, Hebrew name, or destination. */
export const CLAIM_CURRENCIES: ClaimCurrency[] = currenciesJson as ClaimCurrency[];

const POPULAR_CODES = ["USD", "EUR", "ILS", "GBP", "CHF", "CAD", "AUD", "JPY", "THB", "TRY", "AED", "RUB"];

/** Broad region labels that should map even without a specific country. */
const DESTINATION_PRIORITY_RULES: { currency: string; terms: string[] }[] = [
  { currency: "EUR", terms: ["אירופה", "europe", "שנגן"] },
  { currency: "USD", terms: ["ארה״ב", "ארהב", "ארצות הברית", "united states"] },
];

export function suggestCurrencyForDestination(destination: string): string {
  const q = String(destination || "").trim().toLowerCase();
  if (!q) return "USD";

  for (const rule of DESTINATION_PRIORITY_RULES) {
    if (rule.terms.some((term) => q.includes(term.toLowerCase()))) {
      return rule.currency;
    }
  }

  for (const c of CLAIM_CURRENCIES) {
    if (
      c.aliases.some((a) => {
        const t = a.toLowerCase();
        return q === t || q.includes(t) || (t.length >= 3 && t.includes(q));
      })
    ) {
      return c.code;
    }
  }
  return "USD";
}

export function filterCurrencies(query: string): ClaimCurrency[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) {
    const popular = POPULAR_CODES.map((code) => CLAIM_CURRENCIES.find((c) => c.code === code)).filter(
      Boolean
    ) as ClaimCurrency[];
    const rest = CLAIM_CURRENCIES.filter((c) => !POPULAR_CODES.includes(c.code));
    return [...popular, ...rest];
  }
  const scored = CLAIM_CURRENCIES.map((c) => {
    const code = c.code.toLowerCase();
    const name = c.nameHe.toLowerCase();
    const aliases = c.aliases.map((a) => a.toLowerCase());
    let score = 0;
    if (code === q) score = 100;
    else if (code.startsWith(q)) score = 90;
    else if (name.includes(q)) score = 80;
    else if (aliases.some((a) => a === q)) score = 75;
    else if (aliases.some((a) => a.includes(q) || (q.length >= 3 && q.includes(a)))) score = 60;
    else if (`${code} ${name} ${aliases.join(" ")}`.includes(q)) score = 40;
    return { c, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || a.c.code.localeCompare(b.c.code));
  return scored.map((x) => x.c);
}

export function formatClaimTotal(amount: string, currency: string): string {
  const a = String(amount || "").trim();
  const c = String(currency || "").trim().toUpperCase();
  if (!a && !c) return "";
  if (!a) return c;
  if (!c) return a;
  return `${a} ${c}`;
}
