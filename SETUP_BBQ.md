# הוראות התקנה מהירות - מנהל על האש

## שלב 1: יצירת הטבלאות ב-Supabase

**חשוב מאוד!** לפני שתוכל להשתמש במערכת, צריך ליצור את הטבלאות ב-Supabase.

### איך לעשות את זה:

1. **פתח את Supabase Dashboard**
   - לך ל-https://supabase.com/dashboard
   - בחר את הפרויקט שלך

2. **פתח את SQL Editor**
   - בתפריט השמאלי, לחץ על "SQL Editor"
   - לחץ על "New query"

3. **העתק והדבק את הקוד הבא:**

```sql
-- Create groups table (חבורות)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create members table (חברים קבועים)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, phone)
);

-- Create events table (אירועים - כל שבוע)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  total_cost NUMERIC(10, 2) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendees table (מי הגיע - חברים קבועים)
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Create guests table (אורחים)
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  visit_count INTEGER DEFAULT 1,
  should_pay BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table (תשלומים)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  payer_id UUID, -- יכול להיות member_id או guest_id
  payer_type TEXT NOT NULL CHECK (payer_type IN ('member', 'guest')),
  amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'confirmed')),
  payment_method TEXT,
  payment_proof TEXT, -- לינק או תמונה
  paid_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_member_id ON attendees(member_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate guest visit count
CREATE OR REPLACE FUNCTION get_guest_visit_count(guest_phone TEXT, group_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM guests g
    JOIN events e ON g.event_id = e.id
    WHERE g.phone = guest_phone 
    AND e.group_id = group_id_param
  );
END;
$$ LANGUAGE plpgsql;
```

4. **הרץ את השאילתה**
   - לחץ על כפתור "Run" (או Ctrl+Enter)
   - ודא שאתה רואה הודעה "Success"

5. **ודא שהטבלאות נוצרו**
   - לך ל-"Table Editor" בתפריט
   - אתה אמור לראות את הטבלאות: `groups`, `members`, `events`, `attendees`, `guests`, `payments`

## שלב 2: הגדרת משתני סביבה

ודא שיש לך קובץ `.env` בתיקיית הפרויקט עם:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

אתה יכול למצוא את הערכים האלה ב-Supabase Dashboard:
- Settings → API → Project URL (זה ה-URL)
- Settings → API → anon public key (זה ה-key)

## שלב 3: הרצת הפרויקט

```bash
npm run dev
```

פתח בדפדפן: `http://localhost:5173/bbq`

## בעיות נפוצות

### "לא הצלחנו לטעון את הקבוצה"
- **פתרון**: ודא שיצרת את הטבלאות ב-Supabase (שלב 1)

### "relation does not exist"
- **פתרון**: הטבלאות לא נוצרו. הרץ את ה-SQL שוב

### "Invalid API key"
- **פתרון**: ודא שמשתני הסביבה ב-`.env` נכונים

## אחרי ההתקנה

אחרי שיצרת את הטבלאות ורעננת את הדף, המערכת תיצור אוטומטית קבוצה בשם "העל האש שלנו" ותוכל להתחיל להשתמש!
