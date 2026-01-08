This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🚀 פרסום האתר לאינטרנט (Deployment Guide in Hebrew)

### אפשרות 1: Netlify (מומלץ - כמו Lovable) ⭐

**Netlify** - אותה פלטפורמה שאתה כבר מכיר מ-Lovable! 🎉

#### שלב 1: הכנת הקוד
1. ודא שהקוד שלך עובד מקומית:
   ```bash
   npm run build
   ```
   אם זה עובד בלי שגיאות, אתה מוכן!

#### שלב 2: העלאה ל-GitHub
אם הפרויקט עדיין לא ב-GitHub:
1. צור repository חדש ב-GitHub (או השתמש ב-repository הקיים)
2. העלה את הקוד:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin [URL של ה-repository שלך]
   git push -u origin main
   ```

#### שלב 3: פרסום ב-Netlify
1. היכנס ל-[netlify.com](https://netlify.com) והתחבר (אותו חשבון שבו אתה משתמש עם Lovable)
2. לחץ על **"Add new site"** → **"Import an existing project"**
3. בחר **"Deploy with GitHub"** וחבר את ה-repository שלך
4. הגדרות Build:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (או השאר ריק - Netlify יזהה אוטומטית)
   - **Base directory:** (השאר ריק)
5. לחץ **"Deploy site"**

**האתר יהיה זמין תוך דקות עם כתובת כמו: `your-project.netlify.app`**

#### שלב 4: חיבור ל-domain הקיים (travelsure.co.il/buyinsnew)

הפרויקט מוגדר כבר לרוץ תחת הנתיב `/buyinsnew`. כדי לחבר אותו ל-domain הקיים:

1. ב-Netlify, לך ל-**Site settings** → **Domain management**
2. לחץ **"Add custom domain"** והוסף את `travelsure.co.il`
3. עקוב אחר ההוראות לעדכון DNS records
4. כדי שהנתיב `/buyinsnew` יעבוד, תיצור **Redirect rule**:
   - לך ל-**Site settings** → **Redirects and rewrites**
   - הוסף redirect rule:
     ```
     /buyinsnew/*  /.netlify/functions/nextjs/:splat  200
     ```
   - או אם אתה משתמש ב-Netlify Functions, תיצור `_redirects` file ב-`public/`:
     ```
     /buyinsnew/*  /:splat  200
     ```

**או - אפשרות פשוטה יותר:**
אם האתר הקיים (`travelsure.co.il`) רץ על Netlify, תוכל להגדיר **Proxy** או **Redirect**:
- ב-Netlify של האתר הקיים, הוסף redirect:
  - From: `/buyinsnew/*`
  - To: `https://your-new-site.netlify.app/:splat`
  - Status: `200` (Proxy)

#### יתרונות:
- ✅ חינם לחלוטין
- ✅ SSL אוטומטי (HTTPS)
- ✅ עדכון אוטומטי בכל push ל-GitHub
- ✅ מהיר מאוד
- ✅ אותו שירות שאתה כבר מכיר מ-Lovable!
- ✅ תמיכה מלאה ב-Next.js

---

### אפשרות 2: Vercel (אלטרנטיבה)

---

**Vercel** היא הפלטפורמה של יוצרי Next.js:

1. היכנס ל-[vercel.com](https://vercel.com) והרשם (חינם)
2. לחץ על "Add New Project"
3. חבר את ה-GitHub repository שלך
4. Vercel יזהה אוטומטית שזה Next.js
5. לחץ "Deploy"

---

### אפשרות 3: פרסום ידני

אם אתה רוצה לפרסם ישירות מהמחשב:

**עם Netlify CLI:**
```bash
# התקן את Netlify CLI
npm i -g netlify-cli

# בתיקיית הפרויקט, הרץ:
netlify deploy

# או לפרסום קבוע:
netlify deploy --prod
```

**עם Vercel CLI:**
```bash
# התקן את Vercel CLI
npm i -g vercel

# בתיקיית הפרויקט, הרץ:
vercel
```

---

### הערות חשובות:

⚠️ **משתני סביבה (Environment Variables)**
אם יש לך משתני סביבה (API keys וכו'), תצטרך להוסיף אותם בהגדרות ה-deployment:
- ב-Vercel: Project Settings → Environment Variables
- ב-Netlify: Site Settings → Environment Variables

📝 **בדיקה מקומית לפני פרסום:**
```bash
npm run build
npm start
```
פתח `http://localhost:3000/buyinsnew` ובדוק שהכל עובד.

**הערה:** הפרויקט מוגדר לרוץ תחת `/buyinsnew`, אז כל הנתיבים יתחילו עם `/buyinsnew`.

---

### תמיכה
אם נתקלת בבעיות, בדוק:
- [תיעוד Netlify](https://docs.netlify.com/)
- [תיעוד Netlify + Next.js](https://docs.netlify.com/integrations/frameworks/next-js/)
- [תיעוד Vercel](https://vercel.com/docs)
- [תיעוד Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
