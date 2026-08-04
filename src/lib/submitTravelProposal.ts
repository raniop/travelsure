import {
  DESTINATION_OPTIONS,
  PERSON_LABELS_HE,
  type PersonKey,
  type TravelProposalForm,
} from "@/lib/travelProposal/types";
import { displayName, includedPersons } from "@/lib/travelProposal/formDefaults";

const STAFF_NOTIFY = [
  "rani@ophirins.co.il",
  "eli@ophirins.co.il",
  "hadar@ophirins.co.il",
  "ophir@ophirins.co.il",
] as const;

/** Internal Ophir tracking number for travel proposals (shown to customer). */
export function createTravelProposalNumber() {
  const year = new Date().getFullYear();
  const tail = `${Date.now() % 10000}${Math.floor(Math.random() * 90 + 10)}`.padStart(6, "0").slice(0, 6);
  return `TP${year}${tail}`;
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

const yn = (v: string) => (v === "yes" ? "כן" : v === "no" ? "לא" : "");

export async function submitTravelProposal(form: TravelProposalForm, files: File[] = []) {
  const people = includedPersons(form);
  const primaryName = displayName(form.primary) || "מבוטח";
  const proposalNumber = createTravelProposalNumber();

  const destinationsLabel = form.destinations
    .map((id) => DESTINATION_OPTIONS.find((d) => d.id === id)?.labelHe || id)
    .join(", ");

  const insuredsText = people
    .map(({ key, person }) => {
      const label = PERSON_LABELS_HE[key as PersonKey];
      return `${label}: ${displayName(person)} | ת.ז ${person.idNumber} | לידה ${person.birthDate} | מין ${
        person.gender === "male" ? "זכר" : person.gender === "female" ? "נקבה" : ""
      }`;
    })
    .join("\n");

  const insuredsHtml = people
    .map(({ key, person }, i) => {
      const label = PERSON_LABELS_HE[key as PersonKey];
      const bg = i % 2 ? "#fff" : "#f8fafc";
      return `<tr style="background:${bg};"><td style="padding:8px 10px;" colspan="2"><strong>${label}</strong><br/>${displayName(
        person,
      )} · ת.ז ${person.idNumber} · ${person.birthDate}<br/>בריאות: ש1 ${yn(person.health.q1)} · ש2 ${yn(
        person.health.q2,
      )} · ש3 ${yn(person.health.q3)} · ש4 ${yn(person.health.q4)}</td></tr>`;
    })
    .join("");

  const summary = {
    proposalNumber,
    primaryName,
    tripFrom: form.tripFrom,
    tripTo: form.tripTo,
    destinationsLabel,
    countriesDetail: form.countriesDetail,
    address: [form.street, form.houseNo, form.city].filter(Boolean).join(", "),
    phone: form.phone,
    mobile: form.mobile,
    email: form.email,
    occupation: form.occupation,
    agentName: form.agentName,
    agentNo: form.agentNo,
    insuredsText,
    insuredsHtml,
    notes: form.notes,
    signatureDate: form.signatureDate,
  };

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
    }),
  );

  const payload = {
    mode: "travel-proposal",
    type: "travel-proposal",
    name: primaryName,
    fullName: primaryName,
    email: form.email,
    phone: form.mobile || form.phone,
    proposalNumber,
    subject: `הצעה לביטוח נסיעות לחו״ל · ${proposalNumber} · ${primaryName}`,
    message: `הצעה דיגיטלית לביטוח נסיעות לחו״ל · מספר פנייה ${proposalNumber} · עבור ${primaryName}, ${form.tripFrom}–${form.tripTo}`,
    notify: [...STAFF_NOTIFY],
    travelPayload: summary,
    formData: form,
    attachments,
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabaseHeaders = {
    "Content-Type": "application/json",
    ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
  };

  const endpoints: Array<{ url: string; headers?: Record<string, string> }> = [
    {
      url: `${supabaseUrl}/functions/v1/send-travel-proposal`,
      headers: supabaseHeaders,
    },
    {
      url: `${supabaseUrl}/functions/v1/send-contact-email`,
      headers: supabaseHeaders,
    },
  ];

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: endpoint.headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({ success: true }));
        return {
          ok: true as const,
          proposalNumber: String((data as { proposalNumber?: string }).proposalNumber || proposalNumber),
          data,
        };
      }
      lastError = new Error(`HTTP ${res.status} at ${endpoint.url}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("submit_failed");
}
