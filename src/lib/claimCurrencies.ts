export type ClaimCurrency = {
  code: string;
  nameHe: string;
  /** Extra search terms (destination / aliases). */
  aliases: string[];
};

/** Common travel-claim currencies with Hebrew labels. */
export const CLAIM_CURRENCIES: ClaimCurrency[] = [
  { code: "USD", nameHe: "דולר אמריקאי", aliases: ["dollar", "דולר", "usa", "ארהב", "ארצות הברית", "אמריקה"] },
  { code: "EUR", nameHe: "אירו", aliases: ["euro", "אירופה", "europe", "שנגן"] },
  { code: "ILS", nameHe: "שקל חדש", aliases: ["שקל", "israel", "ישראל", "nis"] },
  { code: "GBP", nameHe: "לירה שטרלינג", aliases: ["pound", "לירה", "אנגליה", "בריטניה", "uk", "london"] },
  { code: "CHF", nameHe: "פרנק שוויצרי", aliases: ["franc", "פרנק", "שוויץ", "switzerland"] },
  { code: "CAD", nameHe: "דולר קנדי", aliases: ["canada", "קנדה"] },
  { code: "AUD", nameHe: "דולר אוסטרלי", aliases: ["australia", "אוסטרליה"] },
  { code: "JPY", nameHe: "ין יפני", aliases: ["yen", "ין", "יפן", "japan", "טוקיו"] },
  { code: "CNY", nameHe: "יואן סיני", aliases: ["yuan", "סין", "china", "בייג׳ין"] },
  { code: "THB", nameHe: "בהט תאילנדי", aliases: ["baht", "בהט", "תאילנד", "thailand", "בנגקוק"] },
  { code: "TRY", nameHe: "לירה טורקית", aliases: ["lira", "טורקיה", "turkey", "איסטנבול", "אנטליה"] },
  { code: "AED", nameHe: "דירהם איחוד האמירויות", aliases: ["dirham", "דובאי", "אבו דאבי", "אמירויות", "uae"] },
  { code: "EGP", nameHe: "לירה מצרית", aliases: ["egypt", "מצרים", "קהיר", "שארם"] },
  { code: "JOD", nameHe: "דינר ירדני", aliases: ["jordan", "ירדן", "עמאן", "פטרה"] },
  { code: "GEL", nameHe: "לארי גאורגי", aliases: ["georgia", "גאורגיה", "טביליסי", "באטומי"] },
  { code: "CZK", nameHe: "קורונה צ׳כית", aliases: ["czech", "צ׳כיה", "פראג"] },
  { code: "HUF", nameHe: "פורינט הונגרי", aliases: ["hungary", "הונגריה", "בודפשט"] },
  { code: "PLN", nameHe: "זלוטי פולני", aliases: ["poland", "פולין", "ורשה", "קרקוב"] },
  { code: "RON", nameHe: "לאו רומני", aliases: ["romania", "רומניה", "בוקרשט"] },
  { code: "BGN", nameHe: "לב בולגרי", aliases: ["bulgaria", "בולגריה", "סופיה"] },
  { code: "HRK", nameHe: "קונה קרואטית", aliases: ["croatia", "קרואטיה", "זגרב", "ספליט"] },
  { code: "SEK", nameHe: "כתר שבדי", aliases: ["sweden", "שבדיה", "סטוקהולם"] },
  { code: "NOK", nameHe: "כתר נורווגי", aliases: ["norway", "נורווגיה", "אוסלו"] },
  { code: "DKK", nameHe: "כתר דני", aliases: ["denmark", "דנמרק", "קופנהגן"] },
  { code: "INR", nameHe: "רופי הודי", aliases: ["india", "הודו", "דלהי", "מומבאי"] },
  { code: "SGD", nameHe: "דולר סינגפורי", aliases: ["singapore", "סינגפור"] },
  { code: "HKD", nameHe: "דולר הונג קונג", aliases: ["hong kong", "הונג קונג"] },
  { code: "KRW", nameHe: "וון דרום קוריאני", aliases: ["korea", "קוריאה", "סיאול"] },
  { code: "MXN", nameHe: "פסו מקסיקני", aliases: ["mexico", "מקסיקו", "cancun"] },
  { code: "BRL", nameHe: "ריאל ברזילאי", aliases: ["brazil", "ברזיל", "ריו"] },
  { code: "ZAR", nameHe: "ראנד דרום אפריקאי", aliases: ["south africa", "דרום אפריקה"] },
  { code: "NZD", nameHe: "דולר ניו זילנדי", aliases: ["new zealand", "ניו זילנד"] },
  { code: "RUB", nameHe: "רובל רוסי", aliases: ["russia", "רוסיה", "מוסקבה"] },
  { code: "UAH", nameHe: "גריבנה אוקראינית", aliases: ["ukraine", "אוקראינה", "קייב"] },
  { code: "MAD", nameHe: "דירהם מרוקאי", aliases: ["morocco", "מרוקו", "מרקש"] },
  { code: "VND", nameHe: "דונג וייטנאמי", aliases: ["vietnam", "וייטנאם", "האנוי"] },
  { code: "IDR", nameHe: "רופיה אינדונזית", aliases: ["indonesia", "אינדונזיה", "באלי"] },
  { code: "PHP", nameHe: "פסו פיליפיני", aliases: ["philippines", "פיליפינים"] },
  { code: "MYR", nameHe: "רינגיט מלזי", aliases: ["malaysia", "מלזיה"] },
];

