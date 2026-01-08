import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeGender(g: unknown): "M" | "F" | "" {
  if (typeof g === "number") {
    if (g === 1) return "M";
    if (g === 2) return "F";
    return "";
  }

  const s = String(g ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s === "m" || s === "male" || s === "זכר" || s === "1") return "M";
  if (s === "f" || s === "female" || s === "נקבה" || s === "2") return "F";
  return "";
}

function normalizeDate(d: unknown): string {
  const s = String(d ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim();

    if (!/^\d{5,9}$/.test(id)) {
      return new Response(
        JSON.stringify({ error: "Invalid id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upstreamUrl = `https://mobile.ophirins.co.il/api/Policy/GetById?id=${encodeURIComponent(id)}`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstreamRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await upstreamRes.json();
    const policies = Array.isArray(data) ? data : [];

    policies.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const ad = new Date(String(a.issueDate || 0)).getTime();
      const bd = new Date(String(b.issueDate || 0)).getTime();
      return bd - ad;
    });

    const normalizedId = id.padStart(9, "0");
    const idWithoutPadding = id.trim();

    let foundCustomer: Record<string, unknown> | null = null;

    for (const policy of policies) {
      if (Array.isArray(policy.customers)) {
        for (const cust of policy.customers) {
          const custIdRaw = String(cust?.personId || "").trim();
          const custIdPadded = custIdRaw.padStart(9, "0");

          if (custIdPadded === normalizedId || custIdRaw === idWithoutPadding) {
            foundCustomer = cust;
            break;
          }
        }
        if (foundCustomer) break;
      }
    }

    const primaryName = foundCustomer?.clientName || foundCustomer?.name || foundCustomer?.fullName || null;

    const firstNameHe = foundCustomer?.firstName || foundCustomer?.firstNameHe || foundCustomer?.firstNameHeb || foundCustomer?.hebFname || foundCustomer?.fname || "";
    const lastNameHe = foundCustomer?.lastName || foundCustomer?.lastNameHe || foundCustomer?.lastNameHeb || foundCustomer?.hebLname || foundCustomer?.lname || "";
    const firstNameEn = foundCustomer?.firstNameEn || foundCustomer?.firstNameEng || foundCustomer?.firstNameEnglish || foundCustomer?.firstNameLatin || foundCustomer?.engFname || foundCustomer?.fnameEn || "";
    const lastNameEn = foundCustomer?.lastNameEn || foundCustomer?.lastNameEng || foundCustomer?.lastNameEnglish || foundCustomer?.lastNameLatin || foundCustomer?.engLname || foundCustomer?.lnameEn || "";
    const email = foundCustomer?.email || foundCustomer?.mail || foundCustomer?.eMail || foundCustomer?.emailAddress || "";
    const phone = foundCustomer?.phone || foundCustomer?.mobile || foundCustomer?.cell || foundCustomer?.tel || foundCustomer?.telephone || "";
    const birthDate = foundCustomer?.birthDate || foundCustomer?.dateOfBirth || foundCustomer?.dob || foundCustomer?.bDate || "";
    const gender = foundCustomer?.sexType || foundCustomer?.gender || foundCustomer?.sex || foundCustomer?.sexCode || "";

    const customer = {
      id,
      primaryName: primaryName ? String(primaryName) : "",
      firstNameHe: firstNameHe ? String(firstNameHe) : "",
      lastNameHe: lastNameHe ? String(lastNameHe) : "",
      gender: normalizeGender(gender),
      birthDate: normalizeDate(birthDate),
      email: email ? String(email) : "",
      phone: phone ? String(phone) : "",
      firstNameEn: firstNameEn ? String(firstNameEn) : "",
      lastNameEn: lastNameEn ? String(lastNameEn) : "",
    };

    const summarized = policies.slice(0, 12).map((p: Record<string, unknown>) => ({
      fullPolicyID: p.fullPolicyID,
      issueDate: p.issueDate,
      startDate: p.startDate,
      endDate: p.endDate,
      areaName: p.areaName,
      totalCustomers: p.totalCustomers,
      total: p.total,
      clientName: p.clientName,
    }));

    const allCustomers: Record<string, unknown>[] = [];
    const seenIds = new Set<string>();

    for (const policy of policies) {
      if (Array.isArray(policy.customers)) {
        for (const cust of policy.customers) {
          const custId = String(cust?.personId || "").trim();
          if (custId && !seenIds.has(custId)) {
            seenIds.add(custId);

            const custFirstNameHe = cust.firstName || cust.firstNameHe || cust.firstNameHeb || cust.hebFname || "";
            const custLastNameHe = cust.lastName || cust.lastNameHe || cust.lastNameHeb || cust.hebLname || "";
            const custFullName = cust.clientName || "";
            const split = (!custFirstNameHe && !custLastNameHe && custFullName)
              ? { first: custFullName.split(/\s+/)[0] || "", last: custFullName.split(/\s+/).slice(1).join(" ") || "" }
              : { first: custFirstNameHe, last: custLastNameHe };

            allCustomers.push({
              personId: custId,
              primaryName: custFullName || `${split.first} ${split.last}`.trim(),
              firstNameHe: split.first,
              lastNameHe: split.last,
              firstNameEn: cust.firstNameEn || cust.firstNameEng || cust.firstNameEnglish || cust.firstNameLatin || cust.engFname || "",
              lastNameEn: cust.lastNameEn || cust.lastNameEng || cust.lastNameEnglish || cust.lastNameLatin || cust.engLname || "",
              gender: normalizeGender(cust.sexType || cust.gender || cust.sex),
              birthDate: normalizeDate(cust.birthDate || cust.dateOfBirth || cust.dob || cust.bDate),
              email: String(cust.email || cust.mail || cust.eMail || cust.emailAddress || ""),
              phone: String(cust.phone || cust.mobile || cust.cell || cust.tel || cust.telephone || ""),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        found: foundCustomer !== null,
        id,
        primaryName,
        policiesCount: policies.length,
        policies: summarized,
        customer,
        allCustomers,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
