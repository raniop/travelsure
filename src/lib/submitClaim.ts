import { supabase } from "@/integrations/supabase/client";

const OPHIR_CLAIM_ENDPOINTS = [
  "https://ophir.travelsure.co.il/api-claim.ashx",
  "https://ophir.travelsure.co.il/api-claim.php",
];

const STAFF_NOTIFY = ["rani@ophirins.co.il", "eli@ophirins.co.il"] as const;

/** Display fallback only — authoritative number is allocated by the edge function. */
export const generateClaimNumber = () => {
  const year = new Date().getFullYear();
  return `${year}${String(Date.now()).slice(-4)}`;
};

/**
 * Prefer server-side allocation (edge function → next_claim_number).
 * Client RPC is used only when we need a number before invoke (rare fallback path).
 */
export async function allocateClaimNumber(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const { data, error } = await supabase.rpc("next_claim_number", { p_year: year });
    if (!error && data) return String(data);
  } catch (err) {
    console.error("allocateClaimNumber failed:", err);
  }
  return generateClaimNumber();
}

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
  const multiline = ["=== תביעה חדשה מטופס TravelSure ===", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const compact = rows.map(([k, v]) => `• ${k}: ${v}`).join("   |   ");
  return `${multiline}\n\n---\n${compact}`.slice(0, 4800);
};

type InvokeResult = { ok: boolean; mode?: string; claimNumber?: string };

/** Submit claim via live Supabase contact function (CORS-safe). Always notifies Rani + Eli. */
export async function submitClaimRequest(payload: Record<string, unknown>, files: File[]) {
  // Leave claimNumber empty so the edge function allocates 20260001, 20260002, ...
  const pendingNumber = String(payload.claimNumber || "").trim();
  const fullPayload = { ...payload };
  if (pendingNumber) fullPayload.claimNumber = pendingNumber;
  else delete fullPayload.claimNumber;

  const attachments = await Promise.all(
    files.map(async (file) => {
      const content = await fileToBase64(file);
      return {
        name: file.name,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        type: file.type || "application/octet-stream",
        contentBase64: content,
        content,
      };
    })
  );

  const messagePlaceholder = pendingNumber || "יוקצה בעת השליחה";
  const message = buildClaimMessage(fullPayload, files, messagePlaceholder);

  const tryInvoke = async (body: Record<string, unknown>): Promise<InvokeResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", { body });
      if (!error && data && !(data as { error?: string }).error) {
        return {
          ok: true,
          mode: String((data as { mode?: string }).mode || ""),
          claimNumber: String((data as { claimNumber?: string }).claimNumber || ""),
        };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const primary = await tryInvoke({
    mode: "claim",
    type: "claim",
    ...(pendingNumber ? { claimNumber: pendingNumber } : {}),
    name: String(fullPayload.fullName || "תביעה"),
    email: String(fullPayload.email || ""),
    phone: String(fullPayload.mobile || fullPayload.phone || ""),
    message,
    claimPayload: fullPayload,
    files: attachments,
    attachments: attachments.map((f) => ({
      filename: f.filename,
      content: f.content,
      type: f.type,
    })),
  });

  let resolvedNumber = primary.claimNumber || pendingNumber;
  if (!resolvedNumber) {
    resolvedNumber = await allocateClaimNumber();
  }

  // Old deployed function only emails ophir@. Fan-out claim text to Rani + Eli explicitly.
  if (primary.ok && primary.mode !== "claim") {
    const fanoutMessage = buildClaimMessage(fullPayload, files, resolvedNumber);
    await Promise.all(
      STAFF_NOTIFY.map((staffEmail) =>
        tryInvoke({
          name: `תביעה ${resolvedNumber} — ${String(fullPayload.fullName || "")}`.trim(),
          email: staffEmail,
          phone: String(fullPayload.mobile || fullPayload.phone || ""),
          message: fanoutMessage,
        })
      )
    );
  }

  if (primary.ok) {
    return { ok: true as const, claimNumber: resolvedNumber };
  }

  const staffMessage = buildClaimMessage(fullPayload, files, resolvedNumber);
  const staffOk = await Promise.all(
    STAFF_NOTIFY.map((staffEmail) =>
      tryInvoke({
        name: `תביעה ${resolvedNumber} — ${String(fullPayload.fullName || "")}`.trim(),
        email: staffEmail,
        phone: String(fullPayload.mobile || fullPayload.phone || ""),
        message: staffMessage,
      })
    )
  );
  if (staffOk.some((r) => r.ok)) {
    return { ok: true as const, claimNumber: resolvedNumber };
  }

  const body = new FormData();
  body.append("payload", JSON.stringify({ ...fullPayload, claimNumber: resolvedNumber }));
  files.forEach((file) => body.append("files[]", file));

  let lastError = "claim submit failed";
  for (const url of OPHIR_CLAIM_ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body });
      if (res.ok) return { ok: true as const, claimNumber: resolvedNumber };
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "network error";
    }
  }

  return { ok: false as const, error: lastError, claimNumber: resolvedNumber };
}