type DestinationRule = { currency: string; terms: string[] };

/** Destination/country keywords → default currency. */
const DESTINATION_CURRENCY_RULES: DestinationRule[] = [
  { currency: "USD", terms: ["ארה״ב", "ארהב", "ארצות הברית", "אמריקה", "ניו יורק", "מיאמי", "לוס אנג׳לס", "usa", "united states", "america"] },
  { currency: "GBP", terms: ["אנגליה", "בריטניה", "לונדון", "uk", "united kingdom", "england", "scotland", "britain"] },
  { currency: "CHF", terms: ["שוויץ", "ציריך", "ז׳נבה", "switzerland", "zurich", "geneva"] },
  { currency: "CAD", terms: ["קנדה", "טורונטו", "ונקובר", "canada", "toronto"] },
  { currency: "AUD", terms: ["אוסטרליה", "סידני", "מלבורן", "australia", "sydney"] },
  { currency: "JPY", terms: ["יפן", "טוקיו", "אוסקה", "japan", "tokyo"] },
  { currency: "CNY", terms: ["סין", "בייג׳ין", "שנחאי", "china", "beijing"] },
  { currency: "THB", terms: ["תאילנד", "בנגקוק", "פוקט", "thailand", "bangkok", "phuket"] },
  { currency: "TRY", terms: ["טורקיה", "איסטנבול", "אנטליה", "turkey", "istanbul", "antalya"] },
  { currency: "AED", terms: ["דובאי", "אבו דאבי", "אמירויות", "dubai", "uae", "abu dhabi"] },
  { currency: "EGP", terms: ["מצרים", "קהיר", "שארם", "egypt", "cairo", "sharm"] },
  { currency: "JOD", terms: ["ירדן", "עמאן", "פטרה", "jordan", "amman"] },
  { currency: "GEL", terms: ["גאורגיה", "טביליסי", "באטומי", "georgia", "tbilisi", "batumi"] },
  { currency: "CZK", terms: ["צ׳כיה", "פראג", "czech", "prague"] },
  { currency: "HUF", terms: ["הונגריה", "בודפשט", "hungary", "budapest"] },
  { currency: "PLN", terms: ["פולין", "ורשה", "קרקוב", "poland", "warsaw", "krakow"] },
  { currency: "ILS", terms: ["ישראל", "תל אביב", "ירושלים", "israel", "tel aviv"] },
  // Broad Europe → EUR (after specific European countries above)
  {
    currency: "EUR",
    terms: [
      "אירופה",
      "europe",
      "צרפת",
      "פריז",
      "france",
      "paris",
      "גרמניה",
      "ברלין",
      "germany",
      "berlin",
      "איטליה",
      "רומא",
      "italy",
      "rome",
      "ספרד",
      "מדריד",
      "ברצלונה",
      "spain",
      "madrid",
      "barcelona",
      "יוון",
      "אתונה",
      "greece",
      "athens",
      "קפריסין",
      "לרנקה",
      "cyprus",
      "פורטוגל",
      "ליסבון",
      "portugal",
      "lisbon",
      "הולנד",
      "אמסטרדם",
      "netherlands",
      "amsterdam",
      "בלגיה",
      "בריסל",
      "belgium",
      "אוסטריה",
      "וינה",
      "austria",
      "vienna",
      "אירלנד",
      "דבלין",
      "ireland",
      "dublin",
      "פינלנד",
      "helsinki",
      "קרואטיה",
      "croatia",
      "בולגריה",
      "bulgaria",
      "רומניה",
      "romania",
    ],
  },
];

export function suggestCurrencyForDestination(destination: string): string {
  const q = String(destination || "").trim().toLowerCase();
  if (!q) return "USD";
  for (const rule of DESTINATION_CURRENCY_RULES) {
    if (rule.terms.some((term) => q.includes(term.toLowerCase()))) {
      return rule.currency;
    }
  }
  return "USD";
}

export function filterCurrencies(query: string): ClaimCurrency[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return CLAIM_CURRENCIES;
  return CLAIM_CURRENCIES.filter((c) => {
    const hay = `${c.code} ${c.nameHe} ${c.aliases.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

export function formatClaimTotal(amount: string, currency: string): string {
  const a = String(amount || "").trim();
  const c = String(currency || "").trim().toUpperCase();
  if (!a && !c) return "";
  if (!a) return c;
  if (!c) return a;
  return `${a} ${c}`;
}
