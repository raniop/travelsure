# הוראות מעבר לשרת שלכם

יצרתי API endpoints חדשים שעובדים עם השרת שלכם!

## מה נוצר:

1. **`api-bbq.php`** - API endpoint ב-PHP
2. **`api-bbq.ashx`** - API endpoint ב-C# (אם אתם משתמשים ב-IIS עם .NET)
3. **`src/integrations/api/client.ts`** - Client חדש לעבודה עם ה-API

## מה צריך לעשות:

### 1. העתק את קובץ ה-API לשרת שלכם

**אם אתם משתמשים ב-PHP:**
- העתק את `api-bbq.php` לתיקיית השרת שלכם (איפה שיש את `api-shatap.php`)

**אם אתם משתמשים ב-C# / IIS:**
- העתק את `api-bbq.ashx` לתיקיית השרת שלכם (איפה שיש את `api-shatap.ashx`)
- ודא שיש לכם את `Newtonsoft.Json` מותקן (NuGet package)

### 2. הנתונים נשמרים ב-JSON files

הנתונים יישמרו אוטומטית בתיקייה:
- **PHP**: `data/bbq/` (יחסית לקובץ ה-PHP)
- **C#**: `App_Data/bbq/` (בתיקיית ה-Web)

התיקייה תיווצר אוטומטית - אין צורך ליצור אותה ידנית!

### 3. עדכן את ה-URL ב-`.env` (אופציונלי)

אם ה-API לא באותו שרת, תוכל להוסיף ב-`.env`:
```
VITE_API_BASE_URL=https://your-server.com/api-bbq.php
```

אם זה באותו שרת, זה יעבוד אוטומטית.

## איך זה עובד:

הנתונים נשמרים ב-JSON files בתיקיות:
- `data/bbq/groups/` - קבוצות
- `data/bbq/members/` - חברים
- `data/bbq/events/` - אירועים
- `data/bbq/attendees/` - משתתפים
- `data/bbq/guests/` - אורחים
- `data/bbq/payments/` - תשלומים

כל רשומה נשמרת בקובץ JSON נפרד.

## יתרונות:

✅ **לא צריך Supabase** - הכל עובד עם השרת שלכם
✅ **פשוט** - JSON files, לא צריך מסד נתונים
✅ **מהיר** - עובד מיד אחרי העתקת הקובץ
✅ **גיבוי קל** - פשוט לגבות את תיקיית `data/bbq`

## אם אתם רוצים מסד נתונים אמיתי:

אם יש לכם SQL Server או MySQL, אני יכול לשנות את ה-API לעבוד איתם. רק תגידו לי!

## בדיקה:

אחרי שהעתקתם את הקובץ, פתחו:
```
http://your-server.com/api-bbq.php?entity=groups
```

אתם אמורים לראות `[]` (רשימה ריקה) - זה אומר שזה עובד!
