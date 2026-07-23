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
  fullPolicyID: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  areaName: string;
  clientName: string;
};

export type ClaimCrmLookupResult =
  | { ok: true; customer: ClaimCrmCustomer; policies: ClaimCrmPolicy[] }
  | { ok: false; reason: "invalid_id" | "not_found" | "network" | "upstream" };

const CRM_GET_BY_ID = "https://mobile.ophirins.co.il/api/Policy/GetById";

const normalizeDate = (d: unknown): string => {
  const s = String(d ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
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

const mapPolicy = (p: Record<string, unknown>): ClaimCrmPolicy => ({
  fullPolicyID: pickStr(p.fullPolicyID, p.policyNumber, p.policyId, p.PolicyNumber),
  issueDate: normalizeDate(p.issueDate),
  startDate: normalizeDate(p.startDate),
  endDate: normalizeDate(p.endDate),
  areaName: pickStr(p.areaName, p.destination, p.country),
  clientName: pickStr(p.clientName),
});

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
    const res = await fetch(`${CRM_GET_BY_ID}?id=${encodeURIComponent(normalizedId)}`, {
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

    const policies = policiesRaw
      .map((p: Record<string, unknown>) => mapPolicy(p))
      .filter((p) => p.fullPolicyID);

    if (!policies.length) return { ok: false, reason: "not_found" };

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
