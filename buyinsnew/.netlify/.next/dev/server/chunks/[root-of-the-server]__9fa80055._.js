module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/travelsure-1/buyinsnew/app/api/shatap/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/travelsure-1/buyinsnew/node_modules/next/server.js [app-route] (ecmascript)");
;
// פונקציה לפיענוח HTML entities בצד השרת
function decodeHtmlEntities(text) {
    return text.replace(/&#(\d+);/g, (_, dec)=>String.fromCharCode(parseInt(dec, 10))).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Missing id parameter"
        }, {
            status: 400
        });
    }
    try {
        // קריאת ה-XML מהקישור
        const xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
        // יצירת AbortController ל-timeout - הוקטן ל-3 שניות לביצועים טובים יותר
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 3000); // 3 שניות timeout
        const response = await fetch(xmlUrl, {
            cache: "no-store",
            headers: {
                Accept: "application/xml, text/xml, */*"
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to fetch XML"
            }, {
                status: 502
            });
        }
        // ⚡ נחפש את ה-ID ישירות ב-XML בלי לטעון את כל הטקסט קודם
        // זה יכול להיות מהיר יותר אם ה-ID נמצא בתחילת ה-XML
        const reader = response.body?.getReader();
        if (!reader) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to read response"
            }, {
                status: 500
            });
        }
        const decoder = new TextDecoder();
        let xmlBuffer = '';
        let foundShatap = null;
        const targetId = id.trim();
        // נחפש את ה-ID תוך כדי קריאת ה-XML (streaming)
        try {
            while(true){
                const { done, value } = await reader.read();
                if (done) break;
                xmlBuffer += decoder.decode(value, {
                    stream: true
                });
                // נחפש את ה-ID בכל פעם שיש לנו עוד נתונים
                // regex למציאת ShatapItem עם ה-ID המבוקש
                const itemRegex = new RegExp(`<ShatapItem>\\s*<Id>\\s*${targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</Id>\\s*<Name>(.*?)</Name>\\s*</ShatapItem>`, 'is');
                const match = xmlBuffer.match(itemRegex);
                if (match && match[1]) {
                    const itemName = match[1].trim();
                    if (itemName) {
                        const decodedName = decodeHtmlEntities(itemName);
                        foundShatap = {
                            id: targetId,
                            name: decodedName
                        };
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
            while((match = itemRegex.exec(xmlBuffer)) !== null){
                const itemId = match[1]?.trim() || "";
                const itemName = match[2]?.trim() || "";
                if (!itemId || !itemName) {
                    continue;
                }
                if (itemId === targetId) {
                    const decodedName = decodeHtmlEntities(itemName);
                    foundShatap = {
                        id: itemId,
                        name: decodedName
                    };
                    break;
                }
            }
        }
        if (!foundShatap) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Shatap not found"
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            id: foundShatap.id,
            name: foundShatap.name
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Request timeout - השרת לא הגיב בזמן"
            }, {
                status: 504
            });
        }
        console.error("Error fetching shatap:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error",
            details: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9fa80055._.js.map