# 🚀 מדריך פרסום - travelsure.co.il/buyinsnew

## ✅ מה כבר מוכן:
- ✅ הפרויקט מוגדר לרוץ תחת `/buyinsnew` (basePath)
- ✅ קובץ `netlify.toml` מוכן לפרסום
- ✅ הפרויקט נבנה בהצלחה

---

## שלב 1: העלאה ל-GitHub

**📖 קרא את `GIT_SETUP.md` להוראות מפורטות ובטוחות!**

### אופציה A: Repository נפרד (מומלץ - הכי בטוח!) ⭐

```powershell
# 1. בתיקיית הפרויקט
cd "c:\Users\rani.OPHIRINS\Desktop\OphirBit\ophir-insurance-form"

# 2. אתחל Git
git init

# 3. הוסף הכל
git add .

# 4. Commit
git commit -m "Initial commit - Insurance form"

# 5. צור repository חדש ב-GitHub בשם: "travelsure-insurance-form"
#    (לך ל-GitHub → New repository → שם: travelsure-insurance-form)

# 6. חבר את ה-remote
git remote add origin https://github.com/raniop/travelsure-insurance-form.git

# 7. Push
git branch -M main
git push -u origin main
```

**יתרונות:**
- ✅ הכי בטוח - לא נוגע בפרויקט הקיים
- ✅ קל לניהול
- ✅ אפשר למחוק בלי בעיות

### אופציה B: להוסיף ל-repository הקיים (אם אתה בטוח)

**⚠️ רק אם אתה רוצה את שני הפרויקטים באותו repository:**

```powershell
# 1. Clone את ה-repository הקיים
cd "c:\Users\rani.OPHIRINS\Desktop\OphirBit"
git clone https://github.com/raniop/travelsure.git

# 2. לך לתיקיית ה-repository
cd travelsure

# 3. צור תיקייה חדשה
mkdir insurance-form

# 4. העתק את כל הקבצים מהפרויקט הנוכחי
xcopy "..\ophir-insurance-form\*" "insurance-form\" /E /I /Y

# 5. הוסף הכל ל-Git
git add insurance-form

# 6. Commit
git commit -m "Add insurance form project in insurance-form folder"

# 7. Push
git push origin main
```

**⚠️ חשוב:** בדוק לפני שאתה push שהכל נראה טוב:
```powershell
git status
```

---

## שלב 2: פרסום ב-Netlify

1. **היכנס ל-Netlify:**
   - לך ל-[netlify.com](https://netlify.com)
   - התחבר עם אותו חשבון שבו אתה משתמש עם Lovable

2. **צור site חדש:**
   - לחץ על **"Add new site"** (כפתור ירוק למעלה)
   - בחר **"Import an existing project"**

3. **חבר את GitHub:**
   - בחר **"Deploy with GitHub"**
   - אם זה הפעם הראשונה, תצטרך לאשר גישה ל-GitHub
   - בחר את ה-repository: `raniop/travelsure` (או repository החדש)

4. **הגדרות Build:**
   Netlify אמור לזהות אוטומטית את ההגדרות מ-`netlify.toml`, אבל ודא:
   - **Base directory:** 
     - אם השתמשת באופציה A (repository נפרד): השאר ריק
     - אם השתמשת באופציה B (תיקייה נפרדת): הזן `insurance-form`
   - **Build command:** `npm run build` (אוטומטי)
   - **Publish directory:** `.next` (אוטומטי)

5. **לחץ "Deploy site"**

6. **המתן ל-deployment:**
   - זה יכול לקחת 2-5 דקות
   - תקבל כתובת כמו: `random-name-123.netlify.app`

---

## שלב 3: חיבור ל-domain (travelsure.co.il/buyinsnew)

### שלב 3א: הוסף את ה-domain ב-Netlify

1. ב-Netlify, לך ל-**Site settings** → **Domain management**
2. לחץ **"Add custom domain"**
3. הזן: `travelsure.co.il`
4. עקוב אחר ההוראות לעדכון DNS records

### שלב 3ב: הגדר את הנתיב `/buyinsnew`

יש לך 2 אפשרויות:

#### אפשרות 1: אם האתר הקיים (`travelsure.co.il`) רץ על Netlify

1. ב-Netlify, מצא את ה-site של האתר הקיים (`travelsure.co.il`)
2. לך ל-**Site settings** → **Redirects and rewrites**
3. הוסף redirect rule חדש:
   ```
   /buyinsnew/*  https://your-new-site.netlify.app/:splat  200!
   ```
   (החלף `your-new-site.netlify.app` בכתובת ה-Netlify החדשה שקיבלת)

#### אפשרות 2: אם האתר הקיים רץ על שרת אחר

תצטרך להגדיר **reverse proxy** בשרת:

**דוגמה ל-Nginx:**
```nginx
location /buyinsnew {
    proxy_pass https://your-new-site.netlify.app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**דוגמה ל-Apache (.htaccess):**
```apache
RewriteEngine On
RewriteRule ^buyinsnew/(.*)$ https://your-new-site.netlify.app/$1 [P,L]
```

---

## בדיקה

לאחר ה-deployment:

1. **בדוק את ה-Netlify URL:**
   - `https://your-site.netlify.app/buyinsnew`
   - זה אמור לעבוד מיד

2. **בדוק את ה-domain:**
   - `https://travelsure.co.il/buyinsnew`
   - זה יעבוד רק אחרי שתגדיר את ה-redirect/proxy

---

## עדכונים עתידיים

כל פעם שתעשה `git push` ל-GitHub, Netlify יעדכן אוטומטית את האתר!

---

## בעיות נפוצות

### הפרויקט לא נבנה:
- ודא ש-`npm run build` עובד מקומית
- בדוק את ה-logs ב-Netlify (Deploys → בחר deployment → View build log)

### הנתיב `/buyinsnew` לא עובד:
- ודא שה-redirect rule נכון
- בדוק שה-`basePath` מוגדר ב-`next.config.ts`

### שגיאות ב-runtime:
- בדוק את ה-logs ב-Netlify Functions
- ודא שאין משתני סביבה שצריך להוסיף (Site settings → Environment variables)

---

## תמיכה

- [תיעוד Netlify](https://docs.netlify.com/)
- [תיעוד Netlify + Next.js](https://docs.netlify.com/integrations/frameworks/next-js/)
- [תיעוד Next.js basePath](https://nextjs.org/docs/app/api-reference/next-config-js/basePath)
