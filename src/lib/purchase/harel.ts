// Shared purchase-flow logic: CRM lookup mapping, validation helpers and Harel hand-off.
// Used by the current form (src/pages/BuyInsNew.tsx) and the new flow (src/pages/PurchaseV2.tsx).
/** ========= Utils ========= */

export function isValidIsraeliId(id: string) {
  const s = id.trim().padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function cn(...x: Array<string | false | undefined | null>) {
  return x.filter(Boolean).join(" ");
}

export function fmtDateToInput(d?: string | null) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

export function isoToDDMMYYYY(iso: string) {
  if (!iso) return "";
  // תופס yyyy-mm-dd
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso; // אם זה כבר טקסט חופשי, נשאיר
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function ddmmyyyyToISO(input: string) {
  const v = input.trim();
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${yyyy}-${pad(mm)}-${pad(dd)}`;
}

export function splitNameHe(full?: string | null) {
  const name = (full || "").trim();
  if (!name) return { first: "", last: "" };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function isHebrewText(value?: string | null) {
  return Boolean(value && /[\u0590-\u05FF]/.test(value));
}

export function isLatinText(value?: string | null) {
  return Boolean(value && /[A-Za-z]/.test(value));
}

export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export function sortCustomersByBirthDate<T extends { birthDate: string; lastNameHe?: string; lastNameEn?: string }>(customers: T[]): T[] {
  // ממיין קודם לפי שם משפחה, ואז לפי תאריך לידה - מהקטן לגדול (כלומר מהגדול לקטן בגיל)
  // הנוסע הראשון (index 0) נשאר במקומו
  if (customers.length <= 1) return customers;
  
  const [first, ...rest] = customers;
  
  // ממיין את השאר קודם לפי שם משפחה, ואז לפי תאריך לידה
  const sorted = [...rest].sort((a, b) => {
    // קודם מיון לפי שם משפחה
    const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
    const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();
    
    if (lastNameA && lastNameB) {
      const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
    } else if (lastNameA && !lastNameB) {
      return -1; // A קודם
    } else if (!lastNameA && lastNameB) {
      return 1; // B קודם
    }
    
    // אם שם המשפחה זהה או אין שם משפחה, ממיינים לפי תאריך לידה
    const dateA = a.birthDate || "";
    const dateB = b.birthDate || "";
    
    // אם אין תאריך לידה, מניחים אותו בסוף
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // תאריך קטן יותר = גיל גדול יותר, אז ממיינים מהקטן לגדול
    return dateA.localeCompare(dateB);
  });
  
  return [first, ...sorted];
}

/** ========= Types ========= */
export type CustomerForm = {
  id: string;
  gender: "M" | "F" | "";
  firstNameHe: string;
  lastNameHe: string;
  firstNameEn: string;
  lastNameEn: string;
  birthDate: string;
  email: string;
  phone: string;
};

export type AdditionalCustomer = {
  personId: string;
  primaryName: string;
  firstNameHe: string;
  lastNameHe: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: "M" | "F" | "";
  birthDate: string;
  email: string;
  phone: string;
};

export type PriorConditionStatus = "yes" | "no" | "unknown";

export type PriorConditionInfo = {
  status: PriorConditionStatus;
  policyLabel: string;
  policyId?: string;
};

export type SpecialDiscountInfo = {
  discountLabel: string;
  policyLabel: string;
};

export type DiscountSwitchLinkInfo = {
  aff: string;
  url: string;
  label: string;
};

export type CarriedCustomersPayload = {
  id: string;
  customers: CustomerForm[];
};

export const API_BASE_URL = "https://mobile.ophirins.co.il";

export const normalizeIdValue = (value: unknown) => {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.padStart(9, "0");
};

export const pickString = (obj: Record<string, unknown> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const normalizeGender = (value: unknown): "M" | "F" | "" => {
  if (!value) return "";
  const v = String(value).trim().toLowerCase();
  if (v === "m" || v === "male") return "M";
  if (v === "f" || v === "female") return "F";
  if (v === "1") return "M";
  if (v === "2") return "F";
  return "";
};

export const POLICY_PERSON_ARRAY_KEYS = [
  "persons",
  "people",
  "insureds",
  "insuredPersons",
  "policyPersons",
  "customers",
  "insuredPersonsList",
] as const;

export const PRIOR_CONDITION_RIDER_CODE = 172;
export const SPECIAL_DISCOUNT_PERCENTS = new Set(["10", "15", "20"]);
export const PRIOR_CONDITION_STATUS_SCORE: Record<PriorConditionStatus, number> = {
  unknown: 0,
  no: 1,
  yes: 2,
};
export const SPECIAL_DISCOUNT_SWITCH_LINKS: Record<string, DiscountSwitchLinkInfo> = {
  "10": {
    aff: "1282",
    url: "https://ophir.travelsure.co.il/buyinsnew?aff=1282",
    label: "10%",
  },
  "15": {
    aff: "1283",
    url: "https://ophir.travelsure.co.il/buyinsnew?aff=1283",
    label: "15%",
  },
  "20": {
    aff: "1284",
    url: "https://ophir.travelsure.co.il/buyinsnew?aff=1284",
    label: "20%",
  },
};

export const hasPriorConditionFromRiders = (riders: unknown): PriorConditionStatus => {
  if (!Array.isArray(riders)) return "unknown";
  const hasPriorCondition = riders.some((rider) => {
    if (!rider || typeof rider !== "object") return false;
    const riderObj = rider as Record<string, unknown>;
    const code = Number(riderObj.riderCode ?? riderObj.RiderCode ?? riderObj.code ?? riderObj.Code);
    if (!Number.isNaN(code) && code === PRIOR_CONDITION_RIDER_CODE) {
      return true;
    }
    const name = String(riderObj.riderName ?? riderObj.RiderName ?? riderObj.name ?? riderObj.Name ?? "").trim();
    return /החמרה|מצב רפואי קודם|prior\s*condition|pre[-\s]?existing/i.test(name);
  });
  return hasPriorCondition ? "yes" : "no";
};

export const resolvePolicySortScore = (policy: Record<string, unknown>, fallbackIndex: number) => {
  const issueDate = pickString(policy, ["issueDate", "IssueDate", "createdAt", "CreatedAt", "startDate", "StartDate"]);
  if (issueDate) {
    const ts = new Date(issueDate).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  const policyIndex = Number(policy.policyIndex ?? policy.PolicyIndex ?? policy.index ?? policy.Index);
  if (!Number.isNaN(policyIndex)) return policyIndex;
  return fallbackIndex;
};

export const buildPolicyLabel = (policy: Record<string, unknown>) => {
  const policyId = pickString(policy, ["fullPolicyID", "fullPolicyId", "policyId", "PolicyId", "policyID"]);
  const issueDate = pickString(policy, ["issueDate", "IssueDate"]);
  const datePart = fmtDateToInput(issueDate);
  if (policyId && datePart) return `פוליסה ${policyId} · ${datePart}`;
  if (policyId) return `פוליסה ${policyId}`;
  if (datePart) return `פוליסה אחרונה · ${datePart}`;
  return "פוליסה אחרונה";
};

export const extractSpecialDiscountLabel = (policy: Record<string, unknown>) => {
  const agentName = pickString(policy, ["agentName", "AgentName", "affiliateName", "AffiliateName"]);
  if (!agentName) return "";
  const match = agentName.match(/אופיר\s*מיוחד\s*(10|15|20)\s*%/);
  if (!match) return "";
  const percent = match[1];
  if (!SPECIAL_DISCOUNT_PERCENTS.has(percent)) return "";
  return `אופיר מיוחד ${percent}%`;
};

export const extractSpecialDiscountPercent = (discountLabel: string) => {
  const match = String(discountLabel || "").match(/(10|15|20)\s*%/);
  return match?.[1] || "";
};

export const mergePriorConditionMaps = (
  baseMap: Record<string, PriorConditionInfo>,
  nextMap: Record<string, PriorConditionInfo>
) => {
  const merged: Record<string, PriorConditionInfo> = { ...baseMap };
  Object.entries(nextMap).forEach(([personId, nextInfo]) => {
    const current = merged[personId];
    if (!current) {
      merged[personId] = nextInfo;
      return;
    }

    const currentScore = PRIOR_CONDITION_STATUS_SCORE[current.status] ?? 0;
    const nextScore = PRIOR_CONDITION_STATUS_SCORE[nextInfo.status] ?? 0;

    if (nextScore > currentScore) {
      merged[personId] = nextInfo;
      return;
    }

    if (nextScore === currentScore) {
      merged[personId] = {
        ...current,
        policyLabel: current.policyLabel || nextInfo.policyLabel,
        policyId: current.policyId || nextInfo.policyId,
      };
    }
  });
  return merged;
};

export const mergeSpecialDiscountMaps = (
  baseMap: Record<string, SpecialDiscountInfo>,
  nextMap: Record<string, SpecialDiscountInfo>
) => {
  const merged: Record<string, SpecialDiscountInfo> = { ...baseMap };
  Object.entries(nextMap).forEach(([personId, nextInfo]) => {
    const current = merged[personId];
    if (!current) {
      merged[personId] = nextInfo;
      return;
    }
    merged[personId] = {
      ...current,
      discountLabel: nextInfo.discountLabel || current.discountLabel,
      policyLabel: nextInfo.policyLabel || current.policyLabel,
    };
  });
  return merged;
};

export const extractPersonEntriesFromPolicies = (policies: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(policies)) return [];
  const entries: Array<Record<string, unknown>> = [];
  const arrayKeys = [
    "persons",
    "people",
    "insureds",
    "insuredPersons",
    "policyPersons",
    "customers",
    "insuredPersonsList",
  ];

  for (const policy of policies) {
    if (policy && typeof policy === "object") {
      entries.push(policy as Record<string, unknown>);
      for (const key of arrayKeys) {
        const maybeArray = (policy as Record<string, unknown>)[key];
        if (Array.isArray(maybeArray)) {
          maybeArray.forEach((item) => {
            if (item && typeof item === "object") {
              entries.push(item as Record<string, unknown>);
            }
          });
        }
      }
    }
  }

  return entries;
};

export const buildCustomerFromEntry = (entry: Record<string, unknown>, fallbackId: string): CustomerForm => {
  const personId =
    normalizeIdValue(
      entry.personId ||
        entry.PersonId ||
        entry.personID ||
        entry.PersonID ||
        entry.id ||
        entry.ID
    ) || fallbackId;

  const fullName =
    pickString(entry, [
      "primaryName",
      "fullName",
      "FullName",
      "clientName",
      "ClientName",
      "name",
      "Name",
      "customerName",
      "insuredName",
    ]) || "";
  const firstNameHe = pickString(entry, [
    "firstNameHe",
    "FirstNameHe",
    "firstNameHebrew",
    "firstName",
    "hebFname",
    "hebFirstName",
  ]);
  const lastNameHe = pickString(entry, [
    "lastNameHe",
    "LastNameHe",
    "lastNameHebrew",
    "lastName",
    "hebLname",
    "hebLastName",
  ]);
  const split = (!firstNameHe && !lastNameHe && fullName) ? splitNameHe(fullName) : { first: firstNameHe, last: lastNameHe };

  const firstNameEn = pickString(entry, [
    "firstNameEn",
    "FirstNameEn",
    "firstNameEnglish",
    "engFname",
    "engFirstName",
  ]);
  const lastNameEn = pickString(entry, [
    "lastNameEn",
    "LastNameEn",
    "lastNameEnglish",
    "engLname",
    "engLastName",
  ]);

  const resolvedFirstNameHe = split.first || "";
  const resolvedLastNameHe = split.last || "";
  const resolvedFirstNameEn = (firstNameEn || "").trim();
  const resolvedLastNameEn = (lastNameEn || "").trim();

  const shouldCopyFirstNameToEnglish =
    !resolvedFirstNameEn.trim() &&
    !isHebrewText(resolvedFirstNameHe) &&
    isLatinText(resolvedFirstNameHe);
  const shouldCopyLastNameToEnglish =
    !resolvedLastNameEn.trim() &&
    !isHebrewText(resolvedLastNameHe) &&
    isLatinText(resolvedLastNameHe);

  return {
    id: personId,
    gender: normalizeGender(
      entry.gender || entry.Gender || entry.sex || entry.Sex || entry.sexType || entry.SexType
    ),
    firstNameHe: resolvedFirstNameHe,
    lastNameHe: resolvedLastNameHe,
    firstNameEn: shouldCopyFirstNameToEnglish ? resolvedFirstNameHe : resolvedFirstNameEn,
    lastNameEn: shouldCopyLastNameToEnglish ? resolvedLastNameHe : resolvedLastNameEn,
    birthDate: pickString(entry, ["birthDate", "BirthDate", "dateOfBirth", "DateOfBirth", "dob"]),
    email: pickString(entry, ["email", "Email", "mail", "Mail"]),
    phone: pickString(entry, ["phone", "Phone", "phoneNumber", "PhoneNumber", "mobile", "Mobile", "cell", "Cell"]),
  };
};

export const buildAdditionalCustomer = (customer: CustomerForm): AdditionalCustomer => ({
  personId: customer.id,
  primaryName: `${customer.firstNameHe} ${customer.lastNameHe}`.trim(),
  firstNameHe: customer.firstNameHe,
  lastNameHe: customer.lastNameHe,
  firstNameEn: customer.firstNameEn,
  lastNameEn: customer.lastNameEn,
  gender: customer.gender,
  birthDate: customer.birthDate,
  email: customer.email,
  phone: customer.phone,
});

export const extractEntriesFromPeopleResponse = (payload: unknown): Array<Record<string, unknown>> => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const listKeys = ["persons", "people", "customers", "insureds", "result", "data", "items"];
    for (const key of listKeys) {
      const maybeArray = obj[key];
      if (Array.isArray(maybeArray)) {
        return maybeArray.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
      }
    }
    if (obj.personId || obj.PersonId || obj.personID || obj.PersonID || obj.id || obj.ID) {
      return [obj];
    }
  }
  return [];
};

export const mapPeopleResponseToCustomers = (payload: unknown, normalizedId: string) => {
  const entries = extractEntriesFromPeopleResponse(payload);
  if (entries.length === 0) {
    return { primaryCustomer: null, additionalCustomers: [] as AdditionalCustomer[] };
  }

  const primaryEntry =
    entries.find((entry) => normalizeIdValue(entry.personId || entry.PersonId) === normalizedId) || entries[0];
  const primaryCustomer = primaryEntry ? buildCustomerFromEntry(primaryEntry, normalizedId) : null;

  const additionalCustomers = entries
    .map((entry) => {
      const personId = normalizeIdValue(
        entry.personId || entry.PersonId || entry.personID || entry.PersonID || entry.id || entry.ID
      );
      if (!personId || personId === normalizedId) return null;
      return buildAdditionalCustomer(buildCustomerFromEntry(entry, personId));
    })
    .filter((item): item is AdditionalCustomer => Boolean(item));

  const uniqueAdditional = Array.from(
    new Map(additionalCustomers.map((item) => [String(item.personId), item])).values()
  );

  return { primaryCustomer, additionalCustomers: uniqueAdditional };
};

export const mapPoliciesToCustomers = (policies: unknown, normalizedId: string) => {
  const entries = extractPersonEntriesFromPolicies(policies);
  if (entries.length === 0) {
    return {
      primaryCustomer: null,
      additionalCustomers: [] as AdditionalCustomer[],
      priorConditionById: {} as Record<string, PriorConditionInfo>,
      specialDiscountById: {} as Record<string, SpecialDiscountInfo>,
    };
  }

  const priorConditionById: Record<string, PriorConditionInfo> = {};
  const specialDiscountById: Record<string, SpecialDiscountInfo> = {};
  if (Array.isArray(policies)) {
    const latestByPersonId = new Map<
      string,
      { score: number; status: PriorConditionStatus; policyLabel: string; policyId: string }
    >();
    const latestDiscountByPersonId = new Map<
      string,
      { score: number; discountLabel: string; policyLabel: string }
    >();

    policies.forEach((policyItem, index) => {
      if (!policyItem || typeof policyItem !== "object") return;
      const policy = policyItem as Record<string, unknown>;
      const score = resolvePolicySortScore(policy, index);
      const policyLabel = buildPolicyLabel(policy);
      const policyId = pickString(policy, ["fullPolicyID", "fullPolicyId", "policyId", "PolicyId", "policyID"]);
      const discountLabel = extractSpecialDiscountLabel(policy);

      const personEntries: Array<Record<string, unknown>> = [];
      POLICY_PERSON_ARRAY_KEYS.forEach((key) => {
        const maybeArray = policy[key];
        if (Array.isArray(maybeArray)) {
          maybeArray.forEach((item) => {
            if (item && typeof item === "object") {
              personEntries.push(item as Record<string, unknown>);
            }
          });
        }
      });

      if (personEntries.length === 0) {
        personEntries.push(policy);
      }

      personEntries.forEach((entry) => {
        const personId = normalizeIdValue(
          entry.personId || entry.PersonId || entry.personID || entry.PersonID || entry.id || entry.ID
        );
        if (!personId) return;
        const riders = entry.riders || entry.Riders;
        const status = hasPriorConditionFromRiders(riders);
        const existing = latestByPersonId.get(personId);
        const existingKnown = existing && existing.status !== "unknown";
        const nextKnown = status !== "unknown";

        // Never replace known person-specific status with unknown.
        if (existingKnown && !nextKnown) {
          return;
        }

        if (!existing || score >= existing.score) {
          latestByPersonId.set(personId, { score, status, policyLabel, policyId });
        }
        if (discountLabel) {
          const existingDiscount = latestDiscountByPersonId.get(personId);
          if (!existingDiscount || score >= existingDiscount.score) {
            latestDiscountByPersonId.set(personId, { score, discountLabel, policyLabel });
          }
        }
      });
    });

    latestByPersonId.forEach((value, personId) => {
      priorConditionById[personId] = {
        status: value.status,
        policyLabel: value.policyLabel,
        policyId: value.policyId,
      };
    });

    latestDiscountByPersonId.forEach((value, personId) => {
      specialDiscountById[personId] = {
        discountLabel: value.discountLabel,
        policyLabel: value.policyLabel,
      };
    });
  }

  const primaryEntry =
    entries.find((entry) => normalizeIdValue(entry.personId || entry.PersonId) === normalizedId) ||
    entries[0];

  const primaryCustomer = primaryEntry ? buildCustomerFromEntry(primaryEntry, normalizedId) : null;

  const additionalCustomers = entries
    .map((entry) => {
      const personId = normalizeIdValue(
        entry.personId || entry.PersonId || entry.personID || entry.PersonID || entry.id || entry.ID
      );
      if (!personId || personId === normalizedId) return null;
      return buildAdditionalCustomer(buildCustomerFromEntry(entry, personId));
    })
    .filter((item): item is AdditionalCustomer => Boolean(item));

  const uniqueAdditional = Array.from(
    new Map(additionalCustomers.map((item) => [String(item.personId), item])).values()
  );

  return { primaryCustomer, additionalCustomers: uniqueAdditional, priorConditionById, specialDiscountById };
};

export const getQueryParam = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const GET_BY_IDU_AFFILIATES = new Set(["902", "1282", "1283", "1284", "1731"]);
export const SHOW_TRAVEL_DATE_PICKER = false;
export const CARRIED_CUSTOMERS_PARAM = "carryCustomers";
export const CARRIED_CUSTOMERS_STORAGE_KEY = "buyinsnew_carry_customers";
export const SPECIAL_DISCOUNT_AFF_TO_PERCENT: Record<string, string> = {
  "1282": "10",
  "1283": "15",
  "1284": "20",
};

export const encodeCarriedCustomers = (payload: CarriedCustomersPayload) => {
  try {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  } catch {
    return "";
  }
};

export const decodeCarriedCustomers = (encoded: string): CarriedCustomersPayload | null => {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const json = decodeURIComponent(escape(atob(normalized + padding)));
    const parsed = JSON.parse(json);
    return normalizeCarriedCustomersPayload(parsed);
  } catch {
    return null;
  }
};

export const normalizeCarriedCustomersPayload = (payload: unknown): CarriedCustomersPayload | null => {
  if (!payload || typeof payload !== "object") return null;
  const parsed = payload as Partial<CarriedCustomersPayload>;
  if (!Array.isArray(parsed.customers)) return null;
  const customers = parsed.customers
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || ""),
      gender: item.gender === "M" || item.gender === "F" ? item.gender : "",
      firstNameHe: String(item.firstNameHe || ""),
      lastNameHe: String(item.lastNameHe || ""),
      firstNameEn: String(item.firstNameEn || ""),
      lastNameEn: String(item.lastNameEn || ""),
      birthDate: String(item.birthDate || ""),
      email: String(item.email || ""),
      phone: String(item.phone || ""),
    }));
  if (customers.length === 0) return null;
  return {
    id: String(parsed.id || customers[0]?.id || ""),
    customers,
  };
};

export const isGetByIdULink = (params: URLSearchParams) => {
  const affValue = getQueryParam(params, ["aff", "shatapId", "id"]);
  return affValue ? GET_BY_IDU_AFFILIATES.has(affValue) : false;
};

export const normalizeDateForHarel = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    return trimmed;
  }
  const iso = fmtDateToInput(trimmed);
  return iso ? isoToDDMMYYYY(iso) : trimmed;
};

export const queryDateToIso = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    return ddmmyyyyToISO(trimmed) || "";
  }
  return fmtDateToInput(trimmed) || "";
};

export const birthDateParts = (value: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  const iso = trimmed.includes("/") ? ddmmyyyyToISO(trimmed) : fmtDateToInput(trimmed);
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return { day, month, year };
};

export const genderToHarel = (gender: "M" | "F" | "") => {
  if (gender === "M") return "1";
  if (gender === "F") return "2";
  return "";
};

export const sanitizeNameInput = (value: string) => {
  return value.replace(/['\u05F3\u05F4]/g, "");
};

export const sanitizeHarelName = (value: string) => {
  return sanitizeNameInput(value).trim();
};

/** ========= Shared flow helpers (used by BuyInsNew and PurchaseV2) ========= */

export type PersonLookupResult =
  | {
      status: "found";
      customer: CustomerForm;
      additional: AdditionalCustomer[];
    }
  | { status: "notfound" }
  | { status: "error"; message: string };

/**
 * CRM lookup by Israeli ID, same requests and mapping as the current purchase form:
 * GetMyPolicies when the visitor signed in via OTP (auth_tokens in sessionStorage),
 * otherwise GetByPersonId. (GetByIdU is only for partner links and stays in BuyInsNew.)
 */
export const lookupPersonById = async (rawId: string, signal?: AbortSignal): Promise<PersonLookupResult> => {
  const normalizedId = normalizeIdValue(rawId);
  let accessToken: string | undefined;
  try {
    const stored = sessionStorage.getItem("auth_tokens");
    accessToken = stored ? JSON.parse(stored)?.accessToken : undefined;
  } catch {
    accessToken = undefined;
  }

  const res = accessToken
    ? await fetch(`${API_BASE_URL}/api/policy/GetMyPolicies`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal,
      })
    : await fetch(`${API_BASE_URL}/api/policy/GetByPersonId?personId=${encodeURIComponent(normalizedId)}`, {
        cache: "no-store",
        signal,
      });

  const text = await res.text();
  if (!res.ok) {
    return { status: "error", message: text && text.length < 200 ? text : "שגיאה בבדיקה" };
  }
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  let customer: CustomerForm | null = null;
  let additional: AdditionalCustomer[] = [];
  if (accessToken) {
    const mapped = mapPoliciesToCustomers(payload, normalizedId);
    customer = mapped.primaryCustomer;
    additional = mapped.additionalCustomers;
  } else if (Array.isArray(payload)) {
    const mapped = mapPeopleResponseToCustomers(payload, normalizedId);
    customer = mapped.primaryCustomer;
    additional = mapped.additionalCustomers;
  } else if (payload && typeof payload === "object") {
    const single = buildCustomerFromEntry(payload as Record<string, unknown>, normalizedId);
    customer = single.id ? single : null;
  }

  if (!customer) return { status: "notfound" };
  return {
    status: "found",
    customer: { ...customer, id: normalizedId },
    additional: additional.filter((c) => {
      const cid = normalizeIdValue(c.personId);
      return cid !== normalizedId && cid.length === 9;
    }),
  };
};

// Same credential the current form already sends from the browser for partner links.
// TODO: move GetByIdU behind a server-side proxy so the password isn't in the client bundle.
const GET_BY_IDU_PASS = "Admin$123";

/** People insured on the customer's past policies (GetByIdU), used to offer family members. */
const fetchPolicyHistory = async (normalizedId: string, signal?: AbortSignal) => {
  const res = await fetch(
    `${API_BASE_URL}/api/policy/GetByIdU?id=${encodeURIComponent(normalizedId)}&pass=${GET_BY_IDU_PASS}`,
    { cache: "no-store", signal },
  );
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return mapPoliciesToCustomers(text ? JSON.parse(text) : null, normalizedId);
  } catch {
    return null;
  }
};

export type TravelerHistory = {
  /** The main traveler as found on past policies (fallback when GetByPersonId has nothing) */
  primaryCustomer: CustomerForm | null;
  /** Everyone else insured on past policies (family is filtered by the caller) */
  additional: AdditionalCustomer[];
  priorConditionById: Record<string, PriorConditionInfo>;
  specialDiscountById: Record<string, SpecialDiscountInfo>;
};

/**
 * The customer's past policies (GetByIdU): people to offer as family, plus prior-condition
 * and last-discount info. Slow for customers with many policies, so the new flow calls it
 * in the background after showing the GetByPersonId result. GetByPersonId alone returns
 * only the person, so this is where family members come from.
 */
export const fetchTravelerHistory = async (rawId: string, signal?: AbortSignal): Promise<TravelerHistory | null> => {
  const normalizedId = normalizeIdValue(rawId);
  const history = await fetchPolicyHistory(normalizedId, signal);
  if (!history) return null;
  return {
    primaryCustomer: history.primaryCustomer ? { ...history.primaryCustomer, id: normalizedId } : null,
    additional: history.additionalCustomers.filter((c) => {
      const cid = normalizeIdValue(c.personId);
      return cid !== normalizedId && cid.length === 9;
    }),
    priorConditionById: history.priorConditionById,
    specialDiscountById: history.specialDiscountById,
  };
};

/**
 * Prior-condition fallback: when someone's status is unknown (their latest policy came without
 * riders), look that policy up by its policy ID. The current form does this for the main
 * traveler only and blocks on it; it can take ~15s, so the new flow runs it in the background
 * for every unknown traveler (one request per distinct policy, in parallel).
 */
export const resolveUnknownPriorConditions = async (
  priorConditionById: Record<string, PriorConditionInfo>,
  specialDiscountById: Record<string, SpecialDiscountInfo>,
  signal?: AbortSignal,
) => {
  const unknownPolicyIds = Array.from(
    new Set(
      Object.values(priorConditionById)
        .filter((info) => info.status === "unknown" && info.policyId)
        .map((info) => info.policyId as string),
    ),
  ).slice(0, 8);
  let prior = priorConditionById;
  let discount = specialDiscountById;
  const lookups = await Promise.all(unknownPolicyIds.map((pid) => fetchPolicyHistory(pid, signal).catch(() => null)));
  lookups.forEach((byPolicy) => {
    if (!byPolicy) return;
    prior = mergePriorConditionMaps(prior, byPolicy.priorConditionById);
    discount = mergeSpecialDiscountMaps(discount, byPolicy.specialDiscountById);
  });
  return { priorConditionById: prior, specialDiscountById: discount };
};

/** Same per-traveler rules as the current form's validateForm (email/phone required from age 18). */
export const validateTraveler = (customer: CustomerForm, otherIds: string[]): string[] => {
  const errors: string[] = [];
  if (!customer.gender) errors.push("מין הנוסע הוא שדה חובה");

  const cleanId = customer.id.replace(/[^\d]/g, "");
  if (!cleanId) errors.push("תעודת זהות היא שדה חובה");
  else if (cleanId.length !== 9) errors.push("תעודת זהות חייבת להכיל 9 ספרות");
  else if (!isValidIsraeliId(cleanId)) errors.push("תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת");
  else if (otherIds.map(normalizeIdValue).includes(normalizeIdValue(cleanId))) errors.push("תעודת זהות זו כבר קיימת אצל נוסע אחר");

  if (!customer.birthDate.trim()) errors.push("תאריך לידה הוא שדה חובה");
  if (!customer.firstNameEn.trim()) errors.push("שם פרטי באנגלית הוא שדה חובה");
  if (!customer.lastNameEn.trim()) errors.push("שם משפחה באנגלית הוא שדה חובה");

  const age = calculateAge(customer.birthDate);
  if (age === null || age >= 18) {
    if (!customer.email.trim()) errors.push("דואר אלקטרוני הוא שדה חובה לנוסעים מעל גיל 18");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) errors.push("דואר אלקטרוני לא תקין");
    if (!customer.phone.trim()) errors.push("טלפון נייד הוא שדה חובה לנוסעים מעל גיל 18");
    else if (customer.phone.replace(/[^\d]/g, "").length < 9) errors.push("טלפון נייד חייב להכיל לפחות 9 ספרות");
  }
  return errors;
};

export type HarelHandoff = {
  aid: string;
  /** dd/mm/yyyy or yyyy-mm-dd */
  from?: string;
  to?: string;
  docket?: string;
  returnUrl?: string;
  customers: CustomerForm[];
};

/** Harel bridge URL with the exact parameters the current form sends. */
export const buildHarelUrl = ({ aid, from, to, docket, returnUrl, customers }: HarelHandoff) => {
  const activeCustomers = customers.filter((c) => c.id && c.id.trim());
  const harelParams = new URLSearchParams();
  harelParams.set("Goto", "true");
  harelParams.set("aid", aid);
  harelParams.set("Nosim", String(activeCustomers.length));
  if (from) harelParams.set("From", normalizeDateForHarel(from));
  if (to) harelParams.set("To", normalizeDateForHarel(to));
  harelParams.set("Docket", docket || "0");
  if (returnUrl) harelParams.set("Return", returnUrl);

  activeCustomers.forEach((customer, index) => {
    const idx = index + 1;
    const birthParts = birthDateParts(customer.birthDate);
    harelParams.set(`NosGndr${idx}`, genderToHarel(customer.gender));
    harelParams.set(`NoshTz${idx}`, normalizeIdValue(customer.id));
    if (birthParts) {
      harelParams.set(`NosDay${idx}`, birthParts.day);
      harelParams.set(`NosMonth${idx}`, birthParts.month);
      harelParams.set(`NosYear${idx}`, birthParts.year);
    }
    harelParams.set(`NosPhone${idx}`, String(customer.phone || "").replace(/[^\d]/g, ""));
    harelParams.set(`NosMail${idx}`, customer.email || "");
    harelParams.set(`NosHebNameF${idx}`, sanitizeHarelName(customer.firstNameHe || ""));
    harelParams.set(`NosHebNameL${idx}`, sanitizeHarelName(customer.lastNameHe || ""));
    harelParams.set(`NosEngNameF${idx}`, sanitizeHarelName(customer.firstNameEn || ""));
    harelParams.set(`NosEngNameL${idx}`, sanitizeHarelName(customer.lastNameEn || ""));
  });

  return `https://ophirbit.co.il/harel/?${harelParams.toString()}`;
};

/**
 * Partner (shatap) display name for an aff code, from the same handler the current form uses
 * (api-shatap.ashx on the IIS server, CORS-enabled). Returns "" when unknown.
 */
export const fetchShatapName = async (aff: string, signal?: AbortSignal): Promise<string> => {
  if (!aff) return "";
  try {
    const res = await fetch(`https://ophir.travelsure.co.il/api-shatap.ashx?id=${encodeURIComponent(aff)}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { name?: unknown };
    return typeof data?.name === "string" ? data.name.trim() : "";
  } catch {
    return "";
  }
};
