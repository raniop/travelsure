# 🚀 התחלה מהירה - צעד אחר צעד

## ✅ למה זה בטוח?

אם נשתמש ב-**repository נפרד**, הפרויקט הקיים שלך **לא יושפע כלל**:
- ✅ כל הקבצים של הפרויקט הקיים יישארו במקומם
- ✅ הפרויקט החדש יהיה ב-repository נפרד
- ✅ אפשר תמיד למחוק את ה-repository החדש אם משהו לא עובד
- ✅ Git שומר היסטוריה - אפשר לחזור אחורה

---

## 📝 צעד אחר צעד - הדרך הבטוחה

### שלב 1: צור repository חדש ב-GitHub

1. לך ל-[github.com](https://github.com)
2. לחץ על **"+"** למעלה → **"New repository"**
3. שם: `travelsure-insurance-form`
4. בחר **Private** (או Public - לפי מה שאתה רוצה)
5. **אל תסמן** "Add a README file" או כל דבר אחר
6. לחץ **"Create repository"**

---

### שלב 2: העלה את הקוד ל-GitHub

**פתח PowerShell** (לחץ Windows + X → Windows PowerShell)

**העתק והדבק את הפקודות הבאות אחת אחת:**

```powershell
# 1. לך לתיקיית הפרויקט
cd "c:\Users\rani.OPHIRINS\Desktop\OphirBit\ophir-insurance-form"

# 2. אתחל Git (אם עדיין לא)
git init

# 3. הוסף את כל הקבצים
git add .

# 4. צור commit ראשון
git commit -m "Initial commit - Insurance form"

# 5. שנה את שם ה-branch ל-main
git branch -M main

# 6. חבר את ה-repository שיצרת ב-GitHub
git remote add origin https://github.com/raniop/travelsure-insurance-form.git

# 7. העלה את הקוד
git push -u origin main
```

**אם זה מבקש username ו-password:**
- Username: `raniop`
- Password: תצטרך ליצור **Personal Access Token** ב-GitHub (Settings → Developer settings → Personal access tokens)

---

### שלב 3: פרסום ב-Netlify

1. **היכנס ל-Netlify:**
   - לך ל-[netlify.com](https://netlify.com)
   - התחבר עם אותו חשבון שבו אתה משתמש עם Lovable

2. **צור site חדש:**
   - לחץ על **"Add new site"** (כפתור ירוק למעלה)
   - בחר **"Import an existing project"**

3. **חבר את GitHub:**
   - בחר **"Deploy with GitHub"**
   - אם זה הפעם הראשונה, תצטרך לאשר גישה ל-GitHub
   - בחר את ה-repository: `raniop/travelsure-insurance-form`

4. **הגדרות Build:**
   - Netlify יזהה אוטומטית את ההגדרות מ-`netlify.toml`
   - **Base directory:** השאר ריק
   - **Build command:** `npm run build` (אוטומטי)
   - **Publish directory:** `.next` (אוטומטי)

5. **לחץ "Deploy site"**

6. **המתן 2-5 דקות:**
   - תקבל כתובת כמו: `random-name-123.netlify.app`
   - בדוק: `https://random-name-123.netlify.app/buyinsnew`

---

### שלב 4: חיבור ל-domain (travelsure.co.il/buyinsnew)

**אחרי שה-deployment הצליח:**

1. **ב-Netlify, לך ל-Site settings** → **Domain management**
2. לחץ **"Add custom domain"**
3. הזן: `travelsure.co.il`
4. עקוב אחר ההוראות לעדכון DNS records

5. **הגדר את הנתיב `/buyinsnew`:**

   **אם האתר הקיים (`travelsure.co.il`) רץ על Netlify:**
   - ב-Netlify, מצא את ה-site של האתר הקיים
   - לך ל-**Site settings** → **Redirects and rewrites**
   - הוסף redirect rule:
     ```
     /buyinsnew/*  https://your-new-site.netlify.app/:splat  200!
     ```
     (החלף `your-new-site.netlify.app` בכתובת ה-Netlify החדשה)

   **אם האתר הקיים רץ על שרת אחר:**
   - תצטרך להגדיר reverse proxy בשרת
   - ראה הוראות מפורטות ב-`DEPLOYMENT.md`

---

## ✅ בדיקה

לאחר ה-deployment:

1. **בדוק את ה-Netlify URL:**
   - `https://your-site.netlify.app/buyinsnew`
   - זה אמור לעבוד מיד

2. **בדוק את ה-domain:**
   - `https://travelsure.co.il/buyinsnew`
   - זה יעבוד רק אחרי שתגדיר את ה-redirect/proxy

---

## 🆘 בעיות?

### "git: command not found"
- צריך להתקין Git: [git-scm.com](https://git-scm.com/download/win)

### "Permission denied" ב-push
- צריך ליצור Personal Access Token ב-GitHub
- Settings → Developer settings → Personal access tokens → Generate new token

### Build נכשל ב-Netlify
- בדוק את ה-logs ב-Netlify (Deploys → בחר deployment → View build log)
- ודא ש-`npm run build` עובד מקומית

---

## 📚 קבצים נוספים

- `GIT_SETUP.md` - הוראות מפורטות על Git
- `DEPLOYMENT.md` - מדריך פרסום מפורט
- `README.md` - מידע כללי על הפרויקט
