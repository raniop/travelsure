import { NextResponse } from "next/server";

// פונקציה לפיענוח HTML entities בצד השרת
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    // קריאת ה-XML מהקישור
    const xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
    
    // יצירת AbortController ל-timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 שניות timeout (מהיר יותר)

    const response = await fetch(xmlUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch XML" },
        { status: 502 }
      );
    }

    // ⚡ נחפש את ה-ID ישירות ב-XML בלי לטעון את כל הטקסט קודם
    // זה יכול להיות מהיר יותר אם ה-ID נמצא בתחילת ה-XML
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: "Failed to read response" },
        { status: 500 }
      );
    }

    const decoder = new TextDecoder();
    let xmlBuffer = '';
    let foundShatap: { id: string; name: string } | null = null;
    const targetId = id.trim();

    // נחפש את ה-ID תוך כדי קריאת ה-XML (streaming)
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        xmlBuffer += decoder.decode(value, { stream: true });
        
        // נחפש את ה-ID בכל פעם שיש לנו עוד נתונים
        // regex למציאת ShatapItem עם ה-ID המבוקש
        const itemRegex = new RegExp(
          `<ShatapItem>\\s*<Id>\\s*${targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</Id>\\s*<Name>(.*?)</Name>\\s*</ShatapItem>`,
          'is'
        );
        const match = xmlBuffer.match(itemRegex);
        
        if (match && match[1]) {
          const itemName = match[1].trim();
          if (itemName) {
            const decodedName = decodeHtmlEntities(itemName);
            foundShatap = { id: targetId, name: decodedName };
            reader.cancel(); // נעצור את הקריאה מיד כשמצאנו
            break;
          }
        }

        // אם ה-buffer גדול מדי, נשמור רק את החלק האחרון (למקרה שה-XML גדול)
        if (xmlBuffer.length > 100000) {
          xmlBuffer = xmlBuffer.slice(-50000);
        }
      }
    } catch (error) {
      // אם יש שגיאה ב-streaming, ננסה את השיטה הישנה
      console.warn("Streaming failed, falling back to full text parsing");
    }

    // אם לא מצאנו ב-streaming, נחפש בכל ה-xmlBuffer שכבר טענו
    if (!foundShatap && xmlBuffer) {
      const itemRegex = /<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/gs;
      let match;

      while ((match = itemRegex.exec(xmlBuffer)) !== null) {
        const itemId = match[1]?.trim() || "";
        const itemName = match[2]?.trim() || "";

        if (!itemId || !itemName) {
          continue;
        }

        if (itemId === targetId) {
          const decodedName = decodeHtmlEntities(itemName);
          foundShatap = { id: itemId, name: decodedName };
          break;
        }
      }
    }

    if (!foundShatap) {
      return NextResponse.json(
        { error: "Shatap not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: foundShatap.id,
      name: foundShatap.name,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout - השרת לא הגיב בזמן" },
        { status: 504 }
      );
    }
    console.error("Error fetching shatap:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
