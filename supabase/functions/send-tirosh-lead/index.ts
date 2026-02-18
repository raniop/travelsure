import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const data = await req.json();
    const { fullName, phone, birthDate, idNumber, notes } = data;

    if (!fullName || !phone || !birthDate || !idNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safe = (v: string) => escapeHtml(String(v ?? ""));

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f4b46 0%, #2f6b63 100%); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">ליד חדש - תירוש</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #555; width: 40%;"><strong>שם מלא:</strong></td>
              <td style="padding: 8px 0;">${safe(fullName)}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding: 8px 0; color: #555;"><strong>טלפון:</strong></td>
              <td style="padding: 8px 0;">${safe(phone)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #555;"><strong>תאריך לידה:</strong></td>
              <td style="padding: 8px 0;">${safe(birthDate)}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding: 8px 0; color: #555;"><strong>תעודת זהות:</strong></td>
              <td style="padding: 8px 0;">${safe(idNumber)}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="padding: 8px 0; color: #555; vertical-align: top;"><strong>הערות:</strong></td>
              <td style="padding: 8px 0; background:#fff; border-radius:4px; white-space:pre-wrap;">${safe(notes)}</td>
            </tr>` : ""}
          </table>
        </div>
        <p style="color:#999; font-size:11px; text-align:center; margin-top:16px;">
          נשלח מטופס תירוש - TravelSure
        </p>
      </div>
    `;

    const recipients = [
      "y@tiroche-ins.com",
      "rani@ophirins.co.il",
      "eli@ophirins.co.il",
      "ophir@ophirins.co.il",
    ];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TravelSure <no-reply@send.travelsure.co.il>",
        to: recipients,
        subject: `ליד חדש - תירוש: ${fullName}`,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error:", errText);
      throw new Error("Email service error");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error in send-tirosh-lead:", err);
    return new Response(
      JSON.stringify({ error: "Unable to send message. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
