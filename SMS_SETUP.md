# הגדרת שירות SMS לשליחת קודי אימות

הפרויקט תומך בשליחת SMS אמיתי באמצעות Twilio או MessageBird.

## אפשרות 1: Twilio (מומלץ)

### שלב 1: רישום ל-Twilio
1. היכנס ל-[Twilio](https://www.twilio.com/)
2. צור חשבון חדש (יש trial חינם)
3. לאחר הרישום, תוכל לראות את:
   - **Account SID** (מתחיל ב-AC)
   - **Auth Token**
   - מספר טלפון שרכשת (או trial number)

### שלב 2: רכישת מספר טלפון (אם אין)
1. ב-Twilio Console, לך ל-Phone Numbers > Buy a number
2. בחר ישראל (Israel) ואזן מספר
3. רשם את המספר בפורמט בינלאומי: `+972501234567`

### שלב 3: הגדרת Environment Variables
הוסף את המשתנים הבאים ל-Supabase Secrets:

```bash
# דרך Supabase CLI
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+972501234567  # מספר הטלפון שרכשת

# אופציונלי: בחר provider
supabase secrets set SMS_PROVIDER=twilio

# אופציונלי: הגדר environment
supabase secrets set ENVIRONMENT=production
```

או דרך Supabase Dashboard:
1. לך ל-Project Settings > Edge Functions > Secrets
2. הוסף את המשתנים:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `ENVIRONMENT=production` (או `development` לבדיקות)

## אפשרות 2: MessageBird

### שלב 1: רישום ל-MessageBird
1. היכנס ל-[MessageBird](https://www.messagebird.com/)
2. צור חשבון חדש
3. קבל את **API Key** שלך

### שלב 2: הגדרת Environment Variables
```bash
supabase secrets set MESSAGEBIRD_API_KEY=your_api_key_here
supabase secrets set MESSAGEBIRD_ORIGINATOR=TravelSure  # שם השולח (או מספר)
supabase secrets set SMS_PROVIDER=messagebird
supabase secrets set ENVIRONMENT=production
```

## מצב Development (ללא SMS אמיתי)

אם אינך מעוניין לשלוח SMS אמיתי כרגע, הקוד יעבוד במצב development:
- הקוד יוצג בקונסול
- הקוד יוחזר גם בתגובה (רק ב-development)
- אין צורך ב-API keys

כדי להפעיל development mode:
```bash
supabase secrets set ENVIRONMENT=development
```

או פשוט אל תגדיר את משתני ה-SMS.

## בדיקה

1. בדוק שהפונקציה עובדת:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-otp \
  -H "Content-Type: application/json" \
  -d '{"id":"123456789","phone":"0501234567"}'
```

2. אם ה-SMS מוגדר נכון, תראה ב-logs:
```
SMS sent successfully: SM1234567890abcdef
```

3. אם לא, תראה:
```
[DEV MODE] OTP for 123456789 - 0501234567: 123456
```

## עלויות

- **Twilio Trial**: ~$15 קרדיט חינם, מספיק לכ-1000 הודעות
- **Twilio Production**: ~$0.0075-$0.01 לכל SMS לישראל
- **MessageBird**: מחירים דומים

## הערות חשובות

1. **פורמט מספר טלפון**: הקוד ממיר אוטומטית מספרים ישראלים (מתחיל ב-0) לפורמט בינלאומי (+972)

2. **Rate Limiting**: כדאי להוסיף rate limiting נוסף כדי למנוע שימוש יתר

3. **אבטחה**: לעולם אל תחשוף את ה-API keys ב-frontend או בקוד גלוי

4. **Testing**: ב-development mode, הקוד מוצג בקונסול ומוחזר בתגובה לנוחות בדיקה

5. **Production**: ב-production, הסר את החזרת הקוד בתגובה והסתמך רק על SMS

## פתרון בעיות

### SMS לא נשלח
1. בדוק שה-API keys מוגדרים נכון
2. בדוק שה-phone number בפורמט נכון (+972...)
3. בדוק את ה-Twilio logs ב-console שלהם
4. בדוק שה-account active ולא חסום

### שגיאת Authentication
- ודא שה-Account SID ו-Auth Token נכונים
- ודא שאין רווחים נוספים ב-secrets

### מספר לא תקין
- המספר חייב להיות בפורמט בינלאומי: +972501234567
- המספר חייב להיות מאומת ב-Twilio (או להיות trial number)
