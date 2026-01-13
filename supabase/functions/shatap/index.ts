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
    
    // קריאה ל-XML עם טיפול טוב יותר בשגיאות
    let xmlText: string | null = null;
    
    try {
      // ניסיון ראשון - עם timeout ארוך יותר
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 שניות
      
      const response = await fetch(xmlUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'he,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch XML", 
            status: response.status,
            statusText: response.statusText
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      xmlText = await response.text();
      
      if (!xmlText || xmlText.length === 0) {
        return new Response(
          JSON.stringify({ error: "Empty XML response" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (error: any) {
      console.error("Error fetching XML:", error);
      
      // אם יש שגיאת timeout או connection, ננסה שוב עם timeout קצר יותר
      if (error.name === 'AbortError' || error.message?.includes('reset') || error.message?.includes('timeout')) {
        try {
          const retryResponse = await fetch(xmlUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/xml, text/xml, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(8000), // 8 שניות
          });
          
          if (retryResponse.ok) {
            xmlText = await retryResponse.text();
          } else {
            return new Response(
              JSON.stringify({ 
                error: "Failed to fetch XML after retry", 
                status: retryResponse.status 
              }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (retryError: any) {
          return new Response(
            JSON.stringify({ 
              error: "Failed to fetch XML", 
              details: retryError.message 
            }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch XML", 
            details: error.message 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!xmlText) {
      return new Response(
        JSON.stringify({ error: "No XML data received" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
