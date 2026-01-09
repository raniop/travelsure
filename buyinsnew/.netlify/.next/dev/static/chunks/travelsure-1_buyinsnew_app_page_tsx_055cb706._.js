(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/travelsure-1/buyinsnew/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/travelsure-1/buyinsnew/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/travelsure-1/buyinsnew/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
/** ========= Utils ========= */ const BASE_PATH = "/buyinsnew";
// Helper function לנתיבי API עם basePath
function getApiPath(path) {
    // אם הנתיב כבר מתחיל ב-basePath, לא נוסיף אותו שוב
    if (path.startsWith(BASE_PATH)) return path;
    // אם הנתיב מתחיל ב-/, נוסיף את basePath
    if (path.startsWith("/")) return `${BASE_PATH}${path}`;
    // אחרת, נוסיף את basePath ו-/
    return `${BASE_PATH}/${path}`;
}
// Helper function לנתיבי תמונות/static assets עם basePath
function getAssetPath(path) {
    // אם הנתיב כבר מתחיל ב-basePath, לא נוסיף אותו שוב
    if (path.startsWith(BASE_PATH)) return path;
    // אם הנתיב מתחיל ב-/, נוסיף את basePath
    if (path.startsWith("/")) return `${BASE_PATH}${path}`;
    // אחרת, נוסיף את basePath ו-/
    return `${BASE_PATH}/${path}`;
}
function isValidIsraeliId(id) {
    const s = id.trim().padStart(9, "0");
    if (!/^\d{9}$/.test(s)) return false;
    let sum = 0;
    for(let i = 0; i < 9; i++){
        let n = Number(s[i]) * (i % 2 + 1);
        if (n > 9) n -= 9;
        sum += n;
    }
    return sum % 10 === 0;
}
function cn(...x) {
    return x.filter(Boolean).join(" ");
}
function fmtDateToInput(d) {
    if (!d) return "";
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return "";
}
function splitNameHe(full) {
    const name = (full || "").trim();
    if (!name) return {
        first: "",
        last: ""
    };
    const parts = name.split(/\s+/);
    if (parts.length === 1) return {
        first: parts[0],
        last: ""
    };
    return {
        first: parts[0],
        last: parts.slice(1).join(" ")
    };
}
function calculateAge(birthDate) {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < date.getDate()) {
        age--;
    }
    return age;
}
function sortCustomersByBirthDate(customers) {
    // ממיין קודם לפי שם משפחה, ואז לפי תאריך לידה - מהקטן לגדול (כלומר מהגדול לקטן בגיל)
    // הנוסע הראשון (index 0) נשאר במקומו
    if (customers.length <= 1) return customers;
    const [first, ...rest] = customers;
    // ממיין את השאר קודם לפי שם משפחה, ואז לפי תאריך לידה
    const sorted = [
        ...rest
    ].sort((a, b)=>{
        // קודם מיון לפי שם משפחה
        const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
        const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();
        if (lastNameA && lastNameB) {
            const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
            if (lastNameCompare !== 0) {
                return lastNameCompare;
            }
        } else if (lastNameA && !lastNameB) {
            return -1; // A קודם
        } else if (!lastNameA && lastNameB) {
            return 1; // B קודם
        }
        // אם שם המשפחה זהה או אין שם משפחה, ממיינים לפי תאריך לידה
        const dateA = a.birthDate || "";
        const dateB = b.birthDate || "";
        // אם אין תאריך לידה, מניחים אותו בסוף
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        // תאריך קטן יותר = גיל גדול יותר, אז ממיינים מהקטן לגדול
        return dateA.localeCompare(dateB);
    });
    return [
        first,
        ...sorted
    ];
}
/** ========= Types ========= */ /** ========= UI Bits ========= */ function Chip({ tone = "neutral", children }) {
    const map = {
        neutral: "bg-white/70 text-slate-700 ring-1 ring-slate-200/70",
        success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
        warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
        danger: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/70",
        info: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/70"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", map[tone]),
        children: children
    }, void 0, false, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
