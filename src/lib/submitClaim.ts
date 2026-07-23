import { supabase } from "@/integrations/supabase/client";

const OPHIR_CLAIM_ENDPOINTS = [
  "https://ophir.travelsure.co.il/api-claim.ashx",
  "https://ophir.travelsure.co.il/api-claim.php",
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      if (!base64) reject(new Error("empty file"));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });

const buildClaimMessage = (payload: Record<string, unknown>, files: File[]) => {
  const lines: string[] = [
    "=== תביעה חדשה מטופס TravelSure ===",
    `סוג תביעה: ${payload.claimTypeLabel || ""}`,
    `שם: ${payload.fullName || ""}`,
    `ת.ז.: ${payload.idNumber || ""}`,
    `אימייל: ${payload.email || ""}`,
    `נייד: ${payload.mobile || payload.phone || ""}`,
    `פוליסה: ${payload.policyNumber || ""}`,
    `תאריך אירוע: ${payload.incidentDate || ""}`,
    `מדינה: ${payload.country || ""}`,
    `סכום: ${payload.totalClaimed || ""}`,
    `בנק: ${payload.bankName || ""} / סניף ${payload.branchNumber || ""} / חשבון ${payload.accountNumber || ""}`,
    "",
    "תיאור:",
    String(payload.details || ""),
    "",
    `קבצים שנבחרו (${files.length}): ${files.map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`).join(", ")}`,
  ];
  return lines.join("\n").slice(0, 4800);
};

/** Submit claim via Supabase (CORS-safe), with Ophir IIS fallback after FTP deploy. */
export async function submitClaimRequest(payload: Record<string, unknown>, files: File[]) {
  const filesPayload = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      contentBase64: await fileToBase64(file),
    }))
  );

  const tryInvoke = async (fn: string, body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (!error && data && !(data as { error?: string }).error) return true;
    return false;
  };

  if (await tryInvoke("send-claim-email", { payload, files: filesPayload })) {
    return { ok: true as const };
  }

  // Existing live function — works today for details; after Lovable publish also sends attachments.
  const contactBody = {
    type: "claim",
    name: String(payload.fullName || "תביעה"),
    email: String(payload.email || ""),
    phone: String(payload.mobile || payload.phone || ""),
    message: buildClaimMessage(payload, files),
    claimPayload: payload,
    files: filesPayload,
  };
  if (await tryInvoke("send-contact-email", contactBody)) {
    return { ok: true as const };
  }

  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  files.forEach((file) => body.append("files[]", file));

  let lastError = "claim submit failed";
  for (const url of OPHIR_CLAIM_ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body });
      if (res.ok) return { ok: true as const };
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "network error";
    }
  }

  return { ok: false as const, error: lastError };
}
