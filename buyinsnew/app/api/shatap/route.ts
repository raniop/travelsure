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
    const response = await fetch(xmlUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch XML" },
        { status: 502 }
      );
    }

    const xmlText = await response.text();

    // פארסינג ה-XML ידנית
    // ה-XML מגיע בפורמט: <ShatapItem><Id>770</Id><Name>Nira Lizra</Name></ShatapItem>
    // נחפש את כל ה-ShatapItem ונמצא את זה עם ה-ID המתאים
    
    // regex למציאת כל ה-ShatapItem (מתמודד גם עם רווחים ושורות חדשות)
    const itemRegex = /<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/gs;
    let match;
    let foundShatap: { id: string; name: string } | null = null;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemId = match[1]?.trim() || "";
      const itemName = match[2]?.trim() || "";

      // מדלג על רשומות עם ID או שם ריק
      if (!itemId || !itemName) {
        continue;
      }

      if (itemId === id) {
        // מפענח HTML entities בשם
        const decodedName = decodeHtmlEntities(itemName);
        foundShatap = { id: itemId, name: decodedName };
        break;
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
  } catch (error) {
    console.error("Error fetching shatap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
