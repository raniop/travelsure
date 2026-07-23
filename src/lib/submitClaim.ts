import { supabase } from "@/integrations/supabase/client";

const OPHIR_CLAIM_ENDPOINTS = [
  "https://ophir.travelsure.co.il/api-claim.ashx",
  "https://ophir.travelsure.co.il/api-claim.php",
];

const STAFF_NOTIFY = ["rani@ophirins.co.il", "eli@ophirins.co.il"] as const;

export const generateClaimNumber = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TS-${y}${m}${day}-${rand}`;
};

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

const buildClaimMessage = (payload: Record<string, unknown>, files: File[], claimNumber: string) => {
  const lines: string[] = [
    "=== תביעה חדשה מטופס TravelSure ===",
    `מספר תביעה: ${claimNumber}`,
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

type InvokeResult = { ok: boolean; mode?: string };

/** Submit claim via live Supabase contact function (CORS-safe). Always notifies Rani + Eli. */
export async function submitClaimRequest(payload: Record<string, unknown>, files: File[]) {
  const claimNumber = String(payload.claimNumber || generateClaimNumber());
  const fullPayload = { ...payload, claimNumber };

  const filesPayload = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      contentBase64: await fileToBase64(file),
    }))
  );

  const message = buildClaimMessage(fullPayload, files, claimNumber);

  const tryInvoke = async (body: Record<string, unknown>): Promise<InvokeResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", { body });
      if (!error && data && !(data as { error?: string }).error) {
        return { ok: true, mode: String((data as { mode?: string }).mode || "") };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const primary = await tryInvoke({
    type: "claim",
    claimNumber,
    name: String(fullPayload.fullName || "תביעה"),
    email: String(fullPayload.email || ""),
    phone: String(fullPayload.mobile || fullPayload.phone || ""),
    message,
    claimPayload: fullPayload,
    files: filesPayload,
  });

  // Old deployed function only emails ophir@. Fan-out claim text to Rani + Eli explicitly.
  if (primary.ok && primary.mode !== "claim") {
    await Promise.all(
      STAFF_NOTIFY.map((staffEmail) =>
        tryInvoke({
          name: `תביעה ${claimNumber} — ${String(fullPayload.fullName || "")}`.trim(),
          email: staffEmail,
          phone: String(fullPayload.mobile || fullPayload.phone || ""),
          message,
        })
      )
    );
  }

  if (primary.ok) {
    return { ok: true as const, claimNumber };
  }

  // If primary failed, still try to notify staff directly.
  const staffOk = await Promise.all(
    STAFF_NOTIFY.map((staffEmail) =>
      tryInvoke({
        name: `תביעה ${claimNumber} — ${String(fullPayload.fullName || "")}`.trim(),
        email: staffEmail,
        phone: String(fullPayload.mobile || fullPayload.phone || ""),
        message,
      })
    )
  );
  if (staffOk.some((r) => r.ok)) {
    return { ok: true as const, claimNumber };
  }

  const body = new FormData();
  body.append("payload", JSON.stringify(fullPayload));
  files.forEach((file) => body.append("files[]", file));

  let lastError = "claim submit failed";
  for (const url of OPHIR_CLAIM_ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body });
      if (res.ok) return { ok: true as const, claimNumber };
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "network error";
    }
  }

  return { ok: false as const, error: lastError, claimNumber };
}
