# בדיקה ידנית של API

## 1. בדיקה בדפדפן

פתח את הדפדפן ונסה את ה-URL הבאים:

### בדיקה בסיסית - קבלת כל ההזמנות:
```
https://ophir.travelsure.co.il/api-bbq.ashx?entity=group_invitations
```

**תוצאה צפויה:** `[]` (מערך ריק JSON) או רשימת הזמנות ב-JSON

### בדיקה עם פילטר user_phone:
```
https://ophir.travelsure.co.il/api-bbq.ashx?entity=group_invitations&user_phone=0524444244
```

### בדיקה עם שני פילטרים:
```
https://ophir.travelsure.co.il/api-bbq.ashx?entity=group_invitations&user_phone=0524444244&group_id=508b8137-6897-4463-bee1-961badac85eb
```

---

## 2. בדיקה עם PowerShell

הרץ את הסקריפט `test-api.ps1`:

```powershell
.\test-api.ps1
```

---

## 3. בדיקה עם curl (אם יש לך)

```bash
# בדיקה בסיסית
curl "https://ophir.travelsure.co.il/api-bbq.ashx?entity=group_invitations"

# בדיקה עם פילטרים
curl "https://ophir.travelsure.co.il/api-bbq.ashx?entity=group_invitations&user_phone=0524444244&group_id=508b8137-6897-4463-bee1-961badac85eb"
```

---

## 4. מה לבדוק:

1. **אם מקבלים שגיאת 400 "Bad Request":**
   - הקובץ `api-bbq.ashx` לא עודכן על השרת
   - צריך להעלות את הקובץ מחדש

2. **אם מקבלים שגיאת 404:**
   - הקובץ לא קיים בנתיב הנכון
   - צריך לבדוק שהקובץ נמצא ב-`/TravSure/api-bbq.ashx`

3. **אם מקבלים HTML במקום JSON:**
   - השרת מחזיר דף שגיאה
   - צריך לבדוק את ה-logs של IIS

4. **אם מקבלים JSON תקין:**
   - הבעיה היא ב-proxy המקומי
   - צריך לבדוק את `vite.config.ts`

---

## 5. בדיקת קובץ על השרת

אם יש לך גישה לשרת, בדוק:

1. **מיקום הקובץ:**
   ```
   C:\inetpub\wwwroot\TravSure\api-bbq.ashx
   ```

2. **תאריך עדכון אחרון:**
   - הקובץ צריך להיות מעודכן לאחרונה (היום)

3. **תוכן הקובץ:**
   - חפש את המילה `group_invitations` בקובץ
   - צריך להיות case עבור `group_invitations` ב-`HandleGet`

---

## 6. בדיקת IIS Logs

אם יש לך גישה ל-logs של IIS, בדוק:
```
C:\inetpub\logs\LogFiles\W3SVC1\
```

חפש בקובץ האחרון:
- את ה-URL של הבקשה
- את סטטוס הקוד (400, 404, 500)
- את ה-error message
