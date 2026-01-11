# 🌐 הגדרת Domain ב-Internic עבור travelsure.co.il

## 📋 מידע על השרת והדומיין

- **דומיין:** travelsure.co.il
- **ספק דומיין:** Internic (internic.co.il)
- **שרת:** Cloud של ccc.co.il (VPS - IP קבוע)
- **IP השרת:** 109.226.23.217
- **FTP Share:** \\109.226.23.217\TravSure
- **תיקיית האתר על השרת:** C:\TravSure (יש לבדוק על השרת)
- **שרת IIS:** רץ על Windows Server

---

## 🔍 שלב 1: מצא את ה-IP הציבורי של השרת

יש כמה דרכים למצוא את ה-IP:

### אופציה א': דרך CCC (מומלץ)
1. התחבר ל-Panel של ccc.co.il
2. מצא את ה-VPS שלך
3. בדוק את ה-IP הציבורי (Public IP) של השרת

### אופציה ב': דרך השרת עצמו
התחבר ל-сервер ורוץ:
```powershell
# PowerShell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json" | Select-Object -ExpandProperty ip

# או
(Invoke-WebRequest -Uri "https://ifconfig.me/ip").Content
```

**📝 IP השרת:** `109.226.23.217` ✅

---

## 🌍 שלב 2: הגדרת DNS ב-Internic

1. **היכנס ל-Internic:**
   - לך ל: https://www.internic.co.il/
   - התחבר לחשבון שלך

2. **ניהול דומיין:**
   - לחץ על **"ניהול דומיין"** (Domain management)
   - בחר את הדומיין: **travelsure.co.il**

3. **ערוך DNS Records:**
   - מצא את **"DNS Management"** או **"ניהול DNS"**
   - לחץ על **"ערוך"** או **"Edit DNS"**

4. **הוסף/עדכן A Record:**
   - **סוג:** `A`
   - **שם/Host:** `@` (או השאר ריק)
   - **ערך/Points to:** `109.226.23.217`
   - **TTL:** `3600` (או Default)

5. **הוסף גם www (אופציונלי אבל מומלץ):**
   - **סוג:** `A`
   - **שם/Host:** `www`
   - **ערך/Points to:** `109.226.23.217`
   - **TTL:** `3600`

6. **שמור את השינויים**

**DNS Records שצריך להגדיר:**
```
Type: A
Name: @
Value: 109.226.23.217

Type: A
Name: www
Value: 109.226.23.217
```

**⏰ חשוב:** שינויי DNS יכולים לקחת עד 24-48 שעות, אבל בדרך כלל זה קורה תוך 2-6 שעות.

---

## ⚙️ שלב 3: הגדרת IIS Binding

**אם ה-IIS Manager לא מותקן על השרת, יש להתחבר ל-сервер דרך Remote Desktop.**

1. **התחבר לשרת** (Remote Desktop)

2. **פתח IIS Manager:**
   - לחץ `Windows + R`
   - הקלד: `inetmgr`
   - לחץ Enter

3. **מצא את ה-Website שלך** (`TravelSure` או שם אחר)
   - **חשוב:** בדוק מה ה-Physical Path של ה-Website
   - זה אמור להיות הנתיב המקומי (כנראה `C:\TravSure`)

4. **לחץ ימין על ה-Website → "Edit Bindings..."**

5. **לחץ "Add..."**

6. **הגדר:**
   - **Type:** `http` (או `https` אם יש SSL)
   - **IP address:** `All Unassigned` (או בחר IP ספציפי)
   - **Port:** `80` (או `443` ל-HTTPS)
   - **Host name:** `travelsure.co.il` ⭐ (זה החשוב!)

7. **לחץ "OK"**

8. **אם יש לך גם `www` - הוסף binding נוסף:**
   - לחץ "Add..." שוב
   - **Host name:** `www.travelsure.co.il`
   - אותו Port ו-IP
   - לחץ "OK"

---

## 🔒 שלב 4: הגדרת HTTPS (מומלץ מאוד!)

**לאתרים בייצור צריך HTTPS!**

### אופציה א': SSL Certificate חינמי (Let's Encrypt) - מומלץ!

**הדרך הקלה ביותר - Win-acme:**

1. **הורד Win-acme:**
   - לך ל: https://www.win-acme.com/
   - הורד את הגרסה האחרונה

2. **העלה ל-сервер והפעל כ-Administrator:**
   - העתק את הקובץ ל-сервер
   - פתח PowerShell כ-Administrator
   - נווט לתיקייה
   - הרץ: `wacs.exe`

