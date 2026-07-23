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

/** Submit claim via Supabase (CORS-safe), with Ophir IIS fallback after FTP deploy. */
export async function submitClaimRequest(payload: Record<string, unknown>, files: File[]) {
  const filesPayload = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      contentBase64: await fileToBase64(file),
    }))
  );

  const { data, error } = await supabase.functions.invoke("send-claim-email", {
    body: { payload, files: filesPayload },
  });

  if (!error && data && !(data as { error?: string }).error) {
    return { ok: true as const };
  }

  // Fallback for ophir.travelsure.co.il after api-claim.ashx/php is uploaded.
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  files.forEach((file) => body.append("files[]", file));

  let lastError = error?.message || (data as { error?: string })?.error || "claim submit failed";
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
