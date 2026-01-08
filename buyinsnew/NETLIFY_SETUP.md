# 🔧 הגדרת Netlify - travelsure.co.il/buyinsnew

## ⚠️ הבעיה:
Netlify לא מעדכן את ה-deployment אוטומטית.

## ✅ פתרון:

### שלב 1: בדוק את ההגדרות ב-Netlify

1. **היכנס ל-Netlify:**
   - לך ל-[netlify.com](https://netlify.com)
   - מצא את ה-site של `travelsure.co.il`

2. **Site settings → Build & deploy → Continuous deployment:**
   - ודא ש-GitHub מחובר
   - ודא שה-repository הוא: `raniop/travelsure`
   - ודא שה-Branch הוא: `main`

3. **Site settings → Build & deploy → Build settings:**
   - **Base directory:** `buyinsnew`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

### שלב 2: אם זה לא עובד - Trigger deployment ידני

1. **ב-Netlify, לך ל-Deploys**
2. לחץ **"Trigger deploy"** → **"Deploy site"**
3. זה יבנה את האתר מחדש

### שלב 3: בדוק את ה-logs

אם ה-build נכשל:

1. **ב-Netlify → Deploys**
2. לחץ על ה-deployment האחרון
3. לחץ **"View build log"**
4. בדוק אם יש שגיאות

---

## 🔍 בעיות נפוצות:

### בעיה 1: "Base directory not found"
**פתרון:**
- ודא שה-Base directory הוא: `buyinsnew` (לא `/buyinsnew`)

### בעיה 2: "Build command failed"
**פתרון:**
- ודא שה-Build command הוא: `npm run build`
- או: `cd buyinsnew && npm run build`

### בעיה 3: "Publish directory not found"
**פתרון:**
- ודא שה-Publish directory הוא: `.next`
- או: `buyinsnew/.next`

### בעיה 4: Continuous deployment לא עובד
**פתרון:**
1. Site settings → Build & deploy → Continuous deployment
2. לחץ **"Edit settings"**
3. ודא ש-GitHub מחובר
4. ודא שה-repository נכון: `raniop/travelsure`
5. שמור

---

## 📋 הגדרות מומלצות:

```
Base directory: buyinsnew
Build command: npm run build
Publish directory: .next
Node version: 20
```

---

## 🚀 Trigger deployment ידני:

אם אתה רוצה לעדכן ידנית:

1. **ב-Netlify → Deploys**
2. לחץ **"Trigger deploy"** (כפתור למעלה)
3. בחר **"Deploy site"**
4. המתן 2-5 דקות

---

## ✅ בדיקה:

לאחר ה-deployment:

1. **פתח:** `https://travelsure.co.il/buyinsnew`
2. **ודא שהאתר עובד:**
   - הלוגו מופיע
   - תמונת הרקע מופיעה
   - אפשר להכניס תעודת זהות
   - הפרטים מתמלאים מיד

---

## 💡 טיפים:

- **אם יש שגיאות ב-build:** בדוק את ה-logs
- **אם האתר לא מתעדכן:** Trigger deployment ידני
- **אם יש בעיות:** שלח את ה-logs ואבדוק