_c = Chip;
function FieldLabel({ required, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1 text-xs font-medium text-slate-700",
        children: [
            required ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-rose-500",
                children: "*"
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 155,
                columnNumber: 19
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: children
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 154,
        columnNumber: 5
    }, this);
}
_c1 = FieldLabel;
function Input({ dir, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        ...props,
        dir: dir,
        className: cn("w-full bg-transparent px-0 py-2 text-sm text-slate-900 text-right", "border-b border-slate-300", "placeholder:text-slate-400/60 placeholder:text-xs", "focus:outline-none focus:border-b-2 focus:border-sky-500", "transition-all duration-200", dir === "ltr" ? "text-left" : "", className)
    }, void 0, false, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_c2 = Input;
function FloatingInput({ label, dir = "rtl", className, value, type, ...props }) {
    _s();
    const inputType = type ?? "text";
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const [isFocused, setIsFocused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const shouldFloat = hasValue || isFocused;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...props,
                type: inputType,
                value: value,
                dir: dir,
                style: {
                    textAlign: dir === "ltr" ? "left" : "right",
                    direction: dir || "rtl",
                    ...props.style
                },
                onFocus: (e)=>{
                    setIsFocused(true);
                    props.onFocus?.(e);
                },
                onBlur: (e)=>{
                    setIsFocused(false);
                    props.onBlur?.(e);
                },
                className: cn("w-full h-11 bg-transparent px-0 pt-6 pb-0.5 text-sm text-slate-900", "border-b border-slate-300", "focus:outline-none focus:border-b-2 focus:border-sky-500", "transition-all duration-200", dir === "ltr" ? "text-left" : "text-right", className),
                ...inputType === "date" ? {
                    "data-has-value": hasValue ? "true" : "false"
                } : {
                    placeholder: shouldFloat ? undefined : props.placeholder || ""
                }
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: cn("absolute transition-all duration-200 pointer-events-none text-right", "right-0"),
                style: shouldFloat ? {
                    bottom: "0",
                    transform: "translateY(calc(-100% - 0.375rem))",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    lineHeight: "1rem"
                } : {
                    bottom: "0px",
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                    lineHeight: "1.25rem",
                    transform: "translateY(0)"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 232,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 200,
        columnNumber: 5
    }, this);
}
_s(FloatingInput, "taoS6m9NZex5dx3pinefKTdpShE=");
_c3 = FloatingInput;
function GenderToggle({ value, onChange }) {
    const item = (v, title)=>{
        const selected = value === v;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: ()=>onChange(v),
            className: cn("group aspect-square rounded-lg bg-white p-3 sm:p-4 text-center transition-all", "border shadow-sm hover:shadow-md flex-shrink-0 box-border", selected ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"),
            style: {
                width: "105px",
                height: "105px",
                aspectRatio: "1 / 1",
                boxSizing: "border-box"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center justify-center gap-2 h-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: cn("aspect-square h-10 w-10 sm:h-12 sm:w-12 rounded-full grid place-items-center border-2 transition-all flex-shrink-0", selected ? "border-sky-400 bg-sky-50" : "border-sky-300 bg-sky-50"),
                        "aria-hidden": "true",
                        style: {
                            aspectRatio: "1 / 1"
                        },
                        children: v === "F" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "20",
                            height: "20",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            className: "text-sky-600",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 305,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 306,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 21v-4",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 307,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M10 19h4",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 308,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                            lineNumber: 296,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "20",
                            height: "20",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            className: "text-sky-600",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 320,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 321,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                            lineNumber: 311,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 285,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm sm:text-base font-medium text-[#0b4e86]",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 325,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 284,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
            lineNumber: 272,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-2 gap-4 sm:gap-5",
        style: {
            width: "fit-content"
        },
        children: [
            item("F", "נוסעת"),
            item("M", "נוסע")
        ]
    }, void 0, true, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 334,
        columnNumber: 5
    }, this);
}
_c4 = GenderToggle;
function Home() {
    _s1();
    const [id, setId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [shatapName, setShatapName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        type: "idle",
        text: ""
    });
    const [customers, setCustomers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            id: "",
            gender: "",
            firstNameHe: "",
            lastNameHe: "",
            firstNameEn: "",
            lastNameEn: "",
            birthDate: "",
            email: "",
            phone: ""
        }
    ]);
    const [additionalCustomers, setAdditionalCustomers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedAdditionalCustomers, setSelectedAdditionalCustomers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [showAdditionalCustomersModal, setShowAdditionalCustomersModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [validationErrors, setValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [idValidationErrors, setIdValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // טעינת שם השת"פ מה-URL - מותאם לביצועים
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const loadShatapName = {
                "Home.useEffect.loadShatapName": async ()=>{
                    const params = new URLSearchParams(window.location.search);
                    const shatapId = params.get("aff") || params.get("shatapId") || params.get("id");
                    if (!shatapId) {
                        setShatapName("");
                        return;
                    }
                    // קביעת ה-URL הנכון בהתאם לסביבה
                    const isLocalhost = ("TURBOPACK compile-time value", "object") !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('lovable') || window.location.hostname.includes('lovable.dev'));
                    const apiUrl = isLocalhost ? `/api/shatap?id=${encodeURIComponent(shatapId)}` : getApiPath(`/api/shatap?id=${encodeURIComponent(shatapId)}`);
                    // fetch עם timeout קצר יותר
                    const controller = new AbortController();
                    const timeoutId = setTimeout({
                        "Home.useEffect.loadShatapName.timeoutId": ()=>controller.abort()
                    }["Home.useEffect.loadShatapName.timeoutId"], 3000); // 3 שניות timeout
                    try {
                        const res = await fetch(apiUrl, {
                            cache: "no-store",
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.name) {
                                setShatapName(data.name);
                                return;
                            }
                        }
                    } catch (error) {
                        clearTimeout(timeoutId);
                        // אם יש שגיאה, פשוט לא נציג שם שת"פ
                        if (error.name !== 'AbortError') {
                        // רק log שגיאות שאינן timeout
                        }
                    }
                    // אם נכשל, לא נציג שם שת"פ
                    setShatapName("");
                }
            }["Home.useEffect.loadShatapName"];
            loadShatapName();
        }
    }["Home.useEffect"], []);
    const chip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Home.useMemo[chip]": ()=>{
            if (status.type === "checking") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                tone: "info",
                children: "בודק במערכת…"
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 456,
                columnNumber: 44
            }, this);
            if (status.type === "ok") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                tone: "success",
                children: status.text
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 457,
                columnNumber: 38
            }, this);
            if (status.type === "notfound") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                tone: "warning",
                children: status.text
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 458,
                columnNumber: 44
            }, this);
            if (status.type === "error") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                tone: "danger",
                children: status.text
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 459,
                columnNumber: 41
            }, this);
            return null;
        }
    }["Home.useMemo[chip]"], [
        status
    ]);
    // פונקציה לניקוי שגיאות עבור נוסע מסוים
    const clearCustomerErrors = (customerIndex)=>{
        setValidationErrors((prev)=>{
            const updated = {
                ...prev
            };
            delete updated[customerIndex];
            return updated;
        });
        setIdValidationErrors((prev)=>{
            const updated = {
                ...prev
            };
            delete updated[customerIndex];
            return updated;
        });
    };
    // פונקציה לבדיקת תעודת זהות בזמן אמת
    const validateIdRealTime = (idValue, customerIndex)=>{
        const cleanId = idValue.replace(/[^\d]/g, "");
        // אם השדה ריק, אין שגיאה
        if (cleanId.length === 0) {
            setIdValidationErrors((prev)=>{
                const updated = {
                    ...prev
                };
                delete updated[customerIndex];
                return updated;
            });
            return;
        }
        // אם יש פחות מ-9 ספרות, אין שגיאה עדיין (המשתמש עדיין מקליד)
        if (cleanId.length < 9) {
            setIdValidationErrors((prev)=>{
                const updated = {
                    ...prev
                };
                delete updated[customerIndex];
                return updated;
            });
            return;
        }
        // אם יש בדיוק 9 ספרות, בודקים את תקינות התעודת זהות
        if (cleanId.length === 9) {
            if (!isValidIsraeliId(cleanId)) {
                setIdValidationErrors((prev)=>({
                        ...prev,
                        [customerIndex]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת"
                    }));
            } else {
                setIdValidationErrors((prev)=>{
                    const updated = {
                        ...prev
                    };
                    delete updated[customerIndex];
                    return updated;
                });
            }
        }
    };
    // פונקציית בדיקת שדות חובה
    const validateForm = ()=>{
        const errors = {};
        let isValid = true;
        customers.forEach((customer, index)=>{
            const customerErrors = [];
            const customerId = index === 0 ? id : customer.id;
            // בדיקת מין הנוסע
            if (!customer.gender) {
                customerErrors.push("מין הנוסע הוא שדה חובה");
                isValid = false;
            }
            // בדיקת תעודת זהות
            const cleanCustomerId = customerId.replace(/[^\d]/g, "");
            if (!customerId || customerId.trim() === "") {
                customerErrors.push("תעודת זהות היא שדה חובה");
                isValid = false;
            } else if (cleanCustomerId.length !== 9) {
                customerErrors.push("תעודת זהות חייבת להכיל 9 ספרות");
                isValid = false;
                setIdValidationErrors((prev)=>({
                        ...prev,
                        [index]: "תעודת זהות חייבת להכיל 9 ספרות"
                    }));
            } else if (!isValidIsraeliId(cleanCustomerId)) {
                customerErrors.push("תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת");
                isValid = false;
                setIdValidationErrors((prev)=>({
                        ...prev,
                        [index]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת"
                    }));
            } else {
                // אם התעודת זהות תקינה, מנקים את שגיאת הוולידציה בזמן אמת
                setIdValidationErrors((prev)=>{
                    const updated = {
                        ...prev
                    };
                    delete updated[index];
                    return updated;
                });
            }
            // בדיקת תאריך לידה
            if (!customer.birthDate || customer.birthDate.trim() === "") {
                customerErrors.push("תאריך לידה הוא שדה חובה");
                isValid = false;
            }
            // בדיקת שם פרטי באנגלית
            if (!customer.firstNameEn || customer.firstNameEn.trim() === "") {
                customerErrors.push("שם פרטי באנגלית הוא שדה חובה");
                isValid = false;
            }
            // בדיקת שם משפחה באנגלית
            if (!customer.lastNameEn || customer.lastNameEn.trim() === "") {
                customerErrors.push("שם משפחה באנגלית הוא שדה חובה");
                isValid = false;
            }
            // בדיקת אימייל וטלפון (חובה רק אם הגיל >= 18)
            const age = calculateAge(customer.birthDate);
            const isContactRequired = age === null || age >= 18;
            if (isContactRequired) {
                if (!customer.email || customer.email.trim() === "") {
                    customerErrors.push("דואר אלקטרוני הוא שדה חובה לנוסעים מעל גיל 18");
                    isValid = false;
                } else {
                    // בדיקת תקינות אימייל בסיסית
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(customer.email.trim())) {
                        customerErrors.push("דואר אלקטרוני לא תקין");
                        isValid = false;
                    }
                }
                if (!customer.phone || customer.phone.trim() === "") {
                    customerErrors.push("טלפון נייד הוא שדה חובה לנוסעים מעל גיל 18");
                    isValid = false;
                } else {
                    // בדיקת תקינות טלפון (לפחות 9 ספרות)
                    const phoneDigits = customer.phone.replace(/[^\d]/g, "");
                    if (phoneDigits.length < 9) {
                        customerErrors.push("טלפון נייד חייב להכיל לפחות 9 ספרות");
                        isValid = false;
                    }
                }
            }
            if (customerErrors.length > 0) {
                errors[index] = customerErrors;
            }
        });
        setValidationErrors(errors);
        return isValid;
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const clean = id.replace(/[^\d]/g, "");
            if (clean.length < 9) {
                setStatus({
                    type: "idle",
                    text: ""
                });
                return;
            }
            if (clean.length !== 9) return;
            if (!isValidIsraeliId(clean)) {
                setStatus({
                    type: "error",
                    text: "ת״ז לא תקינה"
                });
                setIdValidationErrors({
                    "Home.useEffect": (prev)=>({
                            ...prev,
                            [0]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת"
                        })
                }["Home.useEffect"]);
                return;
            } else {
                // אם התעודת זהות תקינה, מנקים את שגיאת הוולידציה בזמן אמת
                setIdValidationErrors({
                    "Home.useEffect": (prev)=>{
                        const updated = {
                            ...prev
                        };
                        delete updated[0];
                        return updated;
                    }
                }["Home.useEffect"]);
            }
            const t = setTimeout({
                "Home.useEffect.t": async ()=>{
                    try {
                        setLoading(true);
                        setStatus({
                            type: "checking",
                            text: "בודק במערכת…"
                        });
                        // יצירת AbortController ל-timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout({
                            "Home.useEffect.t.timeoutId": ()=>controller.abort()
                        }["Home.useEffect.t.timeoutId"], 10000); // 10 שניות timeout
                        const res = await fetch(getApiPath(`/api/policy-get-by-id?id=${encodeURIComponent(clean)}`), {
                            cache: "no-store",
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        let json = null;
                        try {
                            json = await res.json();
                        } catch  {
                            setStatus({
                                type: "error",
                                text: "תגובה לא תקינה מהשרת"
                            });
                            return;
                        }
                        if (!res.ok) {
                            setStatus({
                                type: "error",
                                text: "שגיאה בבדיקה"
                            });
                            return;
                        }
                        // ✅ השתמש ב-customer שמגיע מה-API
                        const customer = json.customer;
                        if (customer && json.found) {
                            const fullName = customer.primaryName || "";
                            // אם יש שמות נפרדים - השתמש בהם, אחרת חלק את השם המלא
                            const firstNameHe = customer.firstNameHe || "";
                            const lastNameHe = customer.lastNameHe || "";
                            const split = !firstNameHe && !lastNameHe && fullName ? splitNameHe(fullName) : {
                                first: firstNameHe,
                                last: lastNameHe
                            };
                            // ✅ המגדר כבר מנורמל ב-API (M/F או "")
                            const gender = customer.gender || "";
                            // ✅ ממלא אוטומטית את הלקוח הראשון מיד - ללא המתנה!
                            setCustomers({
                                "Home.useEffect.t": (prev)=>{
                                    const updated = [
                                        ...prev
                                    ];
                                    if (updated.length === 0) {
                                        updated.push({
                                            id: clean,
                                            gender: gender || "",
                                            firstNameHe: split.first || "",
                                            lastNameHe: split.last || "",
                                            firstNameEn: customer.firstNameEn || "",
                                            lastNameEn: customer.lastNameEn || "",
                                            birthDate: customer.birthDate || "",
                                            email: customer.email || "",
                                            phone: customer.phone || ""
                                        });
                                    } else {
                                        updated[0] = {
                                            ...updated[0],
                                            id: clean,
                                            gender: updated[0].gender || gender || "",
                                            firstNameHe: updated[0].firstNameHe || split.first || "",
                                            lastNameHe: updated[0].lastNameHe || split.last || "",
                                            firstNameEn: updated[0].firstNameEn || customer.firstNameEn || "",
                                            lastNameEn: updated[0].lastNameEn || customer.lastNameEn || "",
                                            birthDate: updated[0].birthDate || customer.birthDate || "",
                                            email: updated[0].email || customer.email || "",
                                            phone: updated[0].phone || customer.phone || ""
                                        };
                                    }
                                    return updated;
                                }
                            }["Home.useEffect.t"]);
                            // ✅ מציג הודעה מיד - המשתמש רואה שהכל עובד!
                            setStatus({
                                type: "ok",
                                text: `נמצא במערכת · ${fullName || ""}`
                            });
                            setLoading(false); // מסיים את ה-loading מיד
                            // ✅ טוען לקוחות נוספים ברקע - לא חוסם את המשתמש!
                            const allCustomersFromApi = json.allCustomers || [];
                            const normalizedCurrentId = clean.padStart(9, "0");
                            const additional = allCustomersFromApi.filter({
                                "Home.useEffect.t.additional": (c)=>{
                                    const custId = String(c.personId || "").padStart(9, "0");
                                    return custId !== normalizedCurrentId && custId.length === 9;
                                }
                            }["Home.useEffect.t.additional"]);
                            // מעדכן את הלקוחות הנוספים ברקע
                            setAdditionalCustomers(additional);
                            setSelectedAdditionalCustomers(new Set());
                            // אם יש לקוחות נוספים, מציג הודעה (לא פותח מודאל אוטומטית)
                            if (additional.length > 0) {
                                // עדכון ההודעה להוסיף מידע על לקוחות נוספים
                                setTimeout({
                                    "Home.useEffect.t": ()=>{
                                        setStatus({
                                            type: "ok",
                                            text: `נמצא במערכת · ${fullName || ""} · ${additional.length} מבוטחים נוספים זמינים`
                                        });
                                    }
                                }["Home.useEffect.t"], 500);
                            }
                        } else {
                            setStatus({
                                type: "notfound",
                                text: "לא נמצא — מלא ידנית"
                            });
                            setAdditionalCustomers([]);
                            setSelectedAdditionalCustomers(new Set());
                            setLoading(false);
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            setStatus({
                                type: "error",
                                text: "הזמן הקצוב לבדיקה פג - נסה שוב"
                            });
                        } else {
                            setStatus({
                                type: "error",
                                text: "שגיאת רשת"
                            });
                        }
                        setLoading(false);
                    }
                }
            }["Home.useEffect.t"], 300); // הקטנתי מ-450ms ל-300ms - יותר מהיר
            return ({
                "Home.useEffect": ()=>clearTimeout(t)
            })["Home.useEffect"];
        }
    }["Home.useEffect"], [
        id
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        dir: "rtl",
        className: "min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 -z-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: getAssetPath("/background2.png"),
                    alt: "",
                    className: "absolute inset-0 w-full h-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                    lineNumber: 766,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 764,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "sticky top-0 z-20 border-b border-white/30 bg-white/85 backdrop-blur-xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#0b4e86] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-center w-full",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto max-w-4xl w-full flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-10 sm:h-12 flex items-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: getAssetPath("/HeaderLogo.png"),
                                    alt: "אופיר ביטוח",
                                    className: "h-full w-auto object-contain"
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 780,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 779,
                                columnNumber: 13
                            }, this),
                            shatapName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-white text-sm sm:text-base font-medium",
                                children: shatapName
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 788,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 777,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                    lineNumber: 776,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 774,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "mx-auto max-w-2xl px-3 sm:px-4 py-2 sm:py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center mb-2 sm:mb-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-xl sm:text-2xl font-bold tracking-tight text-slate-900",
                                style: {
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                },
                                children: "רכישת ביטוח נסיעות לחו״ל"
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 796,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-sm font-medium text-slate-600",
                                children: "נשמח להכיר את הנוסעים שנבטח הפעם"
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 799,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 795,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto max-w-xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: chip
                                    }, void 0, false, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 807,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            additionalCustomers.length > 0 && !showAdditionalCustomersModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowAdditionalCustomersModal(true),
                                                className: "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        width: "14",
                                                        height: "14",
                                                        viewBox: "0 0 24 24",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        strokeWidth: "2",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M12 5v14M5 12h14"
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 818,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 817,
                                                        columnNumber: 19
                                                    }, this),
                                                    "הוסף מבוטחים נוספים (",
                                                    additionalCustomers.length,
                                                    ")"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 812,
                                                columnNumber: 17
                                            }, this),
                                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "inline-flex items-center gap-2 text-xs font-bold text-slate-500",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "h-2 w-2 rounded-full bg-sky-500 animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 825,
                                                        columnNumber: 19
                                                    }, this),
                                                    "טוען"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 824,
                                                columnNumber: 17
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 810,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 806,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3 sm:space-y-4",
                                children: customers.map((customer, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        "data-customer-index": index,
                                        className: cn("rounded-xl border backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] transition-all", validationErrors[index] && validationErrors[index].length > 0 ? "border-rose-300 bg-rose-50/80" : "border-white/60 bg-white/90"),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "p-3 sm:p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between mb-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-base sm:text-lg font-bold text-slate-900",
                                                                    style: {
                                                                        fontFamily: 'system-ui, -apple-system, sans-serif'
                                                                    },
                                                                    children: index === 0 ? "פרטי הנוסע הראשון" : `פרטי הנוסע ${index === 1 ? "השני" : index === 2 ? "השלישי" : `מספר ${index + 1}`}`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 847,
                                                                    columnNumber: 21
                                                                }, this),
                                                                index === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm font-medium text-slate-500 mt-0.5",
                                                                    children: "איש הקשר לצורך רכישת הביטוח"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 851,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 846,
                                                            columnNumber: 19
                                                        }, this),
                                                        index > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>setCustomers((prev)=>prev.filter((_, i)=>i !== index)),
                                                            className: "inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    width: "16",
                                                                    height: "16",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 863,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 862,
                                                                    columnNumber: 23
                                                                }, this),
                                                                "הסר"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 857,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 845,
                                                    columnNumber: 17
                                                }, this),
                                                validationErrors[index] && validationErrors[index].length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-start gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                className: "text-rose-600 flex-shrink-0 mt-0.5",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 875,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 874,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-rose-800",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "font-semibold",
                                                                        children: "יש למלא שדות חובה:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 878,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                                        className: "list-disc list-inside mr-2 mt-1",
                                                                        children: validationErrors[index].map((error, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                                children: error
                                                                            }, i, false, {
                                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                lineNumber: 881,
                                                                                columnNumber: 29
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 879,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 877,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 873,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 872,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid gap-1 w-fit",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldLabel, {
                                                                    required: true,
                                                                    children: "מין הנוסע"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 893,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "w-fit",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GenderToggle, {
                                                                        value: customer.gender,
                                                                        onChange: (v)=>{
                                                                            clearCustomerErrors(index);
                                                                            setCustomers((prev)=>{
                                                                                const updated = [
                                                                                    ...prev
                                                                                ];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    gender: v
                                                                                };
                                                                                return updated;
                                                                            });
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 895,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 894,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 892,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 891,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 890,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "relative",
                                                            children: [
                                                                index === 0 && (loading || status.type === "checking") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-sky-300",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex items-center gap-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                className: "animate-spin h-4 w-4 text-sky-600",
                                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                                fill: "none",
                                                                                viewBox: "0 0 24 24",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                                        className: "opacity-25",
                                                                                        cx: "12",
                                                                                        cy: "12",
                                                                                        r: "10",
                                                                                        stroke: "currentColor",
                                                                                        strokeWidth: "4"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                        lineNumber: 918,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        className: "opacity-75",
                                                                                        fill: "currentColor",
                                                                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                        lineNumber: 919,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                lineNumber: 917,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-xs font-medium text-sky-700 whitespace-nowrap",
                                                                                children: "בודק תעודת זהות במערכת"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                lineNumber: 921,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 916,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 915,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                    label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                        children: [
                                                                            "תעודת זהות ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-rose-500",
                                                                                children: "*"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                lineNumber: 926,
                                                                                columnNumber: 43
                                                                            }, void 0)
                                                                        ]
                                                                    }, void 0, true),
                                                                    dir: "rtl",
                                                                    value: index === 0 ? id : customer.id,
                                                                    onChange: (e)=>{
                                                                        clearCustomerErrors(index);
                                                                        const cleanValue = e.target.value.replace(/[^\d]/g, "");
                                                                        // מגביל ל-9 ספרות
                                                                        const limitedValue = cleanValue.slice(0, 9);
                                                                        if (index === 0) {
                                                                            setId(limitedValue);
                                                                            // גם מעדכן את customer.id
                                                                            setCustomers((prev)=>{
                                                                                const updated = [
                                                                                    ...prev
                                                                                ];
                                                                                updated[0] = {
                                                                                    ...updated[0],
                                                                                    id: limitedValue
                                                                                };
                                                                                return updated;
                                                                            });
                                                                            // בדיקת ולידציה בזמן אמת
                                                                            validateIdRealTime(limitedValue, index);
                                                                        } else {
                                                                            setCustomers((prev)=>{
                                                                                const updated = [
                                                                                    ...prev
                                                                                ];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    id: limitedValue
                                                                                };
                                                                                return updated;
                                                                            });
                                                                            // בדיקת ולידציה בזמן אמת
                                                                            validateIdRealTime(limitedValue, index);
                                                                        }
                                                                    },
                                                                    onBlur: (e)=>{
                                                                        let cleanValue = e.target.value.replace(/[^\d]/g, "");
                                                                        // אם יש בדיוק 8 ספרות, מוסיפים 0 בהתחלה
                                                                        if (cleanValue.length === 8) {
                                                                            cleanValue = "0" + cleanValue;
                                                                            // מעדכן את הערך בשדה
                                                                            if (index === 0) {
                                                                                setId(cleanValue);
                                                                                setCustomers((prev)=>{
                                                                                    const updated = [
                                                                                        ...prev
                                                                                    ];
                                                                                    updated[0] = {
                                                                                        ...updated[0],
                                                                                        id: cleanValue
                                                                                    };
                                                                                    return updated;
                                                                                });
                                                                            } else {
                                                                                setCustomers((prev)=>{
                                                                                    const updated = [
                                                                                        ...prev
                                                                                    ];
                                                                                    updated[index] = {
                                                                                        ...updated[index],
                                                                                        id: cleanValue
                                                                                    };
                                                                                    return updated;
                                                                                });
                                                                            }
                                                                        }
                                                                        validateIdRealTime(cleanValue, index);
                                                                    },
                                                                    inputMode: "numeric",
                                                                    maxLength: 9,
                                                                    className: idValidationErrors[index] ? "border-rose-400 focus:border-rose-500" : ""
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 925,
                                                                    columnNumber: 21
                                                                }, this),
                                                                idValidationErrors[index] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "mt-1.5 flex items-start gap-1.5 text-xs text-rose-600",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                            width: "14",
                                                                            height: "14",
                                                                            viewBox: "0 0 24 24",
                                                                            fill: "none",
                                                                            stroke: "currentColor",
                                                                            strokeWidth: "2",
                                                                            className: "flex-shrink-0 mt-0.5",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                d: "M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                lineNumber: 984,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 983,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: idValidationErrors[index]
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 986,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 982,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 913,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                    children: [
                                                                        "תאריך לידה ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-rose-500",
                                                                            children: "*"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 992,
                                                                            columnNumber: 43
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true),
                                                                dir: "rtl",
                                                                type: "date",
                                                                value: customer.birthDate,
                                                                onChange: (e)=>{
                                                                    clearCustomerErrors(index);
                                                                    setCustomers((prev)=>{
                                                                        const updated = [
                                                                            ...prev
                                                                        ];
                                                                        updated[index] = {
                                                                            ...updated[index],
                                                                            birthDate: e.target.value
                                                                        };
                                                                        return updated;
                                                                    });
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 991,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 990,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 912,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                    children: [
                                                                        "שם פרטי באנגלית ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-rose-500",
                                                                            children: "*"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 1012,
                                                                            columnNumber: 48
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true),
                                                                dir: "rtl",
                                                                value: customer.firstNameEn,
                                                                onChange: (e)=>{
                                                                    clearCustomerErrors(index);
                                                                    setCustomers((prev)=>{
                                                                        const updated = [
                                                                            ...prev
                                                                        ];
                                                                        updated[index] = {
                                                                            ...updated[index],
                                                                            firstNameEn: e.target.value
                                                                        };
                                                                        return updated;
                                                                    });
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1011,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1010,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                    children: [
                                                                        "שם משפחה באנגלית ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-rose-500",
                                                                            children: "*"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 1028,
                                                                            columnNumber: 49
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true),
                                                                dir: "rtl",
                                                                value: customer.lastNameEn,
                                                                onChange: (e)=>{
                                                                    clearCustomerErrors(index);
                                                                    setCustomers((prev)=>{
                                                                        const updated = [
                                                                            ...prev
                                                                        ];
                                                                        updated[index] = {
                                                                            ...updated[index],
                                                                            lastNameEn: e.target.value
                                                                        };
                                                                        return updated;
                                                                    });
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1027,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1026,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1009,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2",
                                                    children: (()=>{
                                                        const age = calculateAge(customer.birthDate);
                                                        // required רק אם הגיל >= 18, או אם אין תאריך לידה (נניח שהוא מבוגר)
                                                        // אופציונלי רק אם הגיל < 18
                                                        const isRequired = age === null || age >= 18;
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                        label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                            children: [
                                                                                "דואר אלקטרוני",
                                                                                isRequired && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-rose-500",
                                                                                    children: " *"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                    lineNumber: 1055,
                                                                                    columnNumber: 66
                                                                                }, void 0),
                                                                                !isRequired && " (אופציונלי)"
                                                                            ]
                                                                        }, void 0, true),
                                                                        dir: "rtl",
                                                                        type: "email",
                                                                        value: customer.email,
                                                                        onChange: (e)=>{
                                                                            clearCustomerErrors(index);
                                                                            setCustomers((prev)=>{
                                                                                const updated = [
                                                                                    ...prev
                                                                                ];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    email: e.target.value
                                                                                };
                                                                                return updated;
                                                                            });
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 1054,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 1053,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                        label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                            children: [
                                                                                "טלפון נייד",
                                                                                isRequired && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-rose-500",
                                                                                    children: " *"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                    lineNumber: 1072,
                                                                                    columnNumber: 63
                                                                                }, void 0),
                                                                                !isRequired && " (אופציונלי)"
                                                                            ]
                                                                        }, void 0, true),
                                                                        dir: "rtl",
                                                                        value: customer.phone,
                                                                        onChange: (e)=>{
                                                                            clearCustomerErrors(index);
                                                                            setCustomers((prev)=>{
                                                                                const updated = [
                                                                                    ...prev
                                                                                ];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    phone: e.target.value
                                                                                };
                                                                                return updated;
                                                                            });
                                                                        },
                                                                        inputMode: "tel"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 1071,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 1070,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true);
                                                    })()
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1044,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                label: "שם פרטי בעברית",
                                                                dir: "rtl",
                                                                value: customer.firstNameHe,
                                                                onChange: (e)=>setCustomers((prev)=>{
                                                                        const updated = [
                                                                            ...prev
                                                                        ];
                                                                        updated[index] = {
                                                                            ...updated[index],
                                                                            firstNameHe: e.target.value
                                                                        };
                                                                        return updated;
                                                                    })
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1094,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1093,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingInput, {
                                                                label: "שם משפחה בעברית",
                                                                dir: "rtl",
                                                                value: customer.lastNameHe,
                                                                onChange: (e)=>setCustomers((prev)=>{
                                                                        const updated = [
                                                                            ...prev
                                                                        ];
                                                                        updated[index] = {
                                                                            ...updated[index],
                                                                            lastNameHe: e.target.value
                                                                        };
                                                                        return updated;
                                                                    })
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1109,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1108,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1092,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                            lineNumber: 844,
                                            columnNumber: 15
                                        }, this)
                                    }, index, false, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 834,
                                        columnNumber: 13
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 832,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 sm:mt-3 mx-auto max-w-xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setCustomers((prev)=>{
                                                        const MAX_CUSTOMERS = 10;
                                                        if (prev.length >= MAX_CUSTOMERS) return prev;
                                                        const updated = [
                                                            ...prev,
                                                            {
                                                                id: "",
                                                                gender: "",
                                                                firstNameHe: "",
                                                                lastNameHe: "",
                                                                firstNameEn: "",
                                                                lastNameEn: "",
                                                                birthDate: "",
                                                                email: "",
                                                                phone: ""
                                                            }
                                                        ];
                                                        // ממיין לפי תאריך לידה
                                                        return sortCustomersByBirthDate(updated);
                                                    }),
                                                disabled: customers.length >= 10,
                                                className: cn("h-10 w-10 rounded-full text-white flex items-center justify-center transition shadow-sm hover:shadow-md flex-shrink-0", customers.length >= 10 ? "bg-slate-300 cursor-not-allowed" : "bg-[#0b4e86] hover:bg-[#0a3d6b]"),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "20",
                                                    height: "20",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2.5",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M12 5v14M5 12h14"
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1167,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1166,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1132,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-slate-900",
                                                children: "להוספת נוסע/ת"
                                            }, void 0, false, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1170,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 1131,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] p-3 sm:p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mb-4 text-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-medium text-[#0b4e86] leading-relaxed",
                                                    children: "אפשר לרכוש את הביטוח הזה אך ורק כאשר המבוטח נמצא בישראל. משמעות הרכישה היא כמו הצהרה שהמבוטח נמצא בארץ בזמן הרכישה."
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1176,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1175,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col items-center gap-3",
                                                children: [
                                                    Object.keys(validationErrors).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-full rounded-lg bg-rose-50 border border-rose-200 p-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    width: "20",
                                                                    height: "20",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    className: "text-rose-600 flex-shrink-0 mt-0.5",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                        lineNumber: 1188,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 1187,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "text-sm font-bold text-rose-900 mb-2",
                                                                            children: "נא למלא את כל השדות החובה:"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 1191,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "space-y-1",
                                                                            children: Object.entries(validationErrors).map(([index, errors])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "text-xs text-rose-800",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: "font-semibold",
                                                                                            children: [
                                                                                                Number(index) === 0 ? "נוסע ראשון" : `נוסע ${Number(index) + 1}`,
                                                                                                ":"
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                            lineNumber: 1195,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                                                            className: "list-disc list-inside mr-2 mt-1",
                                                                                            children: errors.map((error, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                                                    children: error
                                                                                                }, i, false, {
                                                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                                    lineNumber: 1200,
                                                                                                    columnNumber: 35
                                                                                                }, this))
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                            lineNumber: 1198,
                                                                                            columnNumber: 31
                                                                                        }, this)
                                                                                    ]
                                                                                }, index, true, {
                                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                                    lineNumber: 1194,
                                                                                    columnNumber: 29
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                            lineNumber: 1192,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 1190,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1186,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1185,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>{
                                                            if (validateForm()) {
                                                                // אם כל השדות תקינים, אפשר להמשיך
                                                                // כאן תוכל להוסיף את הלוגיקה להעברה לאתר הראל
                                                                window.open("https://www.harel-group.co.il", "_blank");
                                                            } else {
                                                                // גלול לשגיאה הראשונה
                                                                const firstErrorIndex = Number(Object.keys(validationErrors)[0]);
                                                                const element = document.querySelector(`[data-customer-index="${firstErrorIndex}"]`);
                                                                if (element) {
                                                                    element.scrollIntoView({
                                                                        behavior: "smooth",
                                                                        block: "start"
                                                                    });
                                                                }
                                                            }
                                                        },
                                                        className: "w-full sm:w-auto min-w-[280px] rounded-xl px-5 py-3 text-base font-bold transition shadow-sm hover:shadow-md bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]",
                                                        children: "המשך תהליך באתר הראל"
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1210,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1182,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 1173,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 1129,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 text-center text-xs font-medium text-slate-500",
                                children: [
                                    "© ",
                                    new Date().getFullYear(),
                                    " Ophir Insurance • Designed for 2026 UI"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 1234,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 804,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 794,
                columnNumber: 7
            }, this),
            additionalCustomers.length > 0 && showAdditionalCustomersModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
                        onClick: ()=>{
                            setShowAdditionalCustomersModal(false);
                        }
                    }, void 0, false, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 1244,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mb-4",
                                                        style: {
                                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xl font-bold",
                                                                style: {
                                                                    color: '#18509C',
                                                                    marginBottom: '0px',
                                                                    lineHeight: '1.2'
                                                                },
                                                                children: (()=>{
                                                                    const firstCustomer = customers[0];
                                                                    const firstName = firstCustomer?.firstNameHe?.trim() || firstCustomer?.firstNameEn?.trim() || "";
                                                                    return firstName ? `הי ${firstName},` : "הי,";
                                                                })()
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1258,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-lg font-bold",
                                                                style: {
                                                                    color: '#18509C',
                                                                    lineHeight: '1.2'
                                                                },
                                                                children: "איזה כיף לראות אותך שוב איתנו!"
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1265,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1257,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-normal",
                                                        style: {
                                                            color: '#18509C',
                                                            lineHeight: '1.3'
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    marginBottom: '0px'
                                                                },
                                                                children: "הנה כל פרטי הנוסעים שמצאנו מהנסיעות הקודמות שלך."
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1270,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: "צריך לבחור את מי שנוסע הפעם."
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1271,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1269,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1256,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    setShowAdditionalCustomersModal(false);
                                                },
                                                className: "text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white/50 rounded-lg flex-shrink-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "20",
                                                    height: "20",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M18 6L6 18M6 6l12 12"
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1282,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1281,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1274,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 1255,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 flex items-center gap-2 flex-wrap",
                                        children: (()=>{
                                            const MAX_CUSTOMERS = 10;
                                            const availableSlots = MAX_CUSTOMERS - customers.length;
                                            if (availableSlots <= 0) {
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                                                    tone: "warning",
                                                    children: "הגעת למקסימום נוסעים (10)"
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1291,
                                                    columnNumber: 28
                                                }, this);
                                            }
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Chip, {
                                                tone: "success",
                                                children: [
                                                    "ניתן להוסיף עד ",
                                                    availableSlots,
                                                    " נוסע",
                                                    availableSlots > 1 ? "ים" : ""
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1293,
                                                columnNumber: 26
                                            }, this);
                                        })()
                                    }, void 0, false, {
                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                        lineNumber: 1286,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 1254,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 overflow-y-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "divide-y divide-slate-200",
                                    children: [
                                        ...additionalCustomers
                                    ].sort((a, b)=>{
                                        // קודם מיון לפי שם משפחה
                                        const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
                                        const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();
                                        if (lastNameA && lastNameB) {
                                            const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
                                            if (lastNameCompare !== 0) {
                                                return lastNameCompare;
                                            }
                                        } else if (lastNameA && !lastNameB) {
                                            return -1; // A קודם
                                        } else if (!lastNameA && lastNameB) {
                                            return 1; // B קודם
                                        }
                                        // אם שם המשפחה זהה או אין שם משפחה, ממיינים לפי תאריך לידה
                                        const dateA = a.birthDate || "";
                                        const dateB = b.birthDate || "";
                                        // אם אין תאריך לידה, מניחים אותו בסוף
                                        if (!dateA && !dateB) return 0;
                                        if (!dateA) return 1;
                                        if (!dateB) return -1;
                                        // תאריך קטן יותר = גיל גדול יותר, אז ממיינים מהקטן לגדול
                                        return dateA.localeCompare(dateB);
                                    }).map((addCust)=>{
                                        const MAX_CUSTOMERS = 10;
                                        const availableSlots = MAX_CUSTOMERS - customers.length;
                                        const isSelected = selectedAdditionalCustomers.has(addCust.personId);
                                        const canSelect = isSelected || selectedAdditionalCustomers.size < availableSlots;
                                        const fullName = addCust.primaryName || `${addCust.firstNameHe} ${addCust.lastNameHe}`.trim();
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: cn("flex items-center gap-2 px-3 py-2 transition", canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-60", isSelected ? "bg-sky-50/50" : canSelect ? "hover:bg-slate-50/50" : ""),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: isSelected,
                                                    disabled: !canSelect,
                                                    onChange: (e)=>{
                                                        if (!canSelect && !isSelected) return;
                                                        const newSet = new Set(selectedAdditionalCustomers);
                                                        if (e.target.checked) {
                                                            if (newSet.size < availableSlots) {
                                                                newSet.add(addCust.personId);
                                                            }
                                                        } else {
                                                            newSet.delete(addCust.personId);
                                                        }
                                                        setSelectedAdditionalCustomers(newSet);
                                                    },
                                                    className: cn("h-4 w-4 rounded border-2 flex-shrink-0", isSelected ? "border-[#18509C] bg-[#18509C] text-white" : "border-[#18509C] bg-white", "focus:ring-[#18509C] focus:ring-1", canSelect ? "cursor-pointer" : "cursor-not-allowed"),
                                                    style: {
                                                        accentColor: '#18509C'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1344,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1 min-w-0",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-medium truncate",
                                                        style: {
                                                            color: '#18509C'
                                                        },
                                                        children: fullName
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1373,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1372,
                                                    columnNumber: 23
                                                }, this),
                                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-shrink-0",
                                                    style: {
                                                        color: '#18509C'
                                                    },
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        width: "16",
                                                        height: "16",
                                                        viewBox: "0 0 24 24",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        strokeWidth: "2",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M20 6L9 17l-5-5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                            lineNumber: 1378,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1377,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1376,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, addCust.personId, true, {
                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                            lineNumber: 1336,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 1300,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 1299,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 border-t border-slate-200 bg-slate-50/50",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs font-medium text-slate-600",
                                            children: selectedAdditionalCustomers.size > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "נבחרו ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-bold text-slate-900",
                                                        children: selectedAdditionalCustomers.size
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1394,
                                                        columnNumber: 29
                                                    }, this),
                                                    " נוסע",
                                                    selectedAdditionalCustomers.size > 1 ? "ים" : ""
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1393,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-slate-400",
                                                children: "לא נבחרו נוסעים"
                                            }, void 0, false, {
                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                lineNumber: 1397,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                            lineNumber: 1391,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>{
                                                        setShowAdditionalCustomersModal(false);
                                                    },
                                                    className: "px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition",
                                                    children: "ביטול"
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1401,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>{
                                                        const selected = additionalCustomers.filter((c)=>selectedAdditionalCustomers.has(c.personId));
                                                        // אם יש נוסעים שנבחרו, הוסף אותם
                                                        if (selected.length > 0) {
                                                            const newCustomers = selected.map((c)=>{
                                                                const normalizedGender = c.gender === "M" || c.gender === "F" ? c.gender : "";
                                                                return {
                                                                    id: c.personId,
                                                                    gender: normalizedGender,
                                                                    firstNameHe: c.firstNameHe,
                                                                    lastNameHe: c.lastNameHe,
                                                                    firstNameEn: c.firstNameEn,
                                                                    lastNameEn: c.lastNameEn,
                                                                    birthDate: c.birthDate,
                                                                    email: c.email || "",
                                                                    phone: c.phone || ""
                                                                };
                                                            });
                                                            setCustomers((prev)=>{
                                                                const MAX_CUSTOMERS = 10;
                                                                const currentCount = prev.length;
                                                                const canAdd = MAX_CUSTOMERS - currentCount;
                                                                // מוסיף רק עד המקסימום
                                                                const toAdd = newCustomers.slice(0, canAdd);
                                                                const updated = [
                                                                    ...prev,
                                                                    ...toAdd
                                                                ];
                                                                // ממיין לפי תאריך לידה
                                                                return sortCustomersByBirthDate(updated);
                                                            });
                                                            // הסר את המבוטחים שנוספו מהרשימה
                                                            const remainingCustomers = additionalCustomers.filter((c)=>!selectedAdditionalCustomers.has(c.personId));
                                                            setAdditionalCustomers(remainingCustomers);
                                                        }
                                                        setSelectedAdditionalCustomers(new Set());
                                                        // סגור את המודאל תמיד
                                                        setShowAdditionalCustomersModal(false);
                                                    },
                                                    disabled: (()=>{
                                                        const MAX_CUSTOMERS = 10;
                                                        const availableSlots = MAX_CUSTOMERS - customers.length;
                                                        // מושבת רק אם יש בחירות אבל אין מקום
                                                        return selectedAdditionalCustomers.size > 0 && availableSlots <= 0;
                                                    })(),
                                                    className: cn("px-4 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm hover:shadow-md", (()=>{
                                                        const MAX_CUSTOMERS = 10;
                                                        const availableSlots = MAX_CUSTOMERS - customers.length;
                                                        const hasSelection = selectedAdditionalCustomers.size > 0;
                                                        const canAdd = availableSlots > 0;
                                                        // אם יש בחירות ויש מקום - כפתור כחול
                                                        if (hasSelection && canAdd) {
                                                            return "bg-sky-600 hover:bg-sky-700 text-white";
                                                        }
                                                        // אם אין בחירות - כפתור צהוב (המשך ללא הוספה)
                                                        if (!hasSelection) {
                                                            return "bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]";
                                                        }
                                                        // אם יש בחירות אבל אין מקום - disabled
                                                        return "bg-slate-300 cursor-not-allowed text-white";
                                                    })()),
                                                    children: selectedAdditionalCustomers.size > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M12 5v14M5 12h14"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                    lineNumber: 1489,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                                lineNumber: 1488,
                                                                columnNumber: 25
                                                            }, this),
                                                            "הוסף ",
                                                            selectedAdditionalCustomers.size,
                                                            " נוסע",
                                                            selectedAdditionalCustomers.size > 1 ? "ים" : ""
                                                        ]
                                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$travelsure$2d$1$2f$buyinsnew$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-bold",
                                                        children: "המשך ללא הוספת נוסעים"
                                                    }, void 0, false, {
                                                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                        lineNumber: 1494,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                                    lineNumber: 1410,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                            lineNumber: 1400,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                    lineNumber: 1390,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                                lineNumber: 1389,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                        lineNumber: 1252,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
                lineNumber: 1242,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/travelsure-1/buyinsnew/app/page.tsx",
        lineNumber: 762,
        columnNumber: 5
    }, this);
}
_s1(Home, "93R5e5m0fmQQc8MgV30AyAqbqGM=");
_c5 = Home;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Chip");
__turbopack_context__.k.register(_c1, "FieldLabel");
__turbopack_context__.k.register(_c2, "Input");
__turbopack_context__.k.register(_c3, "FloatingInput");
__turbopack_context__.k.register(_c4, "GenderToggle");
__turbopack_context__.k.register(_c5, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=travelsure-1_buyinsnew_app_page_tsx_055cb706._.js.map