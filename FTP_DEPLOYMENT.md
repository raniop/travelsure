# 📤 העלאת קבצים דרך FTP לשרת

## 📋 מידע על השרת

- **IP השרת:** 109.226.23.217
- **FTP Share:** `\\109.226.23.217\TravSure`
- **דומיין:** travelsure.co.il
- **ספק דומיין:** Internic

---

## 🔍 חשוב להבין

הנתיב `\\109.226.23.217\TravSure` הוא נתיב רשת (Network Share) ל-FTP.
על השרת עצמו, IIS צריך להיות מוגדר על **נתיב מקומי** (כנראה `C:\TravSure` או דומה).

**צריך לבדוק:**
1. מה הנתיב המקומי על השרת שאליו ה-FTP מעתיק?
2. האם IIS כבר מוגדר על התיקייה הזו?

---

## 📤 שלב 1: העלאת קבצים דרך FTP

### אופציה א': FileZilla או FTP Client אחר

1. **התקן FileZilla** (או כל FTP client אחר)
2. **התחבר:**
   - **Host:** `109.226.23.217` (או `ftp://109.226.23.217`)
   - **Username:** [השם משתמש שלך]
   - **Password:** [הסיסמה שלך]
   - **Port:** 21 (או הפורט שהספק נתן)

3. **העלה קבצים:**
   - בנה את הפרויקט: `npm run build`
   - העלה את כל התוכן מתיקיית `dist` לתיקיית `TravSure` על השרת
   - ודא ש-`web.config` מועלה גם

### אופציה ב': Windows Explorer (Network Drive)

1. **מפה את ה-FTP כ-Network Drive:**
   - פתח Windows Explorer
   - לחץ ימין על "This PC" → "Map network drive..."
   - בחר אות (למשל Z:)
   - בחר "Connect to a website that you can use to store your documents and pictures"
   - הזן: `ftp://109.226.23.217/TravSure`
   - הזן username/password

2. **העתק קבצים:**
   - בנה את הפרויקט: `npm run build`
   - העתק את כל התוכן מ-`dist` ל-Network Drive שיצרת

---

## ⚙️ שלב 2: הגדרת IIS על השרת

**חשוב:** IIS צריך להיות מוגדר על הנתיב המקומי על השרת, לא על network share!

### מה צריך לבדוק על השרת:

1. **התחבר לשרת** (Remote Desktop)

2. **בדוק מה הנתיב המקומי:**
   - פתח IIS Manager (`inetmgr`)
   - מצא את ה-Website שלך
   - בדוק את ה-Physical Path
   - זה הנתיב המקומי (כנראה `C:\TravSure` או דומה)

3. **אם IIS לא מוגדר:**
   - צור Website חדש ב-IIS
   - Physical path: `C:\TravSure` (או הנתיב המתאים)
   - Binding: Host name = `travelsure.co.il`, Port = 80

---

## 🌐 שלב 3: הגדרת DNS ב-Internic

1. **היכנס ל-Internic:** https://www.internic.co.il/
2. **ניהול דומיין** → בחר `travelsure.co.il`
3. **DNS Management** → ערוך
4. **הוסף A Records:**
   - `@` → `109.226.23.217`
   - `www` → `109.226.23.217`

---

## 🔄 תהליך עדכון האתר

כל פעם שאתה רוצה לעדכן את האתר:

1. **בנה את הפרויקט:**
   ```bash
   npm run build
   ```

2. **העלה דרך FTP:**
   - התחבר ל-FTP
   - העלה את כל התוכן מ-`dist` ל-`TravSure`
   - ודא ש-`web.config` נכלל

3. **בדוק את האתר:**
   - גש ל: `http://travelsure.co.il` (אחרי ש-DNS מתעדכן)

---

## 💡 טיפים

- **השתמש ב-FTP Client עם sync:**
  - FileZilla יכול לסנכרן תיקיות
  - זה יכול להקל על העלאות

- **אם יש לך גישה ל-сервер:**
  - יכול להיות יותר נוח להעתיק ישירות על השרת
  - או להשתמש ב-Script שיעתיק דרך network

---

## ❓ שאלות לבדיקה

**חשוב לבדוק על השרת:**

1. ✅ מה הנתיב המקומי של התיקייה `TravSure`? (כנראה `C:\TravSure`)
2. ✅ האם IIS כבר מוגדר על התיקייה הזו?
3. ✅ מה שם ה-Website ב-IIS?
4. ✅ האם יש Host name binding ל-`travelsure.co.il`?
5. ✅ האם Port 80 פתוח ב-Firewall?

---

**צריך עזרה עם משהו ספציפי?** אפשר לשאול!