3. **עקוב אחר ההוראות:**
   - בחר "N: Create certificate (default settings)"
   - בחר את ה-Website שלך
   - בחר את הדומיין: `travelsure.co.il`
   - הוא ייצור את ה-Certificate ויתקין אותו אוטומטית

### אופציה ב': SSL Certificate מספק מסחרי

אם יש לך SSL Certificate:

1. **ייבא את ה-Certificate:**
   - פתח "Run" (`Windows + R`)
   - הקלד: `mmc`
   - File → Add/Remove Snap-in → Certificates → Computer account → Local Computer → OK
   - Certificates → Personal → Certificates → לחץ ימין → All Tasks → Import

2. **הגדר Binding ב-IIS:**
   - Edit Bindings → Add
   - **Type:** `https`
   - **Port:** `443`
   - **SSL certificate:** בחר את ה-Certificate שייבאת
   - **Host name:** `travelsure.co.il`

---

## 🔥 שלב 5: הגדרת Firewall

**ודא שהפורטים פתוחים ב-Firewall:**

1. **פתח Windows Firewall:**
   - לחץ `Windows + R`
   - הקלד: `wf.msc`
   - לחץ Enter

2. **הוסף Inbound Rule:**
   - לחץ ימין על "Inbound Rules" → "New Rule..."
   - בחר "Port" → Next
   - בחר "TCP"
   - בחר "Specific local ports": `80` (ו-`443` אם משתמש ב-HTTPS)
   - Allow the connection → Next
   - סמן את כל ה-Profiles → Next
   - Name: "IIS HTTP" (ו-"IIS HTTPS")
   - Finish

**אם יש Firewall של CCC:**
- ודא שהפורטים 80 ו-443 פתוחים ב-Panel של ccc.co.il

---

## ✅ שלב 6: בדיקה

1. **בדוק אם ה-DNS התעדכן:**
   ```powershell
   # PowerShell
   nslookup travelsure.co.il
   ```
   ודא שהוא מחזיר את ה-IP הנכון

2. **בדוק את האתר:**
   - פתח דפדפן
   - גש ל: `http://travelsure.co.il` (או `https://` אם הגדרת SSL)
   - האתר אמור להיפתח!

3. **בדיקה מכל מקום:**
   - השתמש ב-https://dnschecker.org/
   - הזן: `travelsure.co.il`
   - ודא שה-IP נכון בכל העולם (יכול לקחת כמה שעות)

---

## 🔧 פתרון בעיות נפוצות

### בעיה 1: "Site can't be reached"
**פתרונות:**
- בדוק שה-Firewall פתוח (Port 80/443)
- בדוק שה-DNS Records נכונים
- בדוק שה-IP ציבורי נכון
- נסה לגשת מה-IP ישירות: `http://[YOUR_IP]`

### בעיה 2: "This site can't provide a secure connection"
**פתרון:**
- זה אומר שאין SSL Certificate
- השתמש ב-`http://` במקום `https://`
- או התקן SSL Certificate (ראה שלב 4)

### בעיה 3: האתר לא נטען אבל אין שגיאה
**פתרונות:**
- בדוק שה-IIS Website רץ (Status = Started)
- בדוק את Application Pool (Status = Started)
- בדוק את ה-Logs: IIS Manager → Logging → Browse

### בעיה 4: "HTTP Error 403.14"
**פתרון:**
- ודא שקובץ `index.html` קיים
- בדוק את ה-Default Document ב-IIS
- IIS Manager → Website → Default Document → ודא ש-`index.html` ברשימה

---

## 📝 סיכום - צעדים מהירים

1. ✅ מצא את ה-IP הציבורי של השרת (מ-ccc.co.il)
2. ✅ היכנס ל-Internic → ניהול דומיין → DNS Management
3. ✅ הוסף A Record: `@` → `[YOUR_IP]`
4. ✅ הוסף A Record: `www` → `[YOUR_IP]`
5. ✅ ב-IIS Manager → Edit Bindings → הוסף Host name: `travelsure.co.il`
6. ✅ פתח Firewall (Port 80, 443)
7. ✅ המתן 2-6 שעות (או בדוק עם nslookup)
8. ✅ בדוק את האתר בדפדפן

---

## 💡 טיפים

- **מומלץ להשתמש ב-Cloudflare:**
  - חינמי
  - CDN מהיר
  - SSL חינמי
  - DDoS protection
  - רק שנה את ה-Nameservers ב-Internic ל-Cloudflare

- **לאבטחה מקסימלית:**
  - השתמש ב-HTTPS (SSL)
  - הוסף Firewall rules
  - עדכן את השרת באופן קבוע

---

**בהצלחה! 🎉**

**צריך עזרה?** אפשר לשאול בכל שלב!
