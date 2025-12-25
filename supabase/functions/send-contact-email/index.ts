import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TravelSure <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-contact-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactEmailRequest = await req.json();
    
    console.log("Received contact form submission:", { name, email, phone });

    // Validate input
    if (!name || !email || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send notification email to business
    const businessEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a5a5a;">פנייה חדשה מהאתר</h1>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <p><strong>שם:</strong> ${name}</p>
          <p><strong>אימייל:</strong> ${email}</p>
          <p><strong>טלפון:</strong> ${phone || "לא צוין"}</p>
          <p><strong>הודעה:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 5px;">${message}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          הודעה זו נשלחה מטופס יצירת קשר באתר TravelSure
        </p>
      </div>
    `;

    await sendEmail(["ophir@ophirins.co.il"], `פנייה חדשה מ-${name}`, businessEmailHtml);
    console.log("Business notification email sent");

    // Send confirmation email to customer
    const customerEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">TravelSure</h1>
          <p style="color: #4ade80; margin: 10px 0 0 0;">ביטוח נסיעות לחו״ל</p>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #1a5a5a;">שלום ${name},</h2>
          <p>תודה שפנית אלינו!</p>
          <p>קיבלנו את הודעתך ונחזור אליך בהקדם האפשרי.</p>
          <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>ההודעה שלך:</strong></p>
            <p style="color: #666;">${message}</p>
          </div>
          <p>בינתיים, אתה מוזמן ליצור איתנו קשר:</p>
          <ul style="color: #666;">
            <li>טלפון: 073-2721111</li>
            <li>וואטסאפ: 052-3333603</li>
          </ul>
          <p>בברכה,<br>צוות TravelSure</p>
        </div>
        <div style="background-color: #1a5a5a; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} TravelSure - אופיר ושות׳ סוכנות לביטוח
          </p>
        </div>
      </div>
    `;

    await sendEmail([email], "קיבלנו את פנייתך - TravelSure", customerEmailHtml);
    console.log("Customer confirmation email sent");

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
