export type ClaimCrmCustomer = {
  id: string;
  primaryName: string;
  firstNameHe: string;
  lastNameHe: string;
  birthDate: string;
  email: string;
  phone: string;
};

export type ClaimCrmPolicy = {
  /** Unique UI key — one row per fullPolicyID after keeping latest addition. */
  uid: string;
  fullPolicyID: string;
  policyDoc: number;
  issueDate: string;
  startDate: string;
  endDate: string;
  areaName: string;
  clientName: string;
};

export type ClaimCrmLookupResult =
  | { ok: true; customer: ClaimCrmCustomer; policies: ClaimCrmPolicy[] }
  | { ok: false; reason: "invalid_id" | "not_found" | "network" | "upstream" };

// GetById requires Bearer auth (401). GetByIdU is the public lookup used by BuyInsNew.
const CRM_GET_BY_ID = "https://mobile.ophirins.co.il/api/policy/GetByIdU";
const CRM_GET_BY_ID_PASS = "Admin$123";

const normalizeDate = (d: unknown): string => {
  const s = String(d ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return s;
};

const pickStr = (...vals: unknown[]) => {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
};

const personMatchesId = (person: Record<string, unknown>, normalizedId: string, rawId: string) => {
  const custIdRaw = String(person?.personId ?? person?.id ?? "").trim();
  if (!custIdRaw) return false;
  const padded = custIdRaw.padStart(9, "0");
  return padded === normalizedId || custIdRaw === rawId;
};

const mapPerson = (person: Record<string, unknown>, fallbackId: string): ClaimCrmCustomer => {
  const primaryName = pickStr(person.clientName, person.name, person.fullName);
  const firstNameHe = pickStr(
    person.firstName,
    person.firstNameHe,
    person.firstNameHeb,
    person.hebFname,
    person.fname,
    primaryName.split(/\s+/)[0]
  );
  const lastNameHe = pickStr(
    person.lastName,
    person.lastNameHe,
    person.lastNameHeb,
    person.hebLname,
    person.lname,
    primaryName.split(/\s+/).slice(1).join(" ")
  );

  return {
    id: fallbackId,
    primaryName: primaryName || `${firstNameHe} ${lastNameHe}`.trim(),
    firstNameHe,
    lastNameHe,
    birthDate: normalizeDate(person.birthDate || person.dateOfBirth || person.dob || person.bDate),
    email: pickStr(person.email, person.mail, person.eMail, person.emailAddress),
    phone: pickStr(person.phone, person.mobile, person.cell, person.tel, person.telephone),
  };
};

const policyDocNum = (v: unknown): number => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

const mapPolicy = (p: Record<string, unknown>): ClaimCrmPolicy => {
  const fullPolicyID = pickStr(p.fullPolicyID, p.policyNumber, p.policyId, p.PolicyNumber);
  const policyDoc = policyDocNum(p.policyDoc ?? p.PolicyDoc ?? p.docNumber);
  const issueDate = normalizeDate(p.issueDate);
  const startDate = normalizeDate(p.startDate);
  const endDate = normalizeDate(p.endDate);
  const areaName = pickStr(p.areaName, p.destination, p.country);
  const clientName = pickStr(p.clientName);

  return {
    uid: fullPolicyID,
    fullPolicyID,
    policyDoc,
    issueDate,
    startDate,
    endDate,
    areaName,
    clientName,
  };
};

/** Keep only the latest addition (highest policyDoc) for each fullPolicyID. */
export const keepLatestPolicyAdditions = (policies: ClaimCrmPolicy[]): ClaimCrmPolicy[] => {
  const best = new Map<string, ClaimCrmPolicy>();

  for (const policy of policies) {
    if (!policy.fullPolicyID) continue;
    const prev = best.get(policy.fullPolicyID);
    if (!prev) {
      best.set(policy.fullPolicyID, policy);
      continue;
    }
    const prevIssue = new Date(prev.issueDate || 0).getTime();
    const nextIssue = new Date(policy.issueDate || 0).getTime();
    const isNewer =
      policy.policyDoc > prev.policyDoc ||
      (policy.policyDoc === prev.policyDoc && nextIssue >= prevIssue);
    if (isNewer) best.set(policy.fullPolicyID, policy);
  }

  return Array.from(best.values());
};

export const normalizeIsraeliId = (id: string) => id.trim().replace(/[^\d]/g, "").padStart(9, "0");

export const isValidIsraeliId = (id: string) => {
  const s = normalizeIsraeliId(id);
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

export async function lookupClaimCustomerById(idInput: string): Promise<ClaimCrmLookupResult> {
  const rawId = idInput.trim().replace(/[^\d]/g, "");
  if (!isValidIsraeliId(rawId)) return { ok: false, reason: "invalid_id" };

  const normalizedId = normalizeIsraeliId(rawId);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const url = `${CRM_GET_BY_ID}?id=${encodeURIComponent(normalizedId)}&pass=${encodeURIComponent(CRM_GET_BY_ID_PASS)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { ok: false, reason: "upstream" };

    const data = await res.json();
    const policiesRaw = Array.isArray(data) ? data : [];
    if (!policiesRaw.length) return { ok: false, reason: "not_found" };

    policiesRaw.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const ad = new Date(String(a.issueDate || 0)).getTime();
      const bd = new Date(String(b.issueDate || 0)).getTime();
      return bd - ad;
    });

    let foundPerson: Record<string, unknown> | null = null;
    for (const policy of policiesRaw) {
      if (!Array.isArray(policy?.customers)) continue;
      for (const cust of policy.customers) {
        if (personMatchesId(cust, normalizedId, rawId)) {
          foundPerson = cust;
          break;
        }
      }
      if (foundPerson) break;
    }

    if (!foundPerson) return { ok: false, reason: "not_found" };

    const policies = keepLatestPolicyAdditions(
      policiesRaw.map((p: Record<string, unknown>) => mapPolicy(p)).filter((p) => p.fullPolicyID)
    );

    if (!policies.length) return { ok: false, reason: "not_found" };

    policies.sort((a, b) => {
      const ad = new Date(a.issueDate || 0).getTime();
      const bd = new Date(b.issueDate || 0).getTime();
      return bd - ad;
    });

    return {
      ok: true,
      customer: mapPerson(foundPerson, normalizedId),
      policies,
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export const CLAIM_CONTACT = {
  phoneDisplay: "073-272-1111",
  phoneHref: "tel:+972732721111",
  email: "ophir@ophirins.co.il",
  emailHref: "mailto:ophir@ophirins.co.il",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const isValidYmd = (year: number, month: number, day: number) => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return false;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
};

/** Parse user/CRM date text to ISO YYYY-MM-DD. Always treats slash dates as DD/MM/YYYY. */
export const parseClaimDateToIso = (value: string): string => {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = +iso[1];
    const m = +iso[2];
    const d = +iso[3];
    return isValidYmd(y, m, d) ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
  }
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    const d = +dmy[1];
    const m = +dmy[2];
    const y = +dmy[3];
    return isValidYmd(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : "";
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) {
    const d = +digits.slice(0, 2);
    const m = +digits.slice(2, 4);
    const y = +digits.slice(4, 8);
    return isValidYmd(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : "";
  }
  return "";
};

/** Display CRM / ISO dates as DD/MM/YYYY (never locale-dependent). */
export const formatClaimDateDisplay = (value: string): string => {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const iso = parseClaimDateToIso(s) || (s.match(/^(\d{4})-(\d{2})-(\d{2})/) ? s.slice(0, 10) : "");
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
};

/** Live mask while typing: 29072026 → 29/07/2026 */
export const maskClaimDateInput = (raw: string): string => {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
};

const dateMs = (value: string): number => {
  const s = normalizeDate(value);
  if (!s) return Number.NaN;
  const t = new Date(`${s}T12:00:00`).getTime();
  return Number.isFinite(t) ? t : Number.NaN;
};

const startOfTodayMs = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.getTime();
};

/** Abroad travel claims: only show policies from the last N years. */
export const CLAIM_POLICY_MAX_AGE_YEARS = 3;

const claimLookbackCutoffMs = (
  years: number = CLAIM_POLICY_MAX_AGE_YEARS,
  todayMs: number = startOfTodayMs()
): number => {
  const d = new Date(todayMs);
  d.setFullYear(d.getFullYear() - years);
  return d.getTime();
};

/**
 * Keep policies that are still upcoming/active, or ended within the lookback window.
 * Older than CLAIM_POLICY_MAX_AGE_YEARS are hidden from the claim picker.
 */
export const isPolicyWithinClaimLookback = (
  policy: ClaimCrmPolicy,
  years: number = CLAIM_POLICY_MAX_AGE_YEARS,
  todayMs: number = startOfTodayMs()
): boolean => {
  const cutoff = claimLookbackCutoffMs(years, todayMs);
  const start = dateMs(policy.startDate);
  const end = dateMs(policy.endDate);

  // Future or currently active — always keep
  if (Number.isFinite(start) && start > todayMs) return true;
  if (Number.isFinite(end) && end >= todayMs) return true;
  if (Number.isFinite(start) && start <= todayMs && !Number.isFinite(end)) return true;

  // Ended: keep only if end (or start fallback) is within lookback
  if (Number.isFinite(end)) return end >= cutoff;
  if (Number.isFinite(start)) return start >= cutoff;
  return false;
};

export type ClaimPolicyTimeBucket = "future" | "active" | "started" | "all";

export type ClaimTypeForPolicyFilter = "medical" | "trip_cancel" | "trip_shorten" | "baggage" | string;

export type BaggageSubtypeForPolicyFilter =
  | "loss"
  | "theft"
  | "loss_theft"
  | "delay"
  | string
  | null
  | undefined;

/** Which policies are relevant for this claim type (and baggage subtype when relevant). */
export const policyTimeBucketForClaimType = (
  claimType: ClaimTypeForPolicyFilter | null | undefined,
  baggageSubtype?: BaggageSubtypeForPolicyFilter
): ClaimPolicyTimeBucket => {
  switch (claimType) {
    case "trip_cancel":
      // ביטול לפני יציאה — גם עתידיות וגם כאלה שכבר פגו (מגישים אחרי פקיעה)
      return "all";
    case "trip_shorten":
      // קיצור מחו״ל — רק נסיעה שכרגע פעילה
      return "active";
    case "baggage":
      // איחור בכבודה — רק נסיעה פעילה כעת
      if (baggageSubtype === "delay") return "active";
      // אובדן / גניבה — גם במהלך הנסיעה וגם אחרי שחזרתם
      if (
        baggageSubtype === "loss" ||
        baggageSubtype === "theft" ||
        baggageSubtype === "loss_theft"
      ) {
        return "started";
      }
      // לפני בחירת תת־סוג — מציגים את כל מה שיכול להתאים
      return "started";
    case "medical":
      // רפואי בחו״ל — נסיעה שהתחילה (פעילה או שכבר חזרו)
      return "started";
    default:
      return "all";
  }
};

export const isPolicyInTimeBucket = (
  policy: ClaimCrmPolicy,
  bucket: ClaimPolicyTimeBucket,
  todayMs: number = startOfTodayMs()
): boolean => {
  const start = dateMs(policy.startDate);
  const end = dateMs(policy.endDate);

  switch (bucket) {
    case "future":
      return Number.isFinite(start) && start > todayMs;
    case "active":
      return (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        start <= todayMs &&
        end >= todayMs
      );
    case "started":
      return Number.isFinite(start) && start <= todayMs;
    case "all":
    default:
      return true;
  }
};

export const filterPoliciesForClaimType = (
  policies: ClaimCrmPolicy[],
  claimType: ClaimTypeForPolicyFilter | null | undefined,
  baggageSubtype?: BaggageSubtypeForPolicyFilter
): ClaimCrmPolicy[] => {
  const bucket = policyTimeBucketForClaimType(claimType, baggageSubtype);
  const today = startOfTodayMs();
  const inLookback = policies.filter((policy) => isPolicyWithinClaimLookback(policy, CLAIM_POLICY_MAX_AGE_YEARS, today));
  if (bucket === "all") return inLookback;
  return inLookback.filter((policy) => isPolicyInTimeBucket(policy, bucket, today));
};

export const claimPolicyFilterCopy = (
  claimType: ClaimTypeForPolicyFilter | null | undefined,
  baggageSubtype?: BaggageSubtypeForPolicyFilter
): { listHint: string; emptyTitle: string; emptyBody: string; upcomingTitle: string; pastTitle: string } => {
  const bucket = policyTimeBucketForClaimType(claimType, baggageSubtype);

  if (claimType === "baggage" && baggageSubtype === "delay") {
    return {
      listHint: "מוצגות רק נסיעות שפעילות כרגע — מתאים לאיחור בהגעת כבודה (עד 3 שנים אחורה)",
      emptyTitle: "לא מצאנו נסיעה פעילה כרגע",
      emptyBody:
        "לאיחור בכבודה נדרשת פוליסה שפעילה עכשיו. אם הנסיעה עדיין לא יצאה או שכבר חזרתם — בחרו סוג תביעה מתאים, או צרו קשר עם הסוכנות.",
      upcomingTitle: "נסיעות פעילות כעת",
      pastTitle: "נסיעות שעברו",
    };
  }

  if (claimType === "baggage" && (baggageSubtype === "loss" || baggageSubtype === "theft" || baggageSubtype === "loss_theft")) {
    return {
      listHint: "מוצגות נסיעות שהתחילו ב־3 השנים האחרונות — פעילות כעת או שכבר הסתיימו (אובדן / גניבה)",
      emptyTitle: "לא מצאנו נסיעה מתאימה",
      emptyBody:
        "לאובדן או גניבה נדרשת פוליסה שנסיעתה כבר התחילה (עד 3 שנים אחורה). נסיעות עתידיות בלבד לא מוצגות כאן.",
      upcomingTitle: "נסיעות פעילות כעת",
      pastTitle: "נסיעות שעברו",
    };
  }

  switch (bucket) {
    case "future":
      return {
        listHint: "מוצגות רק נסיעות עתידיות שטרם יצאו — מתאים לביטול לפני היציאה",
        emptyTitle: "לא מצאנו נסיעה עתידית",
        emptyBody:
          "לסוג תביעה זה נדרשת פוליסה עם תאריך יציאה עתידי. אם יש לכם נסיעה פעילה או שעברה — בחרו סוג תביעה אחר, או צרו קשר עם הסוכנות.",
        upcomingTitle: "נסיעות עתידיות",
        pastTitle: "נסיעות שעברו",
      };
    case "active":
      return {
        listHint: "מוצגות רק נסיעות שפעילות כרגע (יצאתם ותאריך החזרה עדיין לא עבר)",
        emptyTitle: "לא מצאנו נסיעה פעילה כרגע",
        emptyBody:
          "לסוג תביעה זה נדרשת פוליסה שפעילה עכשיו. אם הנסיעה עדיין לא יצאה או שכבר חזרתם — בחרו סוג תביעה מתאים, או צרו קשר עם הסוכנות.",
        upcomingTitle: "נסיעות פעילות כעת",
        pastTitle: "נסיעות שעברו",
      };
    case "started":
      return {
        listHint: "מוצגות נסיעות מה־3 השנים האחרונות שהתחילו — פעילות כעת או שכבר הסתיימו",
        emptyTitle: "לא מצאנו נסיעה מתאימה",
        emptyBody:
          "לסוג תביעה זה נדרשת פוליסה שנסיעתה כבר התחילה (עד 3 שנים אחורה). נסיעות עתידיות בלבד לא מוצגות כאן.",
        upcomingTitle: "נסיעות פעילות כעת",
        pastTitle: "נסיעות שעברו",
      };
    default:
      return {
        listHint:
          claimType === "trip_cancel"
            ? "מוצגות פוליסות עד 3 שנים אחורה — כולל נסיעות עתידיות וגם כאלה שכבר פגו"
            : "בחרו את הנסיעה הרלוונטית לתביעה (עד 3 שנים אחורה)",
        emptyTitle: "לא מצאנו פוליסה במערכת",
        emptyBody:
          "הגשת תביעה אפשרית לפוליסות נסיעות עד 3 שנים אחורה. אם רכשתם אצלנו או שאתם חושבים שיש טעות — נשמח לעזור בטלפון או במייל.",
        upcomingTitle: "נסיעות עתידיות / פעילות",
        pastTitle: "נסיעות שעברו",
      };
  }
};

/**
 * Group policies for the claim picker.
 * - upcoming = currently active (started, not ended), plus future only when bucket allows it
 * - past = already ended
 * For "started" / "active" buckets, future trips are never listed (defense in depth).
 */
export const groupClaimPolicies = (
  policies: ClaimCrmPolicy[],
  bucket: ClaimPolicyTimeBucket = "all"
) => {
  const today = startOfTodayMs();
  const allowFuture = bucket === "all" || bucket === "future";
  const upcoming: ClaimCrmPolicy[] = [];
  const past: ClaimCrmPolicy[] = [];

  for (const policy of policies) {
    const end = dateMs(policy.endDate);
    const start = dateMs(policy.startDate);
    const isFuture = Number.isFinite(start) && start > today;
    const isPast = Number.isFinite(end) ? end < today : false;

    if (isFuture) {
      if (allowFuture) upcoming.push(policy);
      continue;
    }
    if (isPast) {
      past.push(policy);
      continue;
    }
    // Active now (started and not ended), or missing end but already started
    upcoming.push(policy);
  }

  upcoming.sort((a, b) => (dateMs(a.startDate) || 0) - (dateMs(b.startDate) || 0));
  past.sort((a, b) => (dateMs(b.endDate) || dateMs(b.startDate) || 0) - (dateMs(a.endDate) || dateMs(a.startDate) || 0));

  return {
    upcoming,
    past,
    upcomingByYear: groupPoliciesByYear(upcoming, "asc"),
    pastByYear: groupPoliciesByYear(past, "desc"),
  };
};

const policyYear = (policy: ClaimCrmPolicy): number => {
  const fromStart = normalizeDate(policy.startDate).slice(0, 4);
  const fromEnd = normalizeDate(policy.endDate).slice(0, 4);
  const y = Number(fromStart || fromEnd || fromIssue(policy.issueDate));
  return Number.isFinite(y) && y > 1900 ? y : 0;
};

const fromIssue = (issueDate: string) => normalizeDate(issueDate).slice(0, 4);

export const groupPoliciesByYear = (
  policies: ClaimCrmPolicy[],
  yearOrder: "asc" | "desc" = "desc"
): { year: number; policies: ClaimCrmPolicy[] }[] => {
  const map = new Map<number, ClaimCrmPolicy[]>();
  for (const policy of policies) {
    const year = policyYear(policy);
    const list = map.get(year) || [];
    list.push(policy);
    map.set(year, list);
  }

  const years = Array.from(map.keys()).sort((a, b) => (yearOrder === "desc" ? b - a : a - b));
  return years.map((year) => ({
    year,
    policies: map.get(year) || [],
  }));
};
