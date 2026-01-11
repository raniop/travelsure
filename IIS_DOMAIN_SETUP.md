# 🌐 חיבור IIS לדומיין - TravelSure

## 📋 מה צריך לעשות:

כדי לחבר את IIS לדומיין שלך (למשל `travelsure.co.il`), יש כמה שלבים:

---

## 🔍 שלב 1: בדוק את כתובת ה-IP הציבורי שלך

**אם השרת נמצא אצלך בבית/במשרד:**

1. **מה ה-IP הציבורי שלך?**
   - פתח דפדפן וגש ל: https://whatismyipaddress.com/
   - או: https://www.whatismyip.com/
   - זה ה-IP הציבורי שלך (Public IP)

2. **חשוב להבין:**
   - אם המחשב בבית/במשרד - ה-IP יכול להשתנות (Dynamic IP)
   - אם זה שרת VPS/Cloud - יש לך IP קבוע (Static IP)

---

## 🌍 שלב 2: הגדרת DNS (אצל ספק הדומיין)

**לך לספק הדומיין שלך** (למשל: GoDaddy, Cloudflare, Namecheap, או כל ספק אחר):

1. **היכנס ל-Panel של הדומיין**
2. **מצא את "DNS Management" או "DNS Records"**
3. **הוסף/עדכן A Record:**
   - **Type:** `A`
   - **Name/Host:** `@` (או ריק, או `travelsure.co.il`)
   - **Value/Points to:** `[הזן את ה-IP הציבורי שלך]`
   - **TTL:** `3600` (או Default)

4. **אם אתה רוצה subdomain** (למשל `www.travelsure.co.il`):
   - **Type:** `A`
   - **Name/Host:** `www`
   - **Value/Points to:** `[אותו IP]`
   - **TTL:** `3600`

**דוגמה:**
```
Type: A
Name: @
Value: 123.456.789.012  (החלף ב-IP שלך)
TTL: 3600
```

**⏰ חשוב:** שינויי DNS יכולים לקחת עד 24-48 שעות, אבל בדרך כלל זה קורה תוך כמה שעות.

---

## ⚙️ שלב 3: הגדרת IIS Binding

לאחר שהגדרת את ה-DNS, צריך להגדיר את IIS:

1. **פתח IIS Manager:**
   - לחץ `Windows + R`
   - הקלד: `inetmgr`
   - לחץ Enter

2. **מצא את ה-Website שלך** (`TravelSure`)

3. **לחץ ימין על ה-Website → "Edit Bindings..."**

4. **לחץ "Add..."**

5. **הגדר:**
   - **Type:** `http` (או `https` אם יש לך SSL)
   - **IP address:** `All Unassigned` (או בחר IP ספציפי)
   - **Port:** `80` (או `443` ל-HTTPS)
   - **Host name:** `travelsure.co.il` ⭐ (זה החשוב!)

6. **לחץ "OK"**

7. **אם יש לך גם `www` - הוסף binding נוסף:**
   - לחץ "Add..." שוב
   - **Host name:** `www.travelsure.co.il`
   - אותו Port ו-IP
   - לחץ "OK"

---

## 🔒 שלב 4: הגדרת HTTPS (מומלץ!)

**חשוב:** לאתרים בייצור צריך HTTPS!

### אופציה א': SSL Certificate חינמי (Let's Encrypt)

**הדרך הקלה ביותר - Win-acme:**

1. **הורד Win-acme:**
   - לך ל: https://www.win-acme.com/
   - הורד את הגרסה האחרונה

2. **הפעל כ-Administrator:**
   - פתח PowerShell כ-Administrator
   - נווט לתיקייה
   - הרץ: `wacs.exe`

3. **עקוב אחר ההוראות:**
   - בחר "N: Create certificate (default settings)"
   - בחר את ה-Website שלך
   - הוא ייצור את ה-Certificate ויתקין אותו אוטומטית

### אופציה ב': SSL Certificate מספק מסחרי

אם יש לך SSL Certificate מספק מסחרי:

1. **ייבא את ה-Certificate:**
   - פתח "Run" (`Windows + R`)
   - הקלד: `mmc`
   - File → Add/Remove Snap-in → Certificates → Computer account → Local Computer → OK
   - Certificates → Personal → Certificates → לחץ ימין → All Tasks → Import
   - עקוב אחר ה-Wizard

2. **הגדר Binding ב-IIS:**
   - Edit Bindings → Add
   - **Type:** `https`
   - **SSL certificate:** בחר את ה-Certificate שייבאת

---

## 🔥 שלב 5: הגדרת Firewall

**אם יש לך Firewall (Windows Firewall או אחר):**

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

**אם יש Router/Modem:**
- צריך לפתוח Port Forwarding:
  - Port 80 → השרת המקומי שלך
  - Port 443 → השרת המקומי שלך (אם משתמש ב-HTTPS)

---

## 🏠 שלב 6: אם השרת בבית (Dynamic IP)

**אם ה-IP שלך משתנה, יש שתי אפשרויות:**

### אופציה א': Dynamic DNS (DDNS)

1. **הירשם לשירות DDNS חינמי:**
   - No-IP: https://www.noip.com/
   - DuckDNS: https://www.duckdns.org/
   - או כל ספק אחר

2. **הגדר את ה-DNS Records:**
   - במקום A Record עם IP, השתמש ב-CNAME:
   - **Type:** `CNAME`
   - **Name:** `@`
   - **Value:** `yourname.noip.org` (או הכתובת שתקבל)

3. **התקן Client על השרת:**
   - השירות ייתן לך תוכנה לעדכון אוטומטי של ה-IP

### אופציה ב': בקש IP קבוע מהספק

פנה לספק האינטרנט שלך ובקש Static IP (לרוב בתשלום נוסף).

---

## ✅ שלב 7: בדיקה

1. **בדוק אם ה-DNS התעדכן:**
   - פתח PowerShell
   - הרץ: `nslookup travelsure.co.il`
   - ודא שהוא מחזיר את ה-IP הנכון

2. **בדוק את האתר:**
   - פתח דפדפן (לא מהמחשב המקומי!)
   - גש ל: `http://travelsure.co.il` (או `https://` אם הגדרת SSL)
   - האתר אמור להיפתח!

3. **בדיקה מכל מקום:**
   - השתמש ב-https://dnschecker.org/
   - הזן: `travelsure.co.il`
   - ודא שה-IP נכון בכל העולם

---

## 🔧 פתרון בעיות נפוצות

### בעיה 1: "Site can't be reached"
**פתרונות:**
- בדוק שה-Firewall פתוח
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

1. ✅ בדוק את ה-IP הציבורי שלך
2. ✅ הוסף A Record ב-DNS Management: `@` → `[YOUR_IP]`
3. ✅ הוסף Binding ב-IIS: Host name = `travelsure.co.il`
4. ✅ פתח פורטים ב-Firewall (80, 443)
5. ✅ המתן עד 24 שעות (או בדוק עם nslookup)
6. ✅ בדוק את האתר בדפדפן

---

## 💡 טיפים

- **מומלץ להשתמש ב-Cloudflare:**
  - חינמי
  - CDN מהיר
  - SSL חינמי
  - DDoS protection
  - רק שנה את ה-Nameservers בדומיין

- **אם זה שרת ייצור אמיתי:**
  - השתמש ב-VPS/Cloud (AWS, Azure, DigitalOcean, וכו')
  - יש IP קבוע
  - יותר יציב

---

**בהצלחה! 🎉**
