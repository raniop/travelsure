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
"[project]/travelsure-1/buyinsnew/app/api/policy-get-by-id/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/travelsure-1/buyinsnew/node_modules/next/server.js [app-route] (ecmascript)");
;
function deepFindFirst(obj, keys) {
    // מחפש בצורה רקורסיבית ערך ראשון עבור אחד מה-keys בתוך אובייקט/מערך
    const target = new Set(keys.map((k)=>k.toLowerCase()));
    const seen = new Set();
    function walk(node) {
        if (node === null || node === undefined) return undefined;
        if (typeof node !== "object") return undefined;
        if (seen.has(node)) return undefined;
        seen.add(node);
        if (Array.isArray(node)) {
            for (const item of node){
                const found = walk(item);
                if (found !== undefined) return found;
            }
            return undefined;
        }
        for (const [k, v] of Object.entries(node)){
            if (target.has(String(k).toLowerCase())) {
                if (v !== null && v !== undefined && String(v).length > 0) return v;
            }
        }
        for (const v of Object.values(node)){
            const found = walk(v);
            if (found !== undefined) return found;
        }
        return undefined;
    }
    return walk(obj);
}
function normalizeGender(g) {
    // אם זה מספר: 1 = זכר, 2 = נקבה
    if (typeof g === "number") {
        if (g === 1) return "M";
        if (g === 2) return "F";
        return "";
    }
    const s = String(g ?? "").trim().toLowerCase();
    if (!s) return "";
    if (s === "m" || s === "male" || s === "זכר" || s === "1") return "M";
    if (s === "f" || s === "female" || s === "נקבה" || s === "2") return "F";
    return "";
}
function normalizeDate(d) {
    // מחזיר YYYY-MM-DD אם אפשר
    const s = String(d ?? "").trim();
    if (!s) return "";
    // אם מגיע כמו 2025-12-04T...
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // אם מגיע כמו dd/mm/yyyy
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return s;
}
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();
    if (!/^\d{5,9}$/.test(id)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Invalid id"
        }, {
            status: 400
        });
    }
    const upstreamUrl = `https://mobile.ophirins.co.il/api/Policy/GetById?id=${encodeURIComponent(id)}`;
    // יצירת AbortController ל-timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 8000); // 8 שניות timeout
    try {
        const upstreamRes = await fetch(upstreamUrl, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!upstreamRes.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Upstream error",
                status: upstreamRes.status
            }, {
                status: 502
            });
        }
        const data = await upstreamRes.json();
        const policies = Array.isArray(data) ? data : [];
        // מיון לפי תאריך - מהחדש לישן
        policies.sort((a, b)=>{
            const ad = new Date(a.issueDate || 0).getTime();
            const bd = new Date(b.issueDate || 0).getTime();
            return bd - ad;
        });
        // ⚡ הגבלה ל-4 פוליסות אחרונות בלבד - כדי לקצר את זמן הטעינה
        const recentPolicies = policies.slice(0, 4);
        // נרמול תעודת הזהות לחיפוש - גם עם padding וגם בלי
        const normalizedId = id.padStart(9, "0");
        const idWithoutPadding = id.trim();
        // 🔎 מחפש את הלקוח הספציפי לפי תעודת זהות בתוך customers של הפוליסות (רק 4 האחרונות)
        let foundCustomer = null;
        for (const policy of recentPolicies){
            if (Array.isArray(policy.customers)) {
                for (const cust of policy.customers){
                    // מנסה כמה פורמטים של תעודת זהות
                    const custIdRaw = String(cust?.personId || "").trim();
                    const custIdPadded = custIdRaw.padStart(9, "0");
                    // השוואה בשני הפורמטים
                    if (custIdPadded === normalizedId || custIdRaw === idWithoutPadding) {
                        foundCustomer = cust;
                        break;
                    }
                }
                if (foundCustomer) break;
            }
        }
        // ✅ רק אם מצאנו לקוח עם תעודת זהות תואמת בדיוק - נשתמש בו
        // אם לא מצאנו - לא נמלא פרטים כלל
        const primaryName = foundCustomer?.clientName || foundCustomer?.name || foundCustomer?.fullName || null;
        // חילוץ פרטים רק מהלקוח שנמצא (אם יש)
        // נבדוק כמה אפשרויות של שמות שדות
        const firstNameHe = foundCustomer?.firstName || foundCustomer?.firstNameHe || foundCustomer?.firstNameHeb || foundCustomer?.hebFname || foundCustomer?.fname || "";
        const lastNameHe = foundCustomer?.lastName || foundCustomer?.lastNameHe || foundCustomer?.lastNameHeb || foundCustomer?.hebLname || foundCustomer?.lname || "";
        const firstNameEn = foundCustomer?.firstNameEn || foundCustomer?.firstNameEng || foundCustomer?.firstNameEnglish || foundCustomer?.firstNameLatin || foundCustomer?.engFname || foundCustomer?.fnameEn || "";
        const lastNameEn = foundCustomer?.lastNameEn || foundCustomer?.lastNameEng || foundCustomer?.lastNameEnglish || foundCustomer?.lastNameLatin || foundCustomer?.engLname || foundCustomer?.lnameEn || "";
        const email = foundCustomer?.email || foundCustomer?.mail || foundCustomer?.eMail || foundCustomer?.emailAddress || "";
        const phone = foundCustomer?.phone || foundCustomer?.mobile || foundCustomer?.cell || foundCustomer?.tel || foundCustomer?.telephone || "";
        const birthDate = foundCustomer?.birthDate || foundCustomer?.dateOfBirth || foundCustomer?.dob || foundCustomer?.bDate || "";
        const gender = foundCustomer?.sexType || foundCustomer?.gender || foundCustomer?.sex || foundCustomer?.sexCode || "";
        const customer = {
            id,
            primaryName: primaryName ? String(primaryName) : "",
            firstNameHe: firstNameHe ? String(firstNameHe) : "",
            lastNameHe: lastNameHe ? String(lastNameHe) : "",
            gender: normalizeGender(gender),
            birthDate: normalizeDate(birthDate),
            email: email ? String(email) : "",
            phone: phone ? String(phone) : "",
            firstNameEn: firstNameEn ? String(firstNameEn) : "",
            lastNameEn: lastNameEn ? String(lastNameEn) : ""
        };
        const summarized = recentPolicies.map((p)=>({
                fullPolicyID: p.fullPolicyID,
                issueDate: p.issueDate,
                startDate: p.startDate,
                endDate: p.endDate,
                areaName: p.areaName,
                totalCustomers: p.totalCustomers,
                total: p.total,
                clientName: p.clientName
            }));
        // אוסף את כל הלקוחות מכל הפוליסות (רק מ-4 האחרונות)
        const allCustomers = [];
        const seenIds = new Set();
        for (const policy of recentPolicies){
            if (Array.isArray(policy.customers)) {
                for (const cust of policy.customers){
                    const custId = String(cust?.personId || "").trim();
                    if (custId && !seenIds.has(custId)) {
                        seenIds.add(custId);
                        const custFirstNameHe = cust.firstName || cust.firstNameHe || cust.firstNameHeb || cust.hebFname || "";
                        const custLastNameHe = cust.lastName || cust.lastNameHe || cust.lastNameHeb || cust.hebLname || "";
                        const custFullName = cust.clientName || "";
                        const split = !custFirstNameHe && !custLastNameHe && custFullName ? {
                            first: custFullName.split(/\s+/)[0] || "",
                            last: custFullName.split(/\s+/).slice(1).join(" ") || ""
                        } : {
                            first: custFirstNameHe,
                            last: custLastNameHe
                        };
                        allCustomers.push({
                            personId: custId,
                            primaryName: custFullName || `${split.first} ${split.last}`.trim(),
                            firstNameHe: split.first,
                            lastNameHe: split.last,
                            firstNameEn: cust.firstNameEn || cust.firstNameEng || cust.firstNameEnglish || cust.firstNameLatin || cust.engFname || "",
                            lastNameEn: cust.lastNameEn || cust.lastNameEng || cust.lastNameEnglish || cust.lastNameLatin || cust.engLname || "",
                            gender: normalizeGender(cust.sexType || cust.gender || cust.sex),
                            birthDate: normalizeDate(cust.birthDate || cust.dateOfBirth || cust.dob || cust.bDate),
                            email: String(cust.email || cust.mail || cust.eMail || cust.emailAddress || ""),
                            phone: String(cust.phone || cust.mobile || cust.cell || cust.tel || cust.telephone || "")
                        });
                    }
                }
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            found: foundCustomer !== null,
            id,
            primaryName,
            policiesCount: recentPolicies.length,
            totalPoliciesCount: policies.length,
            policies: summarized,
            customer,
            allCustomers
        }, {
            status: 200
        });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Request timeout - השרת לא הגיב בזמן"
            }, {
                status: 504
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Network error",
            details: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__86f679d8._.js.map