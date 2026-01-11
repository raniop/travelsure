# 🔧 מדריך הגדרת IIS עבור TravelSure

## 📋 דרישות מוקדמות

1. **IIS מופעל במחשב שלך:**
   - פתח את **Control Panel** → **Programs** → **Turn Windows features on or off**
   - ודא ש-**Internet Information Services** מסומן
   - ודא ש-**IIS Management Console** מסומן
   - ודא ש-**URL Rewrite Module** מסומן (אם לא - הורד מ-[Microsoft](https://www.iis.net/downloads/microsoft/url-rewrite))

2. **Node.js מותקן** (כבר יש לך)

---

## 🚀 שלב 1: בניית הפרויקט

הפרויקט כבר נבנה! התיקייה `dist` מכילה את הקבצים המוכנים לפריסה.

אם תצטרך לבנות מחדש:
```bash
npm run build
```

---

## 🗂️ שלב 2: העתקת הקבצים ל-IIS

**חשוב:** יש להריץ PowerShell כ-Administrator!

### אופציה א': העתקה ידנית

1. **פתח PowerShell כ-Administrator:**
   - לחץ ימין על תפריט התחל → **Windows PowerShell (Admin)** או **Terminal (Admin)**
   - או לחץ `Windows + X` → בחר **Windows PowerShell (Admin)**

2. **נווט לתיקיית הפרויקט:**
   ```powershell
   cd C:\Users\rani.OPHIRINS\travelsure
   ```

3. **צור תיקייה והעתק קבצים:**
   ```powershell
   # צור תיקייה (אם לא קיימת)
   New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\travelsure" -Force
   
   # העתק קבצים
   Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\travelsure\" -Recurse -Force
   ```

### אופציה ב': העתקה דרך Windows Explorer

1. פתח את Windows Explorer
2. נווט ל: `C:\Users\rani.OPHIRINS\travelsure\dist`
3. לחץ `Ctrl + A` כדי לבחור הכל
4. לחץ `Ctrl + C` כדי להעתיק
5. נווט ל: `C:\inetpub\wwwroot`
6. צור תיקייה חדשה בשם `travelsure` (אם לא קיימת)
7. פתח את התיקייה `travelsure`
8. לחץ `Ctrl + V` כדי להדביק
9. אם יש בקשת הרשאות - לחץ "Continue" / "Try Again"

---

## ⚙️ שלב 3: הגדרת IIS Website

### אופציה א': יצירת Website חדש (מומלץ)

1. **פתח את IIS Manager:**
   - לחץ `Windows + R`
   - הקלד: `inetmgr`
   - לחץ Enter

2. **צור Application Pool חדש:**
   - לחץ ימין על **Application Pools** → **Add Application Pool**
   - **Name:** `TravelSureAppPool`
   - **.NET CLR version:** `No Managed Code` (כי זה אפליקציה סטטית)
   - **Managed pipeline mode:** `Integrated`
   - לחץ **OK**

3. **צור Website חדש:**
   - לחץ ימין על **Sites** → **Add Website**
   - **Site name:** `TravelSure`
   - **Application pool:** בחר `TravelSureAppPool`
   - **Physical path:** `C:\inetpub\wwwroot\travelsure` (הנתיב שהעתקת אליו)
   - **Binding:**
     - **Type:** `http`
     - **IP address:** `All Unassigned` (או IP ספציפי)
     - **Port:** `80` (או פורט אחר כמו 8080)
     - **Host name:** השאר ריק (או הזן domain אם יש)
   - לחץ **OK**

### אופציה ב': הוספה ל-Default Website הקיים

1. **פתח את IIS Manager** (`inetmgr`)

2. **הוסף Application:**
   - לחץ ימין על **Default Web Site** → **Add Application**
   - **Alias:** `travelsure`
   - **Application pool:** `DefaultAppPool` (או צור חדש)
   - **Physical path:** `C:\inetpub\wwwroot\travelsure`
   - לחץ **OK**

---

## 🔧 שלב 4: הגדרת URL Rewrite (חשוב!)

**הערה:** קובץ `web.config` כבר קיים בתיקייה `dist`, אבל ודא ש-URL Rewrite Module מותקן:

1. **בדוק אם URL Rewrite מותקן:**
   - ב-IIS Manager, לחץ על ה-Site שלך
   - אם אתה רואה **URL Rewrite** בחלונית הימנית - זה טוב!
   - אם לא - הורד מ-[Microsoft URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)

2. **אם URL Rewrite לא מותקן:**
   - הורד את **URL Rewrite Module 2.1**
   - התקן אותו
   - הפעל מחדש את IIS Manager

---

## 🌐 שלב 5: בדיקה

1. **פתח דפדפן**

2. **גש לאתר:**
   - אם יצרת Website חדש על פורט 80: `http://localhost`
   - אם יצרת Website חדש על פורט אחר (למשל 8080): `http://localhost:8080`
   - אם הוספת ל-Default Website: `http://localhost/travelsure`

---

## 🔐 שלב 6: הגדרות נוספות (אופציונלי)

### הגדרת HTTPS (SSL)

1. **צור Self-Signed Certificate:**
   ```powershell
   # הפעל PowerShell כ-Administrator
   New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
   ```

2. **ב-IIS Manager:**
   - לחץ ימין על ה-Site → **Edit Bindings**
   - לחץ **Add**
   - **Type:** `https`
   - **Port:** `443`
   - **SSL certificate:** בחר את ה-Certificate שיצרת
   - לחץ **OK**

### הגדרת Permissions

ודא ש-IIS_IUSRS יש גישה לתיקייה:
```powershell
# הפעל PowerShell כ-Administrator
icacls "C:\inetpub\wwwroot\travelsure" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

---

## 🐛 פתרון בעיות

### בעיה 1: "404 Not Found" כשמנווטים בין דפים
**פתרון:** ודא ש-URL Rewrite Module מותקן וש-`web.config` קיים בתיקייה

### בעיה 2: "403 Forbidden"
**פתרון:** בדוק את ה-permissions של התיקייה (ראה שלב 6)

### בעיה 3: קבצים סטטיים לא נטענים (CSS/JS)
**פתרון:** 
- ודא שהקבצים הועתקו נכון
- בדוק את ה-permissions
- בדוק את ה-console בדפדפן לשגיאות 404

### בעיה 4: השרת לא עובד
**פתרון:**
- ודא שה-Application Pool רץ (Status = Started)
- בדוק את ה-logs ב-IIS Manager → Logging

---

## 📝 סיכום - צעדים מהירים

1. ✅ בנה את הפרויקט: `npm run build`
2. ✅ העתק את התוכן מ-`dist` ל-`C:\inetpub\wwwroot\travelsure`
3. ✅ התקן URL Rewrite Module (אם צריך)
4. ✅ צור Website חדש ב-IIS או הוסף Application
5. ✅ בדוק את האתר בדפדפן

---

## 📌 נתיבים חשובים

- **תיקיית הבנייה:** `C:\Users\rani.OPHIRINS\travelsure\dist`
- **תיקיית IIS:** `C:\inetpub\wwwroot\travelsure` (או כל תיקייה שבחרת)
- **קובץ הגדרות:** `dist\web.config` (מועתק אוטומטית)

---

**בהצלחה! 🎉**
