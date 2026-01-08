# 🌐 חיבור ל-Domain הקיים - travelsure.co.il/buyinsnew

## ✅ המצב:
- האתר הקיים (`travelsure.co.il`) רץ על **Lovable.dev** → **Netlify**
- האתר החדש (`ophirins.netlify.app`) רץ על **Netlify**
- המטרה: `travelsure.co.il/buyinsnew` → יפנה לאתר החדש

---

## 📋 צעד אחר צעד:

### שלב 1: מצא את ה-site של האתר הקיים ב-Netlify

1. **היכנס ל-Netlify:**
   - לך ל-[netlify.com](https://netlify.com)
   - התחבר עם אותו חשבון שבו אתה משתמש עם Lovable

2. **מצא את ה-site של `travelsure.co.il`:**
   - בדף הראשי של Netlify, חפש את ה-site עם ה-domain `travelsure.co.il`
   - או לך ל-**Sites** → חפש `travelsure`
   - לחץ על ה-site

---

### שלב 2: הוסף Redirect Rule

1. **ב-site של `travelsure.co.il`, לך ל:**
   - **Site settings** (למעלה, ליד ה-URL)
   - **Redirects and rewrites** (בתפריט השמאלי)

2. **הוסף redirect rule חדש:**
   - לחץ **"Add new rule"** או **"New redirect"**

3. **הזן את הפרטים:**
   ```
   From: /buyinsnew/*
   To: https://ophirins.netlify.app/:splat
   Status: 200 (Proxy)
   Force: ✓ (סמן את זה!)
   ```

   **חשוב:**
   - ה-`Status` חייב להיות **200** (לא 301 או 302)
   - ה-`Force` חייב להיות מסומן
   - ה-`:splat` זה placeholder לכל מה שבא אחרי `/buyinsnew/`

4. **לחץ "Save"** או **"Deploy"**

---

### שלב 3: בדיקה

לאחר ה-deployment (כמה שניות):

1. **פתח:** `https://travelsure.co.il/buyinsnew`
2. **ודא שהאתר עובד:**
   - ✅ הלוגו מופיע
   - ✅ תמונת הרקע מופיעה
   - ✅ אפשר להכניס תעודת זהות
   - ✅ הכל עובד

---

## 🔍 אם זה לא עובד:

### בעיה: "404 Not Found"

**פתרונות:**
1. **ודא שה-redirect rule נכון:**
   - `From` צריך להיות: `/buyinsnew/*`
   - `To` צריך להיות: `https://ophirins.netlify.app/:splat`
   - `Status` צריך להיות: `200`

2. **ודא שה-Force מסומן:**
   - זה חשוב כדי שה-redirect יעבוד גם אם יש rules אחרים

3. **בדוק את ה-logs:**
   - ב-Netlify → **Functions** → **Logs**
   - חפש שגיאות

### בעיה: התמונות לא מופיעות

**פתרון:**
- ה-redirect rule צריך לכלול את כל ה-assets
- ה-`:splat` אמור לטפל בזה, אבל אם לא:
  - הוסף redirect נוסף:
    ```
    From: /buyinsnew/_next/*
    To: https://ophirins.netlify.app/buyinsnew/_next/:splat
    Status: 200
    ```

### בעיה: API calls לא עובדים

**פתרון:**
- ה-redirect rule צריך לכלול את ה-API routes
- ה-`:splat` אמור לטפל בזה, אבל אם לא:
  - הוסף redirect נוסף:
    ```
    From: /buyinsnew/api/*
    To: https://ophirins.netlify.app/buyinsnew/api/:splat
    Status: 200
    ```

---

## 📸 תמונות מסך (איך זה אמור להיראות):

### ב-Netlify Redirects:

```
┌─────────────────────────────────────────┐
│ Redirects and rewrites                  │
├─────────────────────────────────────────┤
│                                         │
│  From: /buyinsnew/*                    │
│  To: https://ophirins.netlify.app/:splat│
│  Status: 200                            │
│  Force: ✓                               │
│                                         │
│  [Save] [Cancel]                        │
└─────────────────────────────────────────┘
```

---

## ✅ סיכום:

1. ✅ לך ל-Netlify → מצא את site של `travelsure.co.il`
2. ✅ Site settings → Redirects and rewrites
3. ✅ הוסף redirect: `/buyinsnew/*` → `https://ophirins.netlify.app/:splat` (Status: 200)
4. ✅ שמור
5. ✅ בדוק: `https://travelsure.co.il/buyinsnew`

---

## 🎉 זה הכל!

לאחר ההגדרות, `travelsure.co.il/buyinsnew` יעבוד ויפנה לאתר החדש שלך!

---

## 💡 טיפים:

- **אם יש לך כמה redirects:** ודא שה-`Force` מסומן על ה-rule החדש
- **אם זה לא עובד מיד:** המתן 1-2 דקות ל-propagation
- **אם יש בעיות:** בדוק את ה-logs ב-Netlify

---

## 📞 תמיכה:

אם נתקלת בבעיות:
1. בדוק את ה-logs ב-Netlify
2. בדוק את ה-Developer Tools (F12) → Console/Network
3. שלח את השגיאות ואבדוק
