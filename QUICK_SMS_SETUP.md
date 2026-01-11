# הגדרה מהירה לשליחת SMS - שלבים קצרים

## אופציה 1: Twilio (5 דקות)

1. **הרשמה**: https://www.twilio.com/try-twilio (חינם)
2. **קבל את ה-Credentials**:
   - Account SID (מתחיל ב-AC)
   - Auth Token
   - Trial Phone Number (או קנה מספר)
3. **הגדר ב-Supabase**:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_PHONE_NUMBER=+972501234567
   ```
4. **זהו!** - ה-SMS יעבוד אוטומטית

## אופציה 2: מצב Development (ללא SMS אמיתי)

אם אתה רוצה לבדוק בלי SMS אמיתי:
```bash
supabase secrets set ENVIRONMENT=development
```

הקוד יוצג בקונסול ויוחזר בתגובה.

## בדיקה

1. פתח את העמוד: http://localhost:8081/verify-identity
2. הזן תעודת זהות וטלפון
3. לחץ "שלח קוד אימות"
4. אם SMS מוגדר - תקבל הודעה
5. אם לא - תראה את הקוד בקונסול/תגובה

## טיפים

- **Trial של Twilio**: ~$15 חינם, מספיק ל-1000 הודעות
- **מספר טלפון**: צריך להיות בפורמט +972501234567
- **עלויות**: ~$0.0075-$0.01 לכל SMS בישראל

## בעיות?

קרא את `SMS_SETUP.md` להסבר מפורט יותר.
