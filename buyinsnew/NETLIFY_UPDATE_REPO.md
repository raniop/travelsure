# 🔄 עדכון Netlify ל-Repository הנכון

## ⚠️ הבעיה:
Netlify עדיין מחובר ל-`travelsure-insurance-form` (הישן) במקום ל-`travelsure` (החדש).

## ✅ פתרון - עדכון Netlify:

### אופציה 1: עדכן את ה-Site הקיים (מומלץ)

1. **ב-Netlify, לך ל-site של `travelsure.co.il`** (או `ophirins.netlify.app`)

2. **Site settings → Build & deploy → Continuous deployment**

3. **לחץ "Link to a different branch"** או **"Edit settings"**

4. **עדכן את ההגדרות:**
   - **Repository:** בחר `raniop/travelsure` (במקום `travelsure-insurance-form`)
   - **Branch:** `main`
   - לחץ **"Save"**

5. **Site settings → Build & deploy → Build settings:**
   - **Base directory:** `buyinsnew`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - לחץ **"Save"**

6. **Trigger deployment:**
   - לך ל-**Deploys**
   - לחץ **"Trigger deploy"** → **"Deploy site"**

---

### אופציה 2: צור Site חדש (אם אתה רוצה לשמור על הישן)

1. **ב-Netlify → Add new site → Import from GitHub**

2. **בחר את ה-repository:** `raniop/travelsure`

3. **הגדרות:**
   - **Base directory:** `buyinsnew`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

4. **לחץ "Deploy site"**

5. **חבר את ה-domain:**
   - Site settings → Domain management
   - הוסף: `travelsure.co.il`
   - עדכן DNS records

---

## 📋 סיכום - מה לעשות:

### אם אתה רוצה לעדכן את ה-Site הקיים:

1. ✅ Netlify → Site settings → Build & deploy → Continuous deployment
2. ✅ שנה Repository ל: `raniop/travelsure`
3. ✅ עדכן Build settings:
   - Base directory: `buyinsnew`
   - Build command: `npm run build`
   - Publish directory: `.next`
4. ✅ Trigger deploy

### אם אתה רוצה Site חדש:

1. ✅ Netlify → Add new site → Import from GitHub
2. ✅ בחר: `raniop/travelsure`
3. ✅ הגדר Base directory: `buyinsnew`
4. ✅ Deploy

---

## 🔍 איך לבדוק שהכל עובד:

לאחר ה-deployment:

1. **פתח:** `https://travelsure.co.il/buyinsnew`
2. **ודא שהאתר עובד:**
   - הלוגו מופיע
   - תמונת הרקע מופיעה
   - אפשר להכניס תעודת זהות
   - הפרטים מתמלאים מיד

---

## 💡 הערה:

אם אתה רוצה, אפשר גם לעדכן את ה-repository הישן (`travelsure-insurance-form`) עם הקוד החדש, אבל זה לא הכרחי - עדיף להשתמש ב-`travelsure` כי שם יש את כל הפרויקטים יחד.
