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
  const rows: Array<[string, string]> = [
    ["מספר תביעה", claimNumber],
    ["סוג תביעה", String(payload.claimTypeLabel || "")],
    ["שם", String(payload.fullName || "")],
    ["ת.ז.", String(payload.idNumber || "")],
    ["אימייל", String(payload.email || "")],
    ["נייד", String(payload.mobile || payload.phone || "")],
    ["פוליסה", String(payload.policyNumber || "")],
    ["תאריך אירוע", String(payload.incidentDate || "")],
    ["מדינה", String(payload.country || "")],
    ["סכום", String(payload.totalClaimed || "")],
    [
      "בנק / סניף / חשבון",
      `${payload.bankName || ""} / ${payload.branchNumber || ""} / ${payload.accountNumber || ""}`,
    ],
    ["תיאור", String(payload.details || "")],
    [
      "קבצים",
      `${files.length}: ${files.map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`).join(", ")}`,
    ],
  ];
  // Multiline (for updated function) + compact separators (readable if HTML collapses newlines)
  const multiline = ["=== תביעה חדשה מטופס TravelSure ===", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const compact = rows.map(([k, v]) => `• ${k}: ${v}`).join("   |   ");
  return `${multiline}\n\n---\n${compact}`.slice(0, 4800);
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
