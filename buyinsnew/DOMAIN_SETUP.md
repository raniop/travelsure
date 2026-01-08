# 🌐 חיבור ל-Domain הקיים - travelsure.co.il/buyinsnew

## ✅ מה צריך לעשות:

יש לך שתי אפשרויות, תלוי איפה רץ האתר הקיים שלך (`travelsure.co.il`):

---

## אופציה 1: אם האתר הקיים רץ על Netlify ⭐ (הכי פשוט!)

אם האתר הקיים שלך (`travelsure.co.il`) כבר רץ על Netlify, זה הכי פשוט:

### שלב 1: הוסף את ה-domain ב-Netlify של האתר החדש

1. **ב-Netlify, לך ל-site החדש שלך** (`ophirins`)
2. **Site settings** → **Domain management**
3. לחץ **"Add custom domain"**
4. הזן: `travelsure.co.il`
5. Netlify יבקש ממך להוסיף DNS records - **אל תעשה את זה עדיין!**

### שלב 2: הגדר Redirect באתר הקיים

1. **ב-Netlify, מצא את ה-site של האתר הקיים** (`travelsure.co.il`)
2. **Site settings** → **Redirects and rewrites**
3. לחץ **"Add new rule"**
4. הוסף redirect rule:
   ```
   From: /buyinsnew/*
   To: https://ophirins.netlify.app/:splat
   Status: 200 (Proxy)
   Force: ✓ (סמן)
   ```
5. לחץ **"Save"**

### שלב 3: בדיקה

לאחר ה-redirect:
- `https://travelsure.co.il/buyinsnew` → יפנה ל-`https://ophirins.netlify.app/buyinsnew`
- האתר החדש יעבוד תחת ה-domain הקיים!

---

## אופציה 2: אם האתר הקיים רץ על שרת אחר

אם האתר הקיים שלך רץ על שרת אחר (לא Netlify), תצטרך להגדיר **reverse proxy** בשרת.

### שלב 1: הוסף את ה-domain ב-Netlify

1. **ב-Netlify, לך ל-site החדש שלך** (`ophirins`)
2. **Site settings** → **Domain management**
3. לחץ **"Add custom domain"**
4. הזן: `buyinsnew.travelsure.co.il` (subdomain)
   - או אם אתה רוצה `/buyinsnew`, תצטרך reverse proxy

### שלב 2: הגדר Reverse Proxy בשרת

**אם אתה משתמש ב-Nginx:**

הוסף ל-`nginx.conf` או ל-config file שלך:

```nginx
location /buyinsnew {
    proxy_pass https://ophirins.netlify.app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # חשוב: להסיר את /buyinsnew מה-URL לפני השליחה
    rewrite ^/buyinsnew/(.*)$ /buyinsnew/$1 break;
}
```

**אם אתה משתמש ב-Apache (.htaccess):**

הוסף ל-`.htaccess`:

```apache
RewriteEngine On
RewriteRule ^buyinsnew/(.*)$ https://ophirins.netlify.app/buyinsnew/$1 [P,L]
```

**אם אתה משתמש ב-cPanel:**

1. לך ל-**Subdomains** או **Redirects**
2. צור redirect:
   - **Type:** Proxy
   - **From:** `/buyinsnew/*`
   - **To:** `https://ophirins.netlify.app/buyinsnew/*`

---

## אופציה 3: Subdomain (אם אפשר)

אם אתה מעדיף subdomain במקום path:

### שלב 1: הסר את basePath

1. פתח `next.config.ts`
2. הסר או הערה את השורה:
   ```typescript
   // basePath: "/buyinsnew",
   ```
3. עדכן את הקוד - הסר את כל השימושים ב-`getAssetPath()` ו-`getApiPath()`
4. Commit ו-push

### שלב 2: הוסף Subdomain ב-Netlify

1. **Site settings** → **Domain management**
2. לחץ **"Add custom domain"**
3. הזן: `buyinsnew.travelsure.co.il`
4. עקוב אחר ההוראות לעדכון DNS records

---

## 📋 סיכום - מה לעשות עכשיו:

### אם האתר הקיים על Netlify:
1. ✅ לך ל-site הקיים ב-Netlify
2. ✅ הוסף redirect: `/buyinsnew/*` → `https://ophirins.netlify.app/:splat` (Status: 200)
3. ✅ בדוק: `https://travelsure.co.il/buyinsnew`

### אם האתר הקיים על שרת אחר:
1. ✅ הגדר reverse proxy בשרת
2. ✅ או השתמש ב-subdomain (`buyinsnew.travelsure.co.il`)

---

## 🔍 בדיקה:

לאחר ההגדרות:

1. **פתח:** `https://travelsure.co.il/buyinsnew`
2. **ודא שהאתר עובד:**
   - הלוגו מופיע
   - תמונת הרקע מופיעה
   - אפשר להכניס תעודת זהות
   - הכל עובד

---

## 🆘 בעיות נפוצות:

### "404 Not Found" ב-`/buyinsnew`
- ודא שה-redirect rule נכון
- ודא שה-status הוא `200` (לא 301 או 302)
- בדוק שה-URL ב-To נכון

### התמונות לא מופיעות
- ודא שה-redirect כולל את כל ה-assets
- בדוק ב-Developer Tools (F12) → Network אם יש שגיאות 404

### API calls לא עובדים
- ודא שה-redirect rule כולל את `/buyinsnew/api/*`
- או הוסף redirect נוסף:
  ```
  From: /buyinsnew/api/*
  To: https://ophirins.netlify.app/buyinsnew/api/:splat
  Status: 200
  ```

---

## 💡 המלצה:

**אם האתר הקיים על Netlify** - השתמש באופציה 1 (הכי פשוט!)
**אם האתר הקיים על שרת אחר** - השתמש ב-subdomain (אופציה 3) או reverse proxy (אופציה 2)

---

## 📞 תמיכה:

אם נתקלת בבעיות:
1. בדוק את ה-logs ב-Netlify
2. בדוק את ה-Developer Tools (F12) → Console/Network
3. שלח את השגיאות ואבדוק
