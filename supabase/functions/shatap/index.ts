import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
    const response = await fetch(xmlUrl, {
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch XML" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();

    const itemRegex = /<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/gs;
    let match;
    let foundShatap: { id: string; name: string } | null = null;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemId = match[1]?.trim() || "";
      const itemName = match[2]?.trim() || "";

      if (!itemId || !itemName) {
        continue;
      }

      if (itemId === id) {
        const decodedName = decodeHtmlEntities(itemName);
        foundShatap = { id: itemId, name: decodedName };
        break;
      }
    }

    if (!foundShatap) {
      return new Response(
        JSON.stringify({ error: "Shatap not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: foundShatap.id,
        name: foundShatap.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching shatap:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
