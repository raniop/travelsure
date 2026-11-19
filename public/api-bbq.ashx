<%@ WebHandler Language="C#" Class="BBQHandler" %>
<%@ Assembly Name="System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %>

using System;
using System.Web;
using System.IO;
using System.Net;
using System.Text;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;

public class BBQHandler : IHttpHandler
{
    // ---------------------------------------------------------------------------------------------
    // Security layer: sign-in is checked here on the server, passwords are stored hashed and never
    // returned, every request needs a session token, and entity/id cannot point outside App_Data.
    // ---------------------------------------------------------------------------------------------
    private const string TokenHeader = "X-BBQ-Token";
    private const int SessionDays = 180;
    private const int HashIterations = 20000;
    private static readonly HashSet<string> AllowedEntities = new HashSet<string>(new string[] {
        "groups", "events", "members", "payments", "polls", "attendees", "guests", "users", "group_invitations", "ledger", "transfers", "receipts"
    });
    private static readonly Regex SafeId = new Regex("^[A-Za-z0-9_\\-]{1,100}$");
    private static readonly Regex TokenFormat = new Regex("^[a-f0-9]{64}$");
    private static readonly ConcurrentDictionary<string, int[]> FailedLogins = new ConcurrentDictionary<string, int[]>();

    private static JavaScriptSerializer Json()
    {
        JavaScriptSerializer s = new JavaScriptSerializer();
        s.MaxJsonLength = int.MaxValue;
        return s;
    }

    private static void WriteJson(HttpContext context, int status, object value)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Write(Json().Serialize(value));
    }

    private static Dictionary<string, object> ParseObject(string json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        if (json.Length > 0 && json[0] == (char)0xFEFF) json = json.Substring(1);
        try { return Json().Deserialize<Dictionary<string, object>>(json); }
        catch { return null; }
    }

    private static string Str(Dictionary<string, object> d, string key)
    {
        object v;
        if (d == null || !d.TryGetValue(key, out v) || v == null) return "";
        return Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture);
    }

    private static string Digits(string s)
    {
        return Regex.Replace(s ?? "", "[^0-9]", "");
    }

    /** A copy of the user without any secret fields. */
    private static Dictionary<string, object> PublicUser(Dictionary<string, object> user)
    {
        Dictionary<string, object> copy = new Dictionary<string, object>(user);
        copy.Remove("password");
        copy.Remove("password_hash");
        return copy;
    }

    private static string HashPassword(string password)
    {
        byte[] salt = new byte[16];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(salt);
        using (Rfc2898DeriveBytes kdf = new Rfc2898DeriveBytes(password, salt, HashIterations))
        {
            return "pbkdf2$" + HashIterations + "$" + Convert.ToBase64String(salt) + "$" + Convert.ToBase64String(kdf.GetBytes(32));
        }
    }

    private static bool VerifyPassword(string password, string stored)
    {
        try
        {
            string[] parts = (stored ?? "").Split('$');
            if (parts.Length != 4 || parts[0] != "pbkdf2") return false;
            int iterations = int.Parse(parts[1]);
            byte[] salt = Convert.FromBase64String(parts[2]);
            byte[] expected = Convert.FromBase64String(parts[3]);
            using (Rfc2898DeriveBytes kdf = new Rfc2898DeriveBytes(password, salt, iterations))
            {
                return FixedTimeEquals(kdf.GetBytes(expected.Length), expected);
            }
        }
        catch { return false; }
    }

    private static bool FixedTimeEquals(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        int diff = 0;
        for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        return FixedTimeEquals(Encoding.UTF8.GetBytes(a ?? ""), Encoding.UTF8.GetBytes(b ?? ""));
    }

    private string UserFolder(string dataFolder) { return Path.Combine(dataFolder, "users"); }

    private List<Dictionary<string, object>> LoadAllUsers(string dataFolder)
    {
        List<Dictionary<string, object>> users = new List<Dictionary<string, object>>();
        string folder = UserFolder(dataFolder);
        if (!Directory.Exists(folder)) return users;
        foreach (string file in Directory.GetFiles(folder, "*.json"))
        {
            Dictionary<string, object> u = ParseObject(File.ReadAllText(file, Encoding.UTF8));
            if (u == null) continue;
            if (Str(u, "id") == "") u["id"] = Path.GetFileNameWithoutExtension(file);
            u["__file"] = Path.GetFileNameWithoutExtension(file);
            users.Add(u);
        }
        return users;
    }

    private Dictionary<string, object> FindUserByPhone(string dataFolder, string phone)
    {
        foreach (Dictionary<string, object> u in LoadAllUsers(dataFolder))
        {
            if (Digits(Str(u, "phone")) == phone) return u;
        }
        return null;
    }

    private void SaveUser(string dataFolder, Dictionary<string, object> user)
    {
        string fileId = Str(user, "__file");
        if (fileId == "") fileId = Str(user, "id");
        Dictionary<string, object> toSave = new Dictionary<string, object>(user);
        toSave.Remove("__file");
        SaveEntityJson("users", fileId, Json().Serialize(toSave), dataFolder);
    }

    private Dictionary<string, object> StripInternal(Dictionary<string, object> user)
    {
        Dictionary<string, object> pub = PublicUser(user);
        pub.Remove("__file");
        return pub;
    }

    private string CreateSession(string dataFolder, string userId)
    {
        byte[] bytes = new byte[32];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
        string token = BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        string folder = Path.Combine(dataFolder, "sessions");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        Dictionary<string, object> session = new Dictionary<string, object>();
        session["user_id"] = userId;
        session["created_at"] = DateTime.UtcNow.ToString("o");
        session["expires_at"] = DateTime.UtcNow.AddDays(SessionDays).ToString("o");
        File.WriteAllText(Path.Combine(folder, token + ".json"), Json().Serialize(session), Encoding.UTF8);
        return token;
    }

    /** Returns the signed-in user id for the request token, or null. */
    /**
     * The token comes in the header, or in ?auth= (IIS answers OPTIONS itself without CORS headers,
     * so the app sends preflight-free "simple" requests and cannot use a custom header cross-origin).
     */
    private static string RequestToken(HttpContext context)
    {
        string token = context.Request.Headers[TokenHeader];
        if (string.IsNullOrEmpty(token)) token = context.Request.QueryString["auth"];
        return (token ?? "").Trim().ToLowerInvariant();
    }

    private string SessionUserId(HttpContext context, string dataFolder)
    {
        string token = RequestToken(context);
        if (!TokenFormat.IsMatch(token)) return null;
        string path = Path.Combine(Path.Combine(dataFolder, "sessions"), token + ".json");
        if (!File.Exists(path)) return null;
        Dictionary<string, object> session = ParseObject(File.ReadAllText(path, Encoding.UTF8));
        if (session == null) return null;
        DateTime expires;
        if (!DateTime.TryParse(Str(session, "expires_at"), null, System.Globalization.DateTimeStyles.RoundtripKind, out expires)
            || expires.ToUniversalTime() < DateTime.UtcNow)
        {
            try { File.Delete(path); } catch { }
            return null;
        }
        string userId = Str(session, "user_id");
        if (userId == "" || !SafeId.IsMatch(userId)) return null;
        if (!File.Exists(Path.Combine(UserFolder(dataFolder), userId + ".json"))) return null;
        return userId;
    }

    private static bool TooManyFailures(string phone)
    {
        int[] state;
        if (!FailedLogins.TryGetValue(phone, out state)) return false;
        // state[0] = failures, state[1] = minute stamp of the last failure
        int nowMinute = (int)(DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute % int.MaxValue);
        if (nowMinute - state[1] > 10) { FailedLogins.TryRemove(phone, out state); return false; }
        return state[0] >= 8;
    }

    private static void NoteFailure(string phone)
    {
        int nowMinute = (int)(DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute % int.MaxValue);
        FailedLogins.AddOrUpdate(phone, new int[] { 1, nowMinute }, (k, s) => new int[] { s[0] + 1, nowMinute });
    }

    private static string ReadBody(HttpContext context)
    {
        using (StreamReader reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            return reader.ReadToEnd();
        }
    }

    private void HandleLogin(HttpContext context, string dataFolder)
    {
        Dictionary<string, object> body = ParseObject(ReadBody(context));
        string phone = Digits(Str(body, "phone"));
        string password = Str(body, "password");
        if (phone.Length < 9 || password == "")
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "missing_fields" } });
            return;
        }
        if (TooManyFailures(phone))
        {
            WriteJson(context, 429, new Dictionary<string, object> { { "error", "too_many_attempts" } });
            return;
        }
        Dictionary<string, object> user = FindUserByPhone(dataFolder, phone);
        if (user == null)
        {
            WriteJson(context, 404, new Dictionary<string, object> { { "error", "user_not_found" } });
            return;
        }

        bool ok = false;
        bool passwordSet = false;
        string hash = Str(user, "password_hash");
        string legacy = Str(user, "password");
        if (hash != "")
        {
            ok = VerifyPassword(password, hash);
        }
        else if (legacy != "")
        {
            ok = FixedTimeEquals(password, legacy);
        }
        else
        {
            // Users registered before passwords existed set theirs on first sign-in (same as before).
            ok = true;
            passwordSet = true;
        }

        if (!ok)
        {
            NoteFailure(phone);
            WriteJson(context, 401, new Dictionary<string, object> { { "error", "wrong_password" } });
            return;
        }

        if (hash == "")
        {
            user["password_hash"] = HashPassword(password);
            user.Remove("password");
            SaveUser(dataFolder, user);
        }
        int[] ignored;
        FailedLogins.TryRemove(phone, out ignored);

        string userId = Str(user, "__file");
        WriteJson(context, 200, new Dictionary<string, object> {
            { "token", CreateSession(dataFolder, userId) },
            { "user", StripInternal(user) },
            { "password_set", passwordSet }
        });
    }

    private void HandleRegister(HttpContext context, string dataFolder)
    {
        Dictionary<string, object> body = ParseObject(ReadBody(context));
        string phone = Digits(Str(body, "phone"));
        string password = Str(body, "password");
        string name = Str(body, "name").Trim();
        if (phone.Length < 9 || password == "" || name == "")
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "missing_fields" } });
            return;
        }
        string userId = "user_" + phone;
        if (FindUserByPhone(dataFolder, phone) != null || File.Exists(Path.Combine(UserFolder(dataFolder), userId + ".json")))
        {
            WriteJson(context, 409, new Dictionary<string, object> { { "error", "user_exists" } });
            return;
        }
        Dictionary<string, object> user = new Dictionary<string, object>();
        user["id"] = userId;
        user["name"] = name;
        user["phone"] = phone;
        user["password_hash"] = HashPassword(password);
        user["created_at"] = DateTime.UtcNow.ToString("o");
        SaveUser(dataFolder, user);
        WriteJson(context, 200, new Dictionary<string, object> {
            { "token", CreateSession(dataFolder, userId) },
            { "user", StripInternal(user) }
        });
    }

    private void HandleLogout(HttpContext context, string dataFolder)
    {
        string token = RequestToken(context);
        if (TokenFormat.IsMatch(token))
        {
            string path = Path.Combine(Path.Combine(dataFolder, "sessions"), token + ".json");
            try { if (File.Exists(path)) File.Delete(path); } catch { }
        }
        WriteJson(context, 200, new Dictionary<string, object> { { "success", true } });
    }

    /** All reads/writes of users go through here: secrets never leave, and only you can change you. */
    private void HandleUsers(HttpContext context, string action, string id, string sessionUserId, string dataFolder)
    {
        string method = context.Request.HttpMethod;
        bool isUpdate = method == "PUT" || (method == "POST" && action == "update");
        bool isDelete = method == "DELETE" || (method == "POST" && action == "delete");

        if (method == "GET")
        {
            if (id != "")
            {
                Dictionary<string, object> one = ParseObject(LoadEntityJson("users", id, dataFolder));
                if (one == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } }); return; }
                WriteJson(context, 200, PublicUser(one));
                return;
            }
            List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
            foreach (Dictionary<string, object> u in LoadAllUsers(dataFolder)) list.Add(StripInternal(u));
            WriteJson(context, 200, list);
            return;
        }

        if (isUpdate)
        {
            if (id == "" || id != sessionUserId)
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            Dictionary<string, object> existing = ParseObject(LoadEntityJson("users", id, dataFolder));
            Dictionary<string, object> body = ParseObject(ReadBody(context));
            if (existing == null || body == null)
            {
                WriteJson(context, existing == null ? 404 : 400, new Dictionary<string, object> { { "error", existing == null ? "Not found" : "Invalid body" } });
                return;
            }
            foreach (KeyValuePair<string, object> kv in body)
            {
                if (kv.Key == "id" || kv.Key == "phone" || kv.Key == "password" || kv.Key == "password_hash"
                    || kv.Key == "created_at" || kv.Key == "isAdmin" || kv.Key == "__file") continue;
                existing[kv.Key] = kv.Value;
            }
            string newPassword = Str(body, "password");
            if (newPassword != "")
            {
                existing["password_hash"] = HashPassword(newPassword);
                existing.Remove("password");
            }
            existing["id"] = id;
            existing["__file"] = id;
            SaveUser(dataFolder, existing);
            WriteJson(context, 200, StripInternal(existing));
            return;
        }

        if (isDelete)
        {
            if (id == "" || id != sessionUserId)
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            HandleDelete(context, "users", dataFolder);
            return;
        }

        // New users are created through action=register only.
        WriteJson(context, 400, new Dictionary<string, object> { { "error", "use_register" } });
    }

    /** Returns true when the request was handled (or rejected) by the security layer. */
    private bool HandleSecurity(HttpContext context, string dataFolder)
    {
        string entity = (context.Request.QueryString["entity"] ?? "").ToLowerInvariant();
        string action = context.Request.QueryString["action"] ?? "";
        string id = context.Request.QueryString["id"] ?? "";

        if (action == "login" && context.Request.HttpMethod == "POST") { HandleLogin(context, dataFolder); return true; }
        if (action == "register" && context.Request.HttpMethod == "POST") { HandleRegister(context, dataFolder); return true; }
        if (action == "logout") { HandleLogout(context, dataFolder); return true; }
        if (action == "webhook")
        {
            // PayBox has no webhook for personal groups; this open endpoint let anyone mark payments as paid.
            WriteJson(context, 410, new Dictionary<string, object> { { "error", "webhook_disabled" } });
            return true;
        }

        if (action == "public" || action == "public_receipt" || action == "public_transfer")
        {
            HandlePublic(context, dataFolder);
            return true;
        }
        if (action == "otp_start" || action == "otp_verify")
        {
            HandleOtp(context, action, dataFolder);
            return true;
        }

        bool streakAction = action == "streak" || action == "streak_close" || action == "streak_choice";
        if (!AllowedEntities.Contains(entity) && action != "member_link" && action != "paybox" && action != "paybox_notes" && action != "ledger_note" && !streakAction)
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "Invalid entity" } });
            return true;
        }
        if (id != "" && !SafeId.IsMatch(id))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "Invalid id" } });
            return true;
        }

        string sessionUserId = SessionUserId(context, dataFolder);
        if (sessionUserId == null)
        {
            WriteJson(context, 401, new Dictionary<string, object> { { "error", "auth_required" } });
            return true;
        }

        if (entity == "users")
        {
            HandleUsers(context, action, id, sessionUserId, dataFolder);
            return true;
        }
        if (action == "member_link")
        {
            HandleMemberLink(context, sessionUserId, dataFolder);
            return true;
        }
        if (action == "paybox")
        {
            HandlePaybox(context, sessionUserId, dataFolder);
            return true;
        }
        if (action == "paybox_notes")
        {
            HandlePayboxNotes(context, sessionUserId, dataFolder);
            return true;
        }
        if (action == "ledger_note")
        {
            HandleLedgerNote(context, sessionUserId, dataFolder);
            return true;
        }
        if (streakAction)
        {
            HandleStreak(context, action, sessionUserId, dataFolder);
            return true;
        }
        if (entity == "transfers")
        {
            HandleTransfers(context, action, id, sessionUserId, dataFolder);
            return true;
        }
        if (entity == "receipts")
        {
            HandleReceipts(context, action, id, sessionUserId, dataFolder);
            return true;
        }
        if (entity == "ledger")
        {
            HandleLedger(context, sessionUserId, dataFolder);
            return true;
        }
        bool isMemberUpdate = entity == "members" && id != ""
            && (context.Request.HttpMethod == "PUT" || (context.Request.HttpMethod == "POST" && action == "update"));
        if (isMemberUpdate)
        {
            HandleMemberUpdate(context, id, sessionUserId, dataFolder);
            return true;
        }
        return false;
    }

    // ---------------------------------------------------------------------------------------------
    // Ledger: every change to a member's balance is recorded here by the server (append-only).
    // Only the group owner can change a balance; the app cannot write, edit or delete entries.
    // ---------------------------------------------------------------------------------------------
    private static readonly HashSet<string> LedgerTypes = new HashSet<string>(new string[] {
        "deposit", "charge", "refund", "adjustment", "transfer", "prize"
    });

    private static decimal Num(object v)
    {
        if (v == null) return 0m;
        decimal d;
        if (decimal.TryParse(Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture),
            System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out d))
            return Math.Round(d, 2);
        return 0m;
    }

    private Dictionary<string, object> LoadEntity(string entity, string id, string dataFolder)
    {
        if (string.IsNullOrEmpty(id) || !SafeId.IsMatch(id)) return null;
        return ParseObject(LoadEntityJson(entity, id, dataFolder));
    }

    private List<Dictionary<string, object>> LoadAll(string entity, string dataFolder)
    {
        List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
        string folder = Path.Combine(dataFolder, entity);
        if (!Directory.Exists(folder)) return list;
        foreach (string file in Directory.GetFiles(folder, "*.json"))
        {
            Dictionary<string, object> d = ParseObject(File.ReadAllText(file, Encoding.UTF8));
            if (d != null) list.Add(d);
        }
        return list;
    }

    private bool IsGroupOwner(string groupId, string userId, string dataFolder)
    {
        Dictionary<string, object> group = LoadEntity("groups", groupId, dataFolder);
        return group != null && Str(group, "owner_id") == userId;
    }

    /** Owner, or a member of the group whose phone is the signed-in user's phone. */
    private bool CanSeeGroup(string groupId, string userId, string dataFolder)
    {
        if (IsGroupOwner(groupId, userId, dataFolder)) return true;
        Dictionary<string, object> user = LoadEntity("users", userId, dataFolder);
        string phone = Digits(Str(user, "phone"));
        if (phone == "") return false;
        foreach (Dictionary<string, object> m in LoadAll("members", dataFolder))
        {
            if (Str(m, "group_id") == groupId && Digits(Str(m, "phone")) == phone) return true;
        }
        return false;
    }

    private void WriteLedgerEntry(string dataFolder, Dictionary<string, object> entry)
    {
        string id = Guid.NewGuid().ToString();
        entry["id"] = id;
        if (!entry.ContainsKey("created_at")) entry["created_at"] = DateTime.UtcNow.ToString("o");
        SaveEntityJson("ledger", id, Json().Serialize(entry), dataFolder);
    }

    private bool HasLedgerEntries(string memberId, string dataFolder)
    {
        foreach (Dictionary<string, object> e in LoadAll("ledger", dataFolder))
        {
            if (Str(e, "member_id") == memberId) return true;
        }
        return false;
    }

    /** Writes the ledger line for a balance change (and the opening line the first time). */
    private string AppendBalanceChange(string dataFolder, string memberId, string groupId, decimal oldBalance,
        decimal newBalance, string type, string note, string eventId, string actorId)
    {
        Dictionary<string, object> actor = LoadEntity("users", actorId, dataFolder);
        string actorName = Str(actor, "name");
        if (!HasLedgerEntries(memberId, dataFolder))
        {
            Dictionary<string, object> opening = new Dictionary<string, object>();
            opening["group_id"] = groupId;
            opening["member_id"] = memberId;
            opening["type"] = "opening";
            opening["amount"] = oldBalance;
            opening["balance_before"] = 0m;
            opening["balance_after"] = oldBalance;
            opening["note"] = "";
            opening["created_by"] = actorId;
            opening["created_by_name"] = actorName;
            opening["created_at"] = DateTime.UtcNow.AddMilliseconds(-1).ToString("o");
            WriteLedgerEntry(dataFolder, opening);
        }
        note = (note ?? "").Trim();
        if (note.Length > 300) note = note.Substring(0, 300);
        if (!SafeId.IsMatch(eventId ?? "")) eventId = "";
        Dictionary<string, object> entry = new Dictionary<string, object>();
        entry["group_id"] = groupId;
        entry["member_id"] = memberId;
        entry["type"] = type;
        entry["amount"] = newBalance - oldBalance;
        entry["balance_before"] = oldBalance;
        entry["balance_after"] = newBalance;
        entry["note"] = note;
        entry["event_id"] = eventId;
        entry["created_by"] = actorId;
        entry["created_by_name"] = actorName;
        WriteLedgerEntry(dataFolder, entry);
        return Str(entry, "id");
    }

    private void HandleMemberUpdate(HttpContext context, string id, string sessionUserId, string dataFolder)
    {
        string raw = ReadBody(context);
        Dictionary<string, object> body = ParseObject(raw);
        Dictionary<string, object> existing = LoadEntity("members", id, dataFolder);
        if (body == null || existing == null)
        {
            HandlePutWithBody(context, "members", dataFolder, raw);
            return;
        }

        Dictionary<string, object> hint = null;
        object hintObj;
        if (body.TryGetValue("_ledger", out hintObj)) hint = hintObj as Dictionary<string, object>;
        body.Remove("_ledger");

        string groupId = Str(existing, "group_id");
        decimal oldBalance = Num(existing.ContainsKey("balance") ? existing["balance"] : null);
        bool hasNewBalance = body.ContainsKey("balance") && body["balance"] != null;
        decimal newBalance = hasNewBalance ? Num(body["balance"]) : oldBalance;

        if (newBalance != oldBalance)
        {
            if (!IsGroupOwner(groupId, sessionUserId, dataFolder))
            {
                // Only the group owner moves money; anyone else's save keeps the stored balance.
                if (existing.ContainsKey("balance")) body["balance"] = existing["balance"]; else body.Remove("balance");
            }
            else
            {
                string type = Str(hint, "type");
                if (!LedgerTypes.Contains(type) || type == "transfer") type = "adjustment";
                AppendBalanceChange(dataFolder, id, groupId, oldBalance, newBalance, type,
                    Str(hint, "note"), Str(hint, "event_id"), sessionUserId);
            }
        }

        HandlePutWithBody(context, "members", dataFolder, Json().Serialize(body));
    }

    /**
     * POST action=ledger_note&id={entryId} {note}: the group owner adds a note to an existing ledger
     * line. Amount, balances, date and the original note stay untouched; the note is kept separately
     * with when and by whom it was added.
     */
    private void HandleLedgerNote(HttpContext context, string sessionUserId, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        Dictionary<string, object> entry = LoadEntity("ledger", id, dataFolder);
        if (context.Request.HttpMethod != "POST" || entry == null || !IsGroupOwner(Str(entry, "group_id"), sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        Dictionary<string, object> body = ParseObject(ReadBody(context)) ?? new Dictionary<string, object>();
        string note = Str(body, "note").Trim();
        if (note.Length > 300) note = note.Substring(0, 300);
        if (note == "")
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "missing_note" } });
            return;
        }
        Dictionary<string, object> actor = LoadEntity("users", sessionUserId, dataFolder);
        entry["note_added"] = note;
        entry["note_added_at"] = DateTime.UtcNow.ToString("o");
        entry["note_added_by_name"] = Str(actor, "name");
        SaveEntityJson("ledger", id, Json().Serialize(entry), dataFolder);
        WriteJson(context, 200, entry);
    }

    // ---------------------------------------------------------------------------------------------
    // Monthly attendance prize ("אלוף ההתמדה"): who came to the most events in a month. A tie is
    // decided by a raffle drawn here on the server (once; the result is stored and cannot be redrawn).
    // Every member, the winner too, pays the same share; the winner takes it as credit or as a gift.
    // ---------------------------------------------------------------------------------------------
    private const decimal PrizeShare = 10m;
    private const int PrizeMinEvents = 2;
    private static readonly Regex MonthFormat = new Regex("^20[0-9]{2}-(0[1-9]|1[0-2])$");
    private static readonly string[] HebrewMonths = new string[] {
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    };

    private static DateTime IsraelNow()
    {
        try { return TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Israel Standard Time"); }
        catch { return DateTime.UtcNow.AddHours(2); }
    }

    private static string MonthLabel(string month)
    {
        int m = int.Parse(month.Substring(5, 2));
        return HebrewMonths[m - 1] + " " + month.Substring(0, 4);
    }

    private static int RandomIndex(int n)
    {
        byte[] b = new byte[4];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(b);
        return (int)(BitConverter.ToUInt32(b, 0) % (uint)n);
    }

    private List<Dictionary<string, object>> GroupMembers(string groupId, string dataFolder)
    {
        List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
        foreach (Dictionary<string, object> m in LoadAll("members", dataFolder))
            if (Str(m, "group_id") == groupId) list.Add(m);
        return list;
    }

    /** The month's table: events that already took place, and how many of them each member came to. */
    private Dictionary<string, object> BuildStreak(string groupId, string month, string dataFolder)
    {
        string now = IsraelNow().ToString("yyyy-MM-dd HH:mm", System.Globalization.CultureInfo.InvariantCulture);
        HashSet<string> monthEvents = new HashSet<string>();
        foreach (Dictionary<string, object> e in LoadAll("events", dataFolder))
        {
            if (Str(e, "group_id") != groupId) continue;
            string date = Str(e, "event_date").Replace("T", " ");
            if (!date.StartsWith(month)) continue;
            if (string.CompareOrdinal(date.Length > 16 ? date.Substring(0, 16) : date, now) > 0) continue;
            monthEvents.Add(Str(e, "id"));
        }
        List<Dictionary<string, object>> members = GroupMembers(groupId, dataFolder);
        Dictionary<string, int> count = new Dictionary<string, int>();
        foreach (Dictionary<string, object> m in members) count[Str(m, "id")] = 0;
        HashSet<string> seen = new HashSet<string>();
        foreach (Dictionary<string, object> a in LoadAll("attendees", dataFolder))
        {
            string ev = Str(a, "event_id");
            string mid = Str(a, "member_id");
            if (!monthEvents.Contains(ev) || !count.ContainsKey(mid) || Str(a, "attended") == "False") continue;
            if (!seen.Add(ev + "|" + mid)) continue;
            count[mid]++;
        }
        List<Dictionary<string, object>> rows = new List<Dictionary<string, object>>();
        int best = 0;
        foreach (Dictionary<string, object> m in members)
        {
            int c = count[Str(m, "id")];
            if (c > best) best = c;
            Dictionary<string, object> r = Pick(m, "id", "name", "nickname");
            r["count"] = c;
            rows.Add(r);
        }
        rows.Sort((x, y) => {
            int byCount = ((int)y["count"]).CompareTo((int)x["count"]);
            return byCount != 0 ? byCount : string.CompareOrdinal(Str(x, "name"), Str(y, "name"));
        });
        List<string> leaders = new List<string>();
        if (best > 0) foreach (Dictionary<string, object> r in rows) if ((int)r["count"] == best) leaders.Add(Str(r, "id"));

        Dictionary<string, object> result = new Dictionary<string, object>();
        result["month"] = month;
        result["month_label"] = MonthLabel(month);
        result["events"] = monthEvents.Count;
        result["rows"] = rows;
        result["best"] = best;
        result["leaders"] = leaders;
        result["share"] = PrizeShare;
        result["prize_total"] = PrizeShare * members.Count;
        result["min_events"] = PrizeMinEvents;
        result["is_current"] = month == IsraelNow().ToString("yyyy-MM");
        result["prize"] = LoadEntity("prizes", groupId + "_" + month, dataFolder);
        return result;
    }

    private List<object> PrizeHall(string groupId, string dataFolder)
    {
        List<Dictionary<string, object>> mine = new List<Dictionary<string, object>>();
        foreach (Dictionary<string, object> p in LoadAll("prizes", dataFolder))
            if (Str(p, "group_id") == groupId) mine.Add(p);
        mine.Sort((a, b) => string.CompareOrdinal(Str(b, "month"), Str(a, "month")));
        List<object> hall = new List<object>();
        foreach (Dictionary<string, object> p in mine)
            hall.Add(Pick(p, "month", "month_label", "winner_id", "winner_name", "best", "events", "candidates", "choice", "gift_note", "total"));
        return hall;
    }

    /** Sets a member's balance and writes its ledger line. */
    private void ChangeBalance(string dataFolder, Dictionary<string, object> member, decimal delta, string type, string note, string actorId)
    {
        string id = Str(member, "id");
        decimal oldBalance = Num(member.ContainsKey("balance") ? member["balance"] : null);
        decimal newBalance = oldBalance + delta;
        AppendBalanceChange(dataFolder, id, Str(member, "group_id"), oldBalance, newBalance, type, note, "", actorId);
        member["balance"] = newBalance;
        member["updated_at"] = DateTime.UtcNow.ToString("o");
        SaveEntityJson("members", id, Json().Serialize(member), dataFolder);
    }

    /**
     * GET action=streak&group_id&month=YYYY-MM: the month's table, its prize and the hall of fame.
     * POST action=streak_close: (owner, after the month ended) picks the winner and charges the shares.
     * POST action=streak_choice {choice: credit|gift, gift_note}: (owner) records what the winner chose.
     */
    private void HandleStreak(HttpContext context, string action, string sessionUserId, string dataFolder)
    {
        string groupId = context.Request.QueryString["group_id"] ?? "";
        string month = context.Request.QueryString["month"] ?? "";
        if (month == "") month = IsraelNow().ToString("yyyy-MM");
        if (!SafeId.IsMatch(groupId) || !MonthFormat.IsMatch(month))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_request" } });
            return;
        }
        if (action == "streak")
        {
            if (!CanSeeGroup(groupId, sessionUserId, dataFolder))
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            Dictionary<string, object> table = BuildStreak(groupId, month, dataFolder);
            table["hall"] = PrizeHall(groupId, dataFolder);
            context.Response.Headers.Add("Cache-Control", "no-store");
            WriteJson(context, 200, table);
            return;
        }
        if (context.Request.HttpMethod != "POST" || !IsGroupOwner(groupId, sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        string prizeId = groupId + "_" + month;
        Dictionary<string, object> prize = LoadEntity("prizes", prizeId, dataFolder);
        Dictionary<string, object> actor = LoadEntity("users", sessionUserId, dataFolder);

        if (action == "streak_close")
        {
            if (prize != null) { WriteJson(context, 409, new Dictionary<string, object> { { "error", "already_closed" }, { "prize", prize } }); return; }
            if (string.CompareOrdinal(month, IsraelNow().ToString("yyyy-MM")) >= 0) { WriteJson(context, 400, new Dictionary<string, object> { { "error", "month_not_over" } }); return; }
            Dictionary<string, object> table = BuildStreak(groupId, month, dataFolder);
            List<string> leaders = (List<string>)table["leaders"];
            if ((int)table["events"] < PrizeMinEvents) { WriteJson(context, 400, new Dictionary<string, object> { { "error", "not_enough_events" } }); return; }
            if (leaders.Count == 0) { WriteJson(context, 400, new Dictionary<string, object> { { "error", "no_attendance" } }); return; }

            List<Dictionary<string, object>> members = GroupMembers(groupId, dataFolder);
            Dictionary<string, Dictionary<string, object>> byId = new Dictionary<string, Dictionary<string, object>>();
            foreach (Dictionary<string, object> m in members) byId[Str(m, "id")] = m;
            string winnerId = leaders[RandomIndex(leaders.Count)];
            string winnerName = Str(byId[winnerId], "name");
            List<object> candidates = new List<object>();
            foreach (string id in leaders) candidates.Add(new Dictionary<string, object> { { "id", id }, { "name", Str(byId[id], "name") } });

            string label = MonthLabel(month);
            foreach (Dictionary<string, object> m in members)
                ChangeBalance(dataFolder, m, -PrizeShare, "prize", "חלקך בפרס ההתמדה — " + label + " (זוכה: " + winnerName + ")", sessionUserId);

            prize = new Dictionary<string, object>();
            prize["id"] = prizeId;
            prize["group_id"] = groupId;
            prize["month"] = month;
            prize["month_label"] = label;
            prize["winner_id"] = winnerId;
            prize["winner_name"] = winnerName;
            prize["candidates"] = candidates;
            prize["best"] = table["best"];
            prize["events"] = table["events"];
            prize["share"] = PrizeShare;
            prize["total"] = PrizeShare * members.Count;
            prize["choice"] = "";
            prize["created_at"] = DateTime.UtcNow.ToString("o");
            prize["created_by_name"] = Str(actor, "name");
            SaveEntityJson("prizes", prizeId, Json().Serialize(prize), dataFolder);
            WriteJson(context, 200, prize);
            return;
        }

        // streak_choice
        if (prize == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "not_closed" } }); return; }
        if (Str(prize, "choice") != "") { WriteJson(context, 409, new Dictionary<string, object> { { "error", "already_chosen" } }); return; }
        Dictionary<string, object> body = ParseObject(ReadBody(context)) ?? new Dictionary<string, object>();
        string choice = Str(body, "choice");
        if (choice != "credit" && choice != "gift") { WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_choice" } }); return; }
        string giftNote = Str(body, "gift_note").Trim();
        if (giftNote.Length > 120) giftNote = giftNote.Substring(0, 120);
        if (choice == "credit")
        {
            Dictionary<string, object> winner = LoadEntity("members", Str(prize, "winner_id"), dataFolder);
            if (winner == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "member_not_found" } }); return; }
            ChangeBalance(dataFolder, winner, Num(prize["total"]), "prize", "זכייה בפרס ההתמדה — " + Str(prize, "month_label"), sessionUserId);
        }
        prize["choice"] = choice;
        prize["gift_note"] = giftNote;
        prize["chosen_at"] = DateTime.UtcNow.ToString("o");
        SaveEntityJson("prizes", prizeId, Json().Serialize(prize), dataFolder);
        WriteJson(context, 200, prize);
    }

    private void HandleLedger(HttpContext context, string sessionUserId, string dataFolder)
    {
        if (context.Request.HttpMethod != "GET")
        {
            WriteJson(context, 405, new Dictionary<string, object> { { "error", "ledger_is_read_only" } });
            return;
        }
        string groupId = context.Request.QueryString["group_id"] ?? "";
        string memberId = context.Request.QueryString["member_id"] ?? "";
        if (!SafeId.IsMatch(groupId))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "missing_group_id" } });
            return;
        }
        if (!CanSeeGroup(groupId, sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        List<Dictionary<string, object>> entries = new List<Dictionary<string, object>>();
        foreach (Dictionary<string, object> e in LoadAll("ledger", dataFolder))
        {
            if (Str(e, "group_id") != groupId) continue;
            if (memberId != "" && Str(e, "member_id") != memberId) continue;
            entries.Add(e);
        }
        entries.Sort((a, b) => string.CompareOrdinal(Str(a, "created_at"), Str(b, "created_at")));
        WriteJson(context, 200, entries);
    }

    // ---------------------------------------------------------------------------------------------
    // Transfers ("העברתי"), receipts, and each member's personal read-only link.
    // ---------------------------------------------------------------------------------------------
    private static readonly Regex KeyFormat = new Regex("^[a-f0-9]{48}$");
    private const int MaxImageChars = 4000000;

    private static bool IsImageDataUrl(string s)
    {
        return s != null && s.Length < MaxImageChars && Regex.IsMatch(s, "^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$");
    }

    private static string RandomHex(int bytes)
    {
        byte[] b = new byte[bytes];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(b);
        return BitConverter.ToString(b).Replace("-", "").ToLowerInvariant();
    }

    private Dictionary<string, object> MemberOfUser(string groupId, string userId, string dataFolder)
    {
        Dictionary<string, object> user = LoadEntity("users", userId, dataFolder);
        string phone = Digits(Str(user, "phone"));
        if (phone == "") return null;
        foreach (Dictionary<string, object> m in LoadAll("members", dataFolder))
        {
            if (Str(m, "group_id") == groupId && Digits(Str(m, "phone")) == phone) return m;
        }
        return null;
    }

    private static Dictionary<string, object> WithoutImage(Dictionary<string, object> d, string field)
    {
        Dictionary<string, object> copy = new Dictionary<string, object>(d);
        copy["has_" + field] = Str(d, field) != "";
        copy.Remove(field);
        return copy;
    }

    private static bool ValidAmount(decimal amount) { return amount > 0m && amount <= 20000m; }

    private Dictionary<string, object> NewTransfer(string dataFolder, string groupId, string memberId, decimal amount,
        string note, string proof, string source, string actorId)
    {
        Dictionary<string, object> t = new Dictionary<string, object>();
        string id = Guid.NewGuid().ToString();
        string cleanNote = (note ?? "").Trim();
        if (cleanNote.Length > 200) cleanNote = cleanNote.Substring(0, 200);
        t["id"] = id;
        t["group_id"] = groupId;
        t["member_id"] = memberId;
        t["amount"] = amount;
        t["note"] = cleanNote;
        t["proof_image"] = IsImageDataUrl(proof) ? proof : "";
        t["status"] = "pending";
        t["source"] = source;
        t["created_by"] = actorId;
        t["created_at"] = DateTime.UtcNow.ToString("o");
        SaveEntityJson("transfers", id, Json().Serialize(t), dataFolder);
        return t;
    }

    private void HandleTransfers(HttpContext context, string action, string id, string sessionUserId, string dataFolder)
    {
        string method = context.Request.HttpMethod;
        if (method == "GET")
        {
            if (id != "")
            {
                Dictionary<string, object> one = LoadEntity("transfers", id, dataFolder);
                if (one == null || !CanSeeGroup(Str(one, "group_id"), sessionUserId, dataFolder))
                {
                    WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } });
                    return;
                }
                WriteJson(context, 200, one);
                return;
            }
            string groupId = context.Request.QueryString["group_id"] ?? "";
            if (!SafeId.IsMatch(groupId) || !CanSeeGroup(groupId, sessionUserId, dataFolder))
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
            foreach (Dictionary<string, object> t in LoadAll("transfers", dataFolder))
                if (Str(t, "group_id") == groupId) list.Add(WithoutImage(t, "proof_image"));
            list.Sort((a, b) => string.CompareOrdinal(Str(b, "created_at"), Str(a, "created_at")));
            WriteJson(context, 200, list);
            return;
        }
        if (method != "POST")
        {
            WriteJson(context, 405, new Dictionary<string, object> { { "error", "Method not allowed" } });
            return;
        }

        if (action == "approve" || action == "reject")
        {
            Dictionary<string, object> t = LoadEntity("transfers", id, dataFolder);
            if (t == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } }); return; }
            string groupId = Str(t, "group_id");
            if (!IsGroupOwner(groupId, sessionUserId, dataFolder))
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            if (Str(t, "status") != "pending")
            {
                WriteJson(context, 409, new Dictionary<string, object> { { "error", "already_decided" } });
                return;
            }
            Dictionary<string, object> body = ParseObject(ReadBody(context)) ?? new Dictionary<string, object>();
            if (action == "approve")
            {
                string memberId = Str(t, "member_id");
                Dictionary<string, object> member = LoadEntity("members", memberId, dataFolder);
                if (member == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "member_not_found" } }); return; }
                decimal amount = Num(t["amount"]);
                decimal oldBalance = Num(member.ContainsKey("balance") ? member["balance"] : null);
                decimal newBalance = oldBalance + amount;
                string note = Str(t, "note");
                string ledgerId = AppendBalanceChange(dataFolder, memberId, groupId, oldBalance, newBalance, "transfer",
                    note == "" ? "העברה ל-PayBox שאושרה" : note, "", sessionUserId);
                member["balance"] = newBalance;
                member["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("members", memberId, Json().Serialize(member), dataFolder);
                t["ledger_id"] = ledgerId;
                t["status"] = "approved";
            }
            else
            {
                t["status"] = "rejected";
                string reason = Str(body, "reason").Trim();
                t["reject_reason"] = reason.Length > 200 ? reason.Substring(0, 200) : reason;
            }
            t["decided_by"] = sessionUserId;
            t["decided_at"] = DateTime.UtcNow.ToString("o");
            SaveEntityJson("transfers", id, Json().Serialize(t), dataFolder);
            WriteJson(context, 200, WithoutImage(t, "proof_image"));
            return;
        }

        if (action == "")
        {
            Dictionary<string, object> body = ParseObject(ReadBody(context));
            string groupId = Str(body, "group_id");
            decimal amount = Num(body == null ? null : (body.ContainsKey("amount") ? body["amount"] : null));
            if (!SafeId.IsMatch(groupId) || !ValidAmount(amount))
            {
                WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_transfer" } });
                return;
            }
            Dictionary<string, object> member = MemberOfUser(groupId, sessionUserId, dataFolder);
            if (member == null)
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "not_a_member" } });
                return;
            }
            Dictionary<string, object> t = NewTransfer(dataFolder, groupId, Str(member, "id"), amount, Str(body, "note"),
                Str(body, "proof_image"), "app", sessionUserId);
            WriteJson(context, 200, WithoutImage(t, "proof_image"));
            return;
        }
        WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_action" } });
    }

    private void HandleReceipts(HttpContext context, string action, string id, string sessionUserId, string dataFolder)
    {
        string method = context.Request.HttpMethod;
        if (method == "GET")
        {
            if (id != "")
            {
                Dictionary<string, object> one = LoadEntity("receipts", id, dataFolder);
                if (one == null || !CanSeeGroup(Str(one, "group_id"), sessionUserId, dataFolder))
                {
                    WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } });
                    return;
                }
                WriteJson(context, 200, one);
                return;
            }
            string eventId = context.Request.QueryString["event_id"] ?? "";
            Dictionary<string, object> ev = LoadEntity("events", eventId, dataFolder);
            if (ev == null || !CanSeeGroup(Str(ev, "group_id"), sessionUserId, dataFolder))
            {
                WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
                return;
            }
            List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
            foreach (Dictionary<string, object> r in LoadAll("receipts", dataFolder))
                if (Str(r, "event_id") == eventId) list.Add(WithoutImage(r, "image"));
            list.Sort((a, b) => string.CompareOrdinal(Str(a, "created_at"), Str(b, "created_at")));
            WriteJson(context, 200, list);
            return;
        }
        if (method != "POST") { WriteJson(context, 405, new Dictionary<string, object> { { "error", "Method not allowed" } }); return; }

        if (action == "delete")
        {
            Dictionary<string, object> r = LoadEntity("receipts", id, dataFolder);
            if (r == null) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } }); return; }
            if (!IsGroupOwner(Str(r, "group_id"), sessionUserId, dataFolder)) { WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } }); return; }
            HandleDelete(context, "receipts", dataFolder);
            return;
        }
        Dictionary<string, object> body = ParseObject(ReadBody(context));
        string evId = Str(body, "event_id");
        Dictionary<string, object> evt = LoadEntity("events", evId, dataFolder);
        string image = Str(body, "image");
        if (evt == null || !IsImageDataUrl(image))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_receipt" } });
            return;
        }
        if (!IsGroupOwner(Str(evt, "group_id"), sessionUserId, dataFolder)) { WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } }); return; }
        Dictionary<string, object> rec = new Dictionary<string, object>();
        string recId = Guid.NewGuid().ToString();
        string label = Str(body, "label").Trim();
        rec["id"] = recId;
        rec["event_id"] = evId;
        rec["group_id"] = Str(evt, "group_id");
        rec["label"] = label.Length > 80 ? label.Substring(0, 80) : label;
        rec["amount"] = Num(body.ContainsKey("amount") ? body["amount"] : null);
        rec["image"] = image;
        rec["created_by"] = sessionUserId;
        rec["created_at"] = DateTime.UtcNow.ToString("o");
        SaveEntityJson("receipts", recId, Json().Serialize(rec), dataFolder);
        WriteJson(context, 200, WithoutImage(rec, "image"));
    }

    /** Owner only: get (GET) or create/replace (POST) a member's personal link key. */
    private void HandleMemberLink(HttpContext context, string sessionUserId, string dataFolder)
    {
        string memberId = context.Request.QueryString["member_id"] ?? "";
        Dictionary<string, object> member = LoadEntity("members", memberId, dataFolder);
        if (member == null || !IsGroupOwner(Str(member, "group_id"), sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        string folder = Path.Combine(dataFolder, "member_keys");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        bool replace = context.Request.HttpMethod == "POST";
        string existingKey = "";
        foreach (string file in Directory.GetFiles(folder, "*.json"))
        {
            Dictionary<string, object> k = ParseObject(File.ReadAllText(file, Encoding.UTF8));
            if (k == null || Str(k, "member_id") != memberId) continue;
            if (replace) { try { File.Delete(file); } catch { } }
            else existingKey = Path.GetFileNameWithoutExtension(file);
        }
        if (replace)
        {
            existingKey = RandomHex(24);
            Dictionary<string, object> k = new Dictionary<string, object>();
            k["member_id"] = memberId;
            k["group_id"] = Str(member, "group_id");
            k["created_by"] = sessionUserId;
            k["created_at"] = DateTime.UtcNow.ToString("o");
            File.WriteAllText(Path.Combine(folder, existingKey + ".json"), Json().Serialize(k), Encoding.UTF8);
        }
        WriteJson(context, 200, new Dictionary<string, object> { { "key", existingKey } });
    }

    /** Resolves a personal link key to its member (null if unknown or replaced). */
    private Dictionary<string, object> MemberForKey(string key, string dataFolder)
    {
        key = (key ?? "").Trim().ToLowerInvariant();
        if (!KeyFormat.IsMatch(key)) return null;
        string path = Path.Combine(Path.Combine(dataFolder, "member_keys"), key + ".json");
        if (!File.Exists(path)) return null;
        Dictionary<string, object> k = ParseObject(File.ReadAllText(path, Encoding.UTF8));
        Dictionary<string, object> member = LoadEntity("members", Str(k, "member_id"), dataFolder);
        if (member == null || Str(member, "group_id") != Str(k, "group_id")) return null;
        return member;
    }

    private static Dictionary<string, object> Pick(Dictionary<string, object> d, params string[] keys)
    {
        Dictionary<string, object> o = new Dictionary<string, object>();
        foreach (string k in keys) if (d.ContainsKey(k)) o[k] = d[k];
        return o;
    }

    /** The personal page: balance, statement, events with this member's share, receipts, transfers. */
    private void HandlePublic(HttpContext context, string dataFolder)
    {
        string action = context.Request.QueryString["action"] ?? "";
        Dictionary<string, object> member = MemberForKey(context.Request.QueryString["key"], dataFolder);
        if (member == null)
        {
            WriteJson(context, 404, new Dictionary<string, object> { { "error", "link_not_found" } });
            return;
        }
        string memberId = Str(member, "id");
        string groupId = Str(member, "group_id");

        if (action == "public_receipt")
        {
            Dictionary<string, object> r = LoadEntity("receipts", context.Request.QueryString["id"] ?? "", dataFolder);
            if (r == null || Str(r, "group_id") != groupId) { WriteJson(context, 404, new Dictionary<string, object> { { "error", "Not found" } }); return; }
            WriteJson(context, 200, Pick(r, "id", "label", "amount", "image", "created_at"));
            return;
        }

        if (action == "public_transfer")
        {
            if (context.Request.HttpMethod != "POST") { WriteJson(context, 405, new Dictionary<string, object> { { "error", "Method not allowed" } }); return; }
            Dictionary<string, object> body = ParseObject(ReadBody(context));
            decimal amount = Num(body == null ? null : (body.ContainsKey("amount") ? body["amount"] : null));
            if (!ValidAmount(amount)) { WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_transfer" } }); return; }
            int pending = 0;
            foreach (Dictionary<string, object> x in LoadAll("transfers", dataFolder))
                if (Str(x, "member_id") == memberId && Str(x, "status") == "pending") pending++;
            if (pending >= 5) { WriteJson(context, 429, new Dictionary<string, object> { { "error", "too_many_pending" } }); return; }
            Dictionary<string, object> t = NewTransfer(dataFolder, groupId, memberId, amount, Str(body, "note"),
                Str(body, "proof_image"), "link", "");
            WriteJson(context, 200, WithoutImage(t, "proof_image"));
            return;
        }

        Dictionary<string, object> group = LoadEntity("groups", groupId, dataFolder) ?? new Dictionary<string, object>();

        Dictionary<string, object> eventsById = new Dictionary<string, object>();
        List<Dictionary<string, object>> groupEvents = new List<Dictionary<string, object>>();
        foreach (Dictionary<string, object> e in LoadAll("events", dataFolder))
        {
            if (Str(e, "group_id") != groupId) continue;
            groupEvents.Add(e);
            eventsById[Str(e, "id")] = e;
        }

        Dictionary<string, bool> myAttend = new Dictionary<string, bool>();
        Dictionary<string, int> participants = new Dictionary<string, int>();
        foreach (Dictionary<string, object> a in LoadAll("attendees", dataFolder))
        {
            string ev = Str(a, "event_id");
            if (!eventsById.ContainsKey(ev)) continue;
            if (Str(a, "attended") == "False") continue;
            participants[ev] = (participants.ContainsKey(ev) ? participants[ev] : 0) + 1;
            if (Str(a, "member_id") == memberId) myAttend[ev] = true;
        }
        Dictionary<string, Dictionary<string, object>> myPayment = new Dictionary<string, Dictionary<string, object>>();
        foreach (Dictionary<string, object> p in LoadAll("payments", dataFolder))
            if (Str(p, "payer_type") == "member" && Str(p, "payer_id") == memberId && eventsById.ContainsKey(Str(p, "event_id")))
                myPayment[Str(p, "event_id")] = p;
        Dictionary<string, List<object>> receiptsByEvent = new Dictionary<string, List<object>>();
        foreach (Dictionary<string, object> r in LoadAll("receipts", dataFolder))
        {
            if (Str(r, "group_id") != groupId) continue;
            string ev = Str(r, "event_id");
            if (!receiptsByEvent.ContainsKey(ev)) receiptsByEvent[ev] = new List<object>();
            receiptsByEvent[ev].Add(Pick(r, "id", "label", "amount"));
        }

        List<object> events = new List<object>();
        foreach (Dictionary<string, object> e in groupEvents)
        {
            string ev = Str(e, "id");
            Dictionary<string, object> o = Pick(e, "id", "event_date", "description", "butcher_cost", "grocery_cost", "total_cost", "location");
            o["attending"] = myAttend.ContainsKey(ev);
            o["participants"] = participants.ContainsKey(ev) ? participants[ev] : 0;
            if (myPayment.ContainsKey(ev))
            {
                o["my_amount"] = Num(myPayment[ev].ContainsKey("amount") ? myPayment[ev]["amount"] : null);
                o["my_status"] = Str(myPayment[ev], "payment_status");
            }
            o["receipts"] = receiptsByEvent.ContainsKey(ev) ? receiptsByEvent[ev] : new List<object>();
            events.Add(o);
        }

        List<Dictionary<string, object>> mine = new List<Dictionary<string, object>>();
        decimal groupDeposits = 0m, groupCharges = 0m;
        foreach (Dictionary<string, object> l in LoadAll("ledger", dataFolder))
        {
            if (Str(l, "group_id") != groupId) continue;
            string type = Str(l, "type");
            decimal amt = Num(l.ContainsKey("amount") ? l["amount"] : null);
            if (type == "deposit" || type == "transfer") groupDeposits += amt;
            if (type == "charge" || type == "refund") groupCharges -= amt;
            if (Str(l, "member_id") == memberId) mine.Add(l);
        }
        mine.Sort((a, b) => string.CompareOrdinal(Str(a, "created_at"), Str(b, "created_at")));
        List<object> ledger = new List<object>();
        foreach (Dictionary<string, object> l in mine)
            ledger.Add(Pick(l, "id", "type", "amount", "balance_before", "balance_after", "note", "note_added", "event_id", "created_by_name", "created_at"));

        List<Dictionary<string, object>> myTransfers = new List<Dictionary<string, object>>();
        foreach (Dictionary<string, object> t in LoadAll("transfers", dataFolder))
            if (Str(t, "member_id") == memberId) myTransfers.Add(t);
        myTransfers.Sort((a, b) => string.CompareOrdinal(Str(b, "created_at"), Str(a, "created_at")));
        List<object> transfers = new List<object>();
        foreach (Dictionary<string, object> t in myTransfers)
            transfers.Add(Pick(t, "id", "amount", "note", "status", "reject_reason", "created_at", "decided_at"));

        int membersCount = 0;
        decimal balancesSum = 0m;
        foreach (Dictionary<string, object> m in LoadAll("members", dataFolder))
        {
            if (Str(m, "group_id") != groupId) continue;
            membersCount++;
            balancesSum += Num(m.ContainsKey("balance") ? m["balance"] : null);
        }

        Dictionary<string, object> result = new Dictionary<string, object>();
        result["group"] = Pick(group, "id", "name", "group_image");
        result["member"] = Pick(member, "id", "name", "nickname", "balance");
        result["events"] = events;
        result["ledger"] = ledger;
        result["transfers"] = transfers;
        result["paybox"] = PayboxForMember(dataFolder, groupId, member);
        Dictionary<string, object> streak = BuildStreak(groupId, IsraelNow().ToString("yyyy-MM"), dataFolder);
        streak["previous"] = BuildStreak(groupId, IsraelNow().AddMonths(-1).ToString("yyyy-MM"), dataFolder);
        streak["hall"] = PrizeHall(groupId, dataFolder);
        result["streak"] = streak;
        result["group_totals"] = new Dictionary<string, object> {
            { "members", membersCount }, { "balances_sum", balancesSum },
            { "deposits", groupDeposits }, { "charges", groupCharges }
        };
        context.Response.Headers.Add("Cache-Control", "no-store");
        WriteJson(context, 200, result);
    }

    // ---------------------------------------------------------------------------------------------
    // PayBox history: the owner uploads the group's PayBox export; members see their own deposits.
    // Stored as one file per group; each upload replaces it (the export always holds the full history).
    // ---------------------------------------------------------------------------------------------
    private static string PhoneLocal(string phone)
    {
        string d = Digits(phone);
        if (d.StartsWith("972")) d = "0" + d.Substring(3);
        return d;
    }

    private string PayboxPath(string dataFolder, string groupId)
    {
        string folder = Path.Combine(dataFolder, "paybox");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        return Path.Combine(folder, groupId + ".json");
    }

    private List<Dictionary<string, object>> LoadPaybox(string dataFolder, string groupId)
    {
        List<Dictionary<string, object>> rows = new List<Dictionary<string, object>>();
        string path = PayboxPath(dataFolder, groupId);
        if (!File.Exists(path)) return rows;
        Dictionary<string, object> doc = ParseObject(File.ReadAllText(path, Encoding.UTF8));
        object list;
        if (doc != null && doc.TryGetValue("rows", out list) && list is System.Collections.ArrayList)
            foreach (object o in (System.Collections.ArrayList)list)
                if (o is Dictionary<string, object>) rows.Add((Dictionary<string, object>)o);
        return rows;
    }

    private Dictionary<string, object> PayboxMeta(string dataFolder, string groupId)
    {
        string path = PayboxPath(dataFolder, groupId);
        if (!File.Exists(path)) return null;
        Dictionary<string, object> doc = ParseObject(File.ReadAllText(path, Encoding.UTF8));
        return doc == null ? null : Pick(doc, "imported_at", "imported_by_name", "count", "first_date", "last_date");
    }

    // Settlement lines: the owner explains money that went through a member for the group (an
    // overpayment that was returned, a guest paid from a member's deposit). Shown in the member's
    // dated list so it adds up with PayBox; they do not change any balance.
    private string NotesPath(string dataFolder, string groupId)
    {
        string folder = Path.Combine(dataFolder, "paybox");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        return Path.Combine(folder, groupId + ".notes.json");
    }

    private List<Dictionary<string, object>> LoadNotes(string dataFolder, string groupId)
    {
        List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
        string path = NotesPath(dataFolder, groupId);
        if (!File.Exists(path)) return list;
        Dictionary<string, object> doc = ParseObject(File.ReadAllText(path, Encoding.UTF8));
        object arr;
        if (doc != null && doc.TryGetValue("notes", out arr) && arr is System.Collections.ArrayList)
            foreach (object o in (System.Collections.ArrayList)arr)
                if (o is Dictionary<string, object>) list.Add((Dictionary<string, object>)o);
        return list;
    }

    private void SaveNotes(string dataFolder, string groupId, List<Dictionary<string, object>> notes)
    {
        Dictionary<string, object> doc = new Dictionary<string, object>();
        doc["notes"] = notes;
        File.WriteAllText(NotesPath(dataFolder, groupId), Json().Serialize(doc), Encoding.UTF8);
    }

    /** GET list · POST add {member_id, date, amount, note} · POST &op=delete&id= (owner only). */
    private void HandlePayboxNotes(HttpContext context, string sessionUserId, string dataFolder)
    {
        string groupId = context.Request.QueryString["group_id"] ?? "";
        if (!SafeId.IsMatch(groupId) || !IsGroupOwner(groupId, sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        List<Dictionary<string, object>> notes = LoadNotes(dataFolder, groupId);
        if (context.Request.HttpMethod == "GET")
        {
            WriteJson(context, 200, notes);
            return;
        }
        if ((context.Request.QueryString["op"] ?? "") == "delete")
        {
            string id = context.Request.QueryString["id"] ?? "";
            notes.RemoveAll(x => Str(x, "id") == id);
            SaveNotes(dataFolder, groupId, notes);
            WriteJson(context, 200, notes);
            return;
        }
        Dictionary<string, object> body = ParseObject(ReadBody(context)) ?? new Dictionary<string, object>();
        string memberId = Str(body, "member_id");
        Dictionary<string, object> member = LoadEntity("members", memberId, dataFolder);
        string date = Str(body, "date").Trim();
        string note = Str(body, "note").Trim();
        decimal amount = Num(body.ContainsKey("amount") ? body["amount"] : null);
        if (member == null || Str(member, "group_id") != groupId || !Regex.IsMatch(date, "^\\d{4}-\\d{2}-\\d{2}") || note == "" || amount == 0m)
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_note" } });
            return;
        }
        Dictionary<string, object> actor = LoadEntity("users", sessionUserId, dataFolder);
        Dictionary<string, object> n = new Dictionary<string, object>();
        n["id"] = Guid.NewGuid().ToString();
        n["member_id"] = memberId;
        n["date"] = date.Length > 19 ? date.Substring(0, 19) : date;
        n["amount"] = amount;
        n["note"] = note.Length > 300 ? note.Substring(0, 300) : note;
        n["by_name"] = Str(actor, "name");
        n["at"] = DateTime.UtcNow.ToString("o");
        notes.Add(n);
        SaveNotes(dataFolder, groupId, notes);
        WriteJson(context, 200, notes);
    }

    /** GET: the group's PayBox rows (owner) · POST: replace them with a new export (owner). */
    private void HandlePaybox(HttpContext context, string sessionUserId, string dataFolder)
    {
        string groupId = context.Request.QueryString["group_id"] ?? "";
        if (!SafeId.IsMatch(groupId) || !IsGroupOwner(groupId, sessionUserId, dataFolder))
        {
            WriteJson(context, 403, new Dictionary<string, object> { { "error", "forbidden" } });
            return;
        }
        if (context.Request.HttpMethod == "GET")
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["meta"] = PayboxMeta(dataFolder, groupId);
            result["rows"] = LoadPaybox(dataFolder, groupId);
            WriteJson(context, 200, result);
            return;
        }
        Dictionary<string, object> body = ParseObject(ReadBody(context));
        object rowsObj;
        if (body == null || !body.TryGetValue("rows", out rowsObj) || !(rowsObj is System.Collections.ArrayList))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_rows" } });
            return;
        }
        List<object> clean = new List<object>();
        string first = "", last = "";
        foreach (object o in (System.Collections.ArrayList)rowsObj)
        {
            Dictionary<string, object> r = o as Dictionary<string, object>;
            if (r == null) continue;
            string date = Str(r, "date").Trim();
            if (!Regex.IsMatch(date, "^\\d{4}-\\d{2}-\\d{2}")) continue;
            string kind = Str(r, "kind") == "out" ? "out" : "in";
            string name = Str(r, "name").Trim();
            string note = Str(r, "note").Trim();
            Dictionary<string, object> row = new Dictionary<string, object>();
            row["date"] = date.Length > 19 ? date.Substring(0, 19) : date;
            row["kind"] = kind;
            row["name"] = name.Length > 80 ? name.Substring(0, 80) : name;
            row["phone"] = PhoneLocal(Str(r, "phone"));
            row["amount"] = Num(r.ContainsKey("amount") ? r["amount"] : null);
            row["note"] = note.Length > 200 ? note.Substring(0, 200) : note;
            clean.Add(row);
            if (first == "" || string.CompareOrdinal(row["date"].ToString(), first) < 0) first = row["date"].ToString();
            if (last == "" || string.CompareOrdinal(row["date"].ToString(), last) > 0) last = row["date"].ToString();
            if (clean.Count > 20000) break;
        }
        Dictionary<string, object> actor = LoadEntity("users", sessionUserId, dataFolder);
        Dictionary<string, object> doc = new Dictionary<string, object>();
        doc["group_id"] = groupId;
        doc["imported_at"] = DateTime.UtcNow.ToString("o");
        doc["imported_by"] = sessionUserId;
        doc["imported_by_name"] = Str(actor, "name");
        doc["count"] = clean.Count;
        doc["first_date"] = first;
        doc["last_date"] = last;
        doc["rows"] = clean;
        File.WriteAllText(PayboxPath(dataFolder, groupId), Json().Serialize(doc), Encoding.UTF8);
        WriteJson(context, 200, PayboxMeta(dataFolder, groupId));
    }

    /** The member's own PayBox deposits (matched by phone), for the personal page. */
    private Dictionary<string, object> PayboxForMember(string dataFolder, string groupId, Dictionary<string, object> member)
    {
        Dictionary<string, object> meta = PayboxMeta(dataFolder, groupId);
        if (meta == null) return null;
        string phone = PhoneLocal(Str(member, "phone"));
        List<object> mine = new List<object>();
        decimal total = 0m;
        if (phone != "")
        {
            foreach (Dictionary<string, object> r in LoadPaybox(dataFolder, groupId))
            {
                if (Str(r, "kind") != "in" || Str(r, "phone") != phone) continue;
                mine.Add(Pick(r, "date", "amount", "note"));
                total += Num(r.ContainsKey("amount") ? r["amount"] : null);
            }
        }
        decimal groupIn = 0m, groupOut = 0m;
        foreach (Dictionary<string, object> r in LoadPaybox(dataFolder, groupId))
        {
            decimal a = Num(r.ContainsKey("amount") ? r["amount"] : null);
            if (Str(r, "kind") == "in") groupIn += a; else groupOut += a;
        }
        Dictionary<string, object> result = new Dictionary<string, object>();
        result["meta"] = meta;
        result["deposits"] = mine;
        result["total"] = total;
        result["group_in"] = groupIn;
        result["group_out"] = groupOut;
        List<object> myNotes = new List<object>();
        foreach (Dictionary<string, object> nt in LoadNotes(dataFolder, groupId))
            if (Str(nt, "member_id") == Str(member, "id")) myNotes.Add(Pick(nt, "id", "date", "amount", "note"));
        result["notes"] = myNotes;
        return result;
    }

    // ---------------------------------------------------------------------------------------------
    // One group link: a member types their phone, gets an SMS code, and lands on their personal page.
    // The SMS gateway URL lives only on the server (App_Data/bbq/sms.json), never in the code.
    // ---------------------------------------------------------------------------------------------
    private static readonly Regex OtpCode = new Regex("^\\d{6}$");

    private string OtpPath(string dataFolder, string groupId, string phone)
    {
        string folder = Path.Combine(dataFolder, "otp");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        return Path.Combine(folder, groupId + "_" + phone + ".json");
    }

    private Dictionary<string, object> MemberByPhone(string groupId, string phone, string dataFolder)
    {
        foreach (Dictionary<string, object> m in LoadAll("members", dataFolder))
            if (Str(m, "group_id") == groupId && PhoneLocal(Str(m, "phone")) == phone) return m;
        return null;
    }

    /** Existing personal link key of the member, or a new one (same keys as the owner's "קישור"). */
    private string KeyForMember(Dictionary<string, object> member, string dataFolder)
    {
        string memberId = Str(member, "id");
        string folder = Path.Combine(dataFolder, "member_keys");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
        foreach (string file in Directory.GetFiles(folder, "*.json"))
        {
            Dictionary<string, object> k = ParseObject(File.ReadAllText(file, Encoding.UTF8));
            if (k != null && Str(k, "member_id") == memberId) return Path.GetFileNameWithoutExtension(file);
        }
        string key = RandomHex(24);
        Dictionary<string, object> rec = new Dictionary<string, object>();
        rec["member_id"] = memberId;
        rec["group_id"] = Str(member, "group_id");
        rec["created_by"] = "sms";
        rec["created_at"] = DateTime.UtcNow.ToString("o");
        File.WriteAllText(Path.Combine(folder, key + ".json"), Json().Serialize(rec), Encoding.UTF8);
        return key;
    }

    private string smsDetail = "";

    private bool SendSms(string dataFolder, string phone, string message)
    {
        smsDetail = "";
        string cfgPath = Path.Combine(dataFolder, "sms.json");
        if (!File.Exists(cfgPath)) { smsDetail = "no_config"; return false; }
        Dictionary<string, object> cfg = ParseObject(File.ReadAllText(cfgPath, Encoding.UTF8));
        string template = Str(cfg, "url");
        if (template == "") return false;
        string url = template.Replace("{mobile}", Uri.EscapeDataString(phone)).Replace("{message}", Uri.EscapeDataString(message));
        try
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "GET";
            request.Timeout = 10000;
            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                string text = reader.ReadToEnd();
                smsDetail = ((int)response.StatusCode) + " " + (text.Length > 200 ? text.Substring(0, 200) : text);
                return (int)response.StatusCode >= 200 && (int)response.StatusCode < 300 && !text.Contains("\"isSuccess\":false");
            }
        }
        catch (WebException ex)
        {
            string body = "";
            try { if (ex.Response != null) using (StreamReader r = new StreamReader(ex.Response.GetResponseStream())) body = r.ReadToEnd(); } catch { }
            smsDetail = ex.Status + " " + (body.Length > 200 ? body.Substring(0, 200) : body);
            return false;
        }
        catch (Exception ex) { smsDetail = ex.GetType().Name; return false; }
    }

    private static string MaskPhone(string phone)
    {
        return phone.Length >= 4 ? new string('*', Math.Max(0, phone.Length - 4)) + phone.Substring(phone.Length - 4) : phone;
    }

    /** POST action=otp_start {group_id, phone} · POST action=otp_verify {group_id, phone, code} → {key}. */
    private void HandleOtp(HttpContext context, string action, string dataFolder)
    {
        if (context.Request.HttpMethod != "POST") { WriteJson(context, 405, new Dictionary<string, object> { { "error", "Method not allowed" } }); return; }
        Dictionary<string, object> body = ParseObject(ReadBody(context)) ?? new Dictionary<string, object>();
        string groupId = Str(body, "group_id");
        string phone = PhoneLocal(Str(body, "phone"));
        if (!SafeId.IsMatch(groupId) || phone.Length < 9 || phone.Length > 12)
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "invalid_phone" } });
            return;
        }
        Dictionary<string, object> group = LoadEntity("groups", groupId, dataFolder);
        Dictionary<string, object> member = group == null ? null : MemberByPhone(groupId, phone, dataFolder);
        string path = OtpPath(dataFolder, groupId, phone);
        Dictionary<string, object> state = File.Exists(path) ? ParseObject(File.ReadAllText(path, Encoding.UTF8)) : null;

        if (action == "otp_start")
        {
            if (member == null)
            {
                WriteJson(context, 404, new Dictionary<string, object> { { "error", "not_a_member" } });
                return;
            }
            // At most 3 codes per phone in 15 minutes
            int sent = 0;
            DateTime windowStart;
            if (state != null && DateTime.TryParse(Str(state, "window_start"), null, System.Globalization.DateTimeStyles.RoundtripKind, out windowStart)
                && DateTime.UtcNow - windowStart.ToUniversalTime() < TimeSpan.FromMinutes(15))
            {
                int.TryParse(Str(state, "sent"), out sent);
            }
            else windowStart = DateTime.UtcNow;
            if (sent >= 3)
            {
                WriteJson(context, 429, new Dictionary<string, object> { { "error", "too_many_codes" } });
                return;
            }
            byte[] rnd = new byte[4];
            using (RandomNumberGenerator rng0 = RandomNumberGenerator.Create()) rng0.GetBytes(rnd);
            string code = (BitConverter.ToUInt32(rnd, 0) % 1000000).ToString("D6");
            byte[] salt = new byte[16];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(salt);
            string codeHash;
            using (Rfc2898DeriveBytes kdf = new Rfc2898DeriveBytes(code, salt, 1000))
                codeHash = Convert.ToBase64String(salt) + "$" + Convert.ToBase64String(kdf.GetBytes(24));
            // The company SMS gateway accepts from outside only a short code text: one number (the code),
            // at most 70 characters, no dot / slash / @ — so no group name and no "10 minutes" here.
            string message = "קוד הכניסה שלך לקופה: " + code;
            if (!SendSms(dataFolder, phone, message))
            {
                WriteJson(context, 502, new Dictionary<string, object> { { "error", "sms_failed" }, { "detail", smsDetail } });
                return;
            }
            Dictionary<string, object> st = new Dictionary<string, object>();
            st["code_hash"] = codeHash;
            st["expires_at"] = DateTime.UtcNow.AddMinutes(10).ToString("o");
            st["attempts"] = 0;
            st["sent"] = sent + 1;
            st["window_start"] = windowStart.ToUniversalTime().ToString("o");
            File.WriteAllText(path, Json().Serialize(st), Encoding.UTF8);
            WriteJson(context, 200, new Dictionary<string, object> { { "sent", true }, { "to", MaskPhone(phone) } });
            return;
        }

        // otp_verify
        string given = Str(body, "code").Trim();
        if (member == null || state == null || !OtpCode.IsMatch(given))
        {
            WriteJson(context, 400, new Dictionary<string, object> { { "error", "wrong_code" } });
            return;
        }
        DateTime expires;
        int attempts;
        int.TryParse(Str(state, "attempts"), out attempts);
        if (!DateTime.TryParse(Str(state, "expires_at"), null, System.Globalization.DateTimeStyles.RoundtripKind, out expires)
            || expires.ToUniversalTime() < DateTime.UtcNow || attempts >= 5 || Str(state, "code_hash") == "")
        {
            WriteJson(context, 410, new Dictionary<string, object> { { "error", "code_expired" } });
            return;
        }
        string[] parts = Str(state, "code_hash").Split('$');
        bool ok = false;
        try
        {
            byte[] salt = Convert.FromBase64String(parts[0]);
            byte[] expected = Convert.FromBase64String(parts[1]);
            using (Rfc2898DeriveBytes kdf = new Rfc2898DeriveBytes(given, salt, 1000))
                ok = FixedTimeEquals(kdf.GetBytes(expected.Length), expected);
        }
        catch { ok = false; }
        if (!ok)
        {
            state["attempts"] = attempts + 1;
            File.WriteAllText(path, Json().Serialize(state), Encoding.UTF8);
            WriteJson(context, 401, new Dictionary<string, object> { { "error", "wrong_code" } });
            return;
        }
        state["code_hash"] = "";
        File.WriteAllText(path, Json().Serialize(state), Encoding.UTF8);
        WriteJson(context, 200, new Dictionary<string, object> { { "key", KeyForMember(member, dataFolder) } });
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Charset = "utf-8";
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, " + TokenHeader);

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }

        try
        {
            // Use App_Data folder inside TravSure - get the physical path of the current file
            string currentFile = context.Request.PhysicalPath; // e.g., C:\inetpub\wwwroot\TravSure\api-bbq.ashx
            string appPath = Path.GetDirectoryName(currentFile); // C:\inetpub\wwwroot\TravSure
            string dataFolder = Path.Combine(appPath, "App_Data", "bbq");
            if (!Directory.Exists(dataFolder))
            {
                Directory.CreateDirectory(dataFolder);
            }

                    if (HandleSecurity(context, dataFolder)) return;

                    string entity = context.Request.QueryString["entity"] ?? "";
                    string action = context.Request.QueryString["action"] ?? "";

                    // Handle webhook for payment notifications (from PayBox)
                    if (action == "webhook" && entity.ToLower() == "payments")
                    {
                        HandlePaymentWebhook(context, dataFolder);
                        return;
                    }

                    switch (context.Request.HttpMethod)
                    {
                        case "GET":
                            HandleGet(context, entity, dataFolder);
                            break;
                        case "POST":
                            HandlePost(context, entity, dataFolder);
                            break;
                        case "PUT":
                            HandlePut(context, entity, dataFolder);
                            break;
                        case "DELETE":
                            HandleDelete(context, entity, dataFolder);
                            break;
                        default:
                            context.Response.StatusCode = 405;
                            context.Response.ContentType = "application/json; charset=utf-8";
                            context.Response.Write("{\"error\":\"Method not allowed\"}");
                            break;
                    }
        }
        catch (Exception ex)
        {
            try
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json; charset=utf-8";
                string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
                string errorType = HttpUtility.JavaScriptStringEncode(ex.GetType().ToString());
                string errorDetails = "{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\",\"type\":\"" + errorType + "\"}";
                context.Response.Write(errorDetails);
            }
            catch
            {
                // If we can't write the error, at least try to set status code
                try
                {
                    context.Response.StatusCode = 500;
                    context.Response.Write("{\"error\":\"Internal server error - could not write details\"}");
                }
                catch { }
            }
        }
    }

    private void HandleGet(HttpContext context, string entity, string dataFolder)
    {
        // Re-read entity from query string to ensure we have it
        if (string.IsNullOrEmpty(entity))
        {
            entity = context.Request.QueryString["entity"] ?? "";
        }
        
        // Normalize entity to lowercase
        if (!string.IsNullOrEmpty(entity))
        {
            entity = entity.ToLower();
        }
        
        // If entity is still empty, return error
        if (string.IsNullOrEmpty(entity))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            string debugQuery = HttpUtility.JavaScriptStringEncode(context.Request.QueryString.ToString());
            string debugEntity = HttpUtility.JavaScriptStringEncode(entity ?? "");
            context.Response.Write("{\"error\":\"Missing entity parameter\",\"entity\":\"" + debugEntity + "\",\"queryString\":\"" + debugQuery + "\",\"rawEntity\":\"" + HttpUtility.JavaScriptStringEncode(context.Request.QueryString["entity"] ?? "") + "\"}");
            return;
        }
        
        string id = context.Request.QueryString["id"] ?? "";
        string groupId = context.Request.QueryString["group_id"] ?? "";
        string eventId = context.Request.QueryString["event_id"] ?? "";

        switch (entity)
        {
            case "groups":
                if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("groups", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    string json = LoadAllJson("groups", dataFolder);
                    // Always return what exists - don't create default group here
                    // Let the client handle group creation if needed
                    context.Response.Write(json);
                }
                break;

            case "events":
                if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("events", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    string eventsJson = LoadAllJson("events", dataFolder);
                    // Filter by group_id if provided - simple string search
                    if (!string.IsNullOrEmpty(groupId) && eventsJson != "[]" && !string.IsNullOrEmpty(eventsJson))
                    {
                        List<string> filteredEvents = new List<string>();
                        // Split JSON array into individual event objects
                        string trimmed = eventsJson.Trim('[', ']');
                        if (!string.IsNullOrEmpty(trimmed))
                        {
                            // Split by "},{" pattern
                            string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                            foreach (string part in parts)
                            {
                                string clean = part.Trim();
                                if (!clean.StartsWith("{")) clean = "{" + clean;
                                if (!clean.EndsWith("}")) clean = clean + "}";
                                // Check if this event belongs to the group
                                if (clean.Contains("\"group_id\":\"" + groupId + "\"") || clean.Contains("\"group_id\": \"" + groupId + "\""))
                                {
                                    filteredEvents.Add(clean);
                                }
                            }
                        }
                        if (filteredEvents.Count == 0)
                            context.Response.Write("[]");
                        else
                            context.Response.Write("[" + string.Join(",", filteredEvents.ToArray()) + "]");
                    }
                    else
                    {
                        context.Response.Write(eventsJson);
                    }
                }
                break;

            case "members":
                string membersJson = LoadAllJson("members", dataFolder);
                // Filter by group_id if provided
                if (!string.IsNullOrEmpty(groupId) && membersJson != "[]" && !string.IsNullOrEmpty(membersJson))
                {
                    List<string> filteredMembers = new List<string>();
                    string trimmed = membersJson.Trim('[', ']');
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                        foreach (string part in parts)
                        {
                            string clean = part.Trim();
                            if (!clean.StartsWith("{")) clean = "{" + clean;
                            if (!clean.EndsWith("}")) clean = clean + "}";
                            if (clean.Contains("\"group_id\":\"" + groupId + "\"") || clean.Contains("\"group_id\": \"" + groupId + "\""))
                            {
                                filteredMembers.Add(clean);
                            }
                        }
                    }
                    if (filteredMembers.Count == 0)
                        context.Response.Write("[]");
                    else
                        context.Response.Write("[" + string.Join(",", filteredMembers.ToArray()) + "]");
                }
                else if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("members", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    context.Response.Write(membersJson);
                }
                break;

            case "payments":
                string paymentsJson = LoadAllJson("payments", dataFolder);
                // Filter by event_id if provided
                if (!string.IsNullOrEmpty(eventId) && paymentsJson != "[]" && !string.IsNullOrEmpty(paymentsJson))
                {
                    List<string> filteredPayments = new List<string>();
                    string trimmed = paymentsJson.Trim('[', ']');
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                        foreach (string part in parts)
                        {
                            string clean = part.Trim();
                            if (!clean.StartsWith("{")) clean = "{" + clean;
                            if (!clean.EndsWith("}")) clean = clean + "}";
                            if (clean.Contains("\"event_id\":\"" + eventId + "\"") || clean.Contains("\"event_id\": \"" + eventId + "\""))
                            {
                                filteredPayments.Add(clean);
                            }
                        }
                    }
                    if (filteredPayments.Count == 0)
                        context.Response.Write("[]");
                    else
                        context.Response.Write("[" + string.Join(",", filteredPayments.ToArray()) + "]");
                }
                else if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("payments", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    context.Response.Write(paymentsJson);
                }
                break;

            case "polls":
                try
                {
                    string pollsJson = LoadAllJson("polls", dataFolder);
                    // Filter by group_id if provided
                    if (!string.IsNullOrEmpty(groupId))
                    {
                        if (pollsJson == "[]" || string.IsNullOrEmpty(pollsJson))
                        {
                            context.Response.Write("[]");
                        }
                        else
                        {
                            // Parse JSON properly instead of string splitting
                            try
                            {
                                List<string> filteredPolls = new List<string>();
                                string trimmed = pollsJson.Trim('[', ']');
                                if (!string.IsNullOrEmpty(trimmed))
                                {
                                    // Use a more robust JSON parsing approach
                                    // Find complete JSON objects by matching braces
                                    int braceCount = 0;
                                    int startIndex = 0;
                                    for (int i = 0; i < trimmed.Length; i++)
                                    {
                                        if (trimmed[i] == '{')
                                        {
                                            if (braceCount == 0) startIndex = i;
                                            braceCount++;
                                        }
                                        else if (trimmed[i] == '}')
                                        {
                                            braceCount--;
                                            if (braceCount == 0)
                                            {
                                                // Found complete JSON object
                                                string jsonObj = trimmed.Substring(startIndex, i - startIndex + 1);
                                                if (jsonObj.Contains("\"group_id\":\"" + groupId + "\"") || jsonObj.Contains("\"group_id\": \"" + groupId + "\""))
                                                {
                                                    filteredPolls.Add(jsonObj);
                                                }
                                                // Skip comma if exists
                                                if (i + 1 < trimmed.Length && trimmed[i + 1] == ',')
                                                    i++;
                                            }
                                        }
                                    }
                                }
                                
                                if (filteredPolls.Count == 0)
                                {
                                    context.Response.Write("[]");
                                }
                                else
                                {
                                    string result = "[" + string.Join(",", filteredPolls.ToArray()) + "]";
                                    context.Response.Write(result);
                                }
                            }
                            catch
                            {
                                // If parsing fails, return empty array
                                context.Response.Write("[]");
                            }
                        }
                    }
                    else if (!string.IsNullOrEmpty(id))
                    {
                        string json = LoadEntityJson("polls", id, dataFolder);
                        if (!string.IsNullOrEmpty(json))
                        {
                            // Remove BOM if present
                            if (json.Length > 0 && json[0] == '\uFEFF')
                            {
                                json = json.Substring(1);
                            }
                            context.Response.Write(json.Trim());
                        }
                        else
                        {
                            context.Response.StatusCode = 404;
                            context.Response.Write("{\"error\":\"Not found\"}");
                        }
                    }
                    else
                    {
                        // Return all polls
                        if (string.IsNullOrEmpty(pollsJson))
                        {
                            context.Response.Write("[]");
                        }
                        else
                        {
                            context.Response.Write(pollsJson);
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Return empty array on error
                    context.Response.Write("[]");
                }
                break;

            case "attendees":
                string attendeesJson = LoadAllJson("attendees", dataFolder);
                // Filter by event_id if provided
                if (!string.IsNullOrEmpty(eventId) && attendeesJson != "[]" && !string.IsNullOrEmpty(attendeesJson))
                {
                    List<string> filteredAttendees = new List<string>();
                    string trimmed = attendeesJson.Trim('[', ']');
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                        foreach (string part in parts)
                        {
                            string clean = part.Trim();
                            if (!clean.StartsWith("{")) clean = "{" + clean;
                            if (!clean.EndsWith("}")) clean = clean + "}";
                            if (clean.Contains("\"event_id\":\"" + eventId + "\"") || clean.Contains("\"event_id\": \"" + eventId + "\""))
                            {
                                filteredAttendees.Add(clean);
                            }
                        }
                    }
                    if (filteredAttendees.Count == 0)
                        context.Response.Write("[]");
                    else
                        context.Response.Write("[" + string.Join(",", filteredAttendees.ToArray()) + "]");
                }
                else if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("attendees", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    context.Response.Write(attendeesJson);
                }
                break;

            case "guests":
                string guestsJson = LoadAllJson("guests", dataFolder);
                // Filter by event_id if provided
                if (!string.IsNullOrEmpty(eventId) && guestsJson != "[]" && !string.IsNullOrEmpty(guestsJson))
                {
                    List<string> filteredGuests = new List<string>();
                    string trimmed = guestsJson.Trim('[', ']');
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                        foreach (string part in parts)
                        {
                            string clean = part.Trim();
                            if (!clean.StartsWith("{")) clean = "{" + clean;
                            if (!clean.EndsWith("}")) clean = clean + "}";
                            if (clean.Contains("\"event_id\":\"" + eventId + "\"") || clean.Contains("\"event_id\": \"" + eventId + "\""))
                            {
                                filteredGuests.Add(clean);
                            }
                        }
                    }
                    if (filteredGuests.Count == 0)
                        context.Response.Write("[]");
                    else
                        context.Response.Write("[" + string.Join(",", filteredGuests.ToArray()) + "]");
                }
                else if (!string.IsNullOrEmpty(id))
                {
                    string json = LoadEntityJson("guests", id, dataFolder);
                    if (!string.IsNullOrEmpty(json))
                        context.Response.Write(json);
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write("{\"error\":\"Not found\"}");
                    }
                }
                else
                {
                    context.Response.Write(guestsJson);
                }
                break;

            case "users":
                try
                {
                    if (!string.IsNullOrEmpty(id))
                    {
                        string json = LoadEntityJson("users", id, dataFolder);
                        if (!string.IsNullOrEmpty(json))
                            context.Response.Write(json);
                        else
                        {
                            context.Response.StatusCode = 404;
                            context.Response.Write("{\"error\":\"Not found\"}");
                        }
                    }
                    else
                    {
                        string usersJson = LoadAllJson("users", dataFolder);
                        context.Response.Write(usersJson);
                    }
                }
                catch (Exception ex)
                {
                    // If error loading users, return empty array
                    context.Response.Write("[]");
                }
                break;

            case "group_invitations":
                context.Response.ContentType = "application/json; charset=utf-8";
                try
                {
                    string userPhone = context.Request.QueryString["user_phone"] ?? "";
                    string invGroupId = context.Request.QueryString["group_id"] ?? "";
                    
                    if (!string.IsNullOrEmpty(id))
                    {
                        string json = LoadEntityJson("group_invitations", id, dataFolder);
                        if (!string.IsNullOrEmpty(json))
                            context.Response.Write(json);
                        else
                        {
                            context.Response.StatusCode = 404;
                            context.Response.Write("{\"error\":\"Not found\"}");
                        }
                    }
                    else
                    {
                        string invitationsJson = LoadAllJson("group_invitations", dataFolder);
                        
                        // If no invitations exist, return empty array
                        if (string.IsNullOrEmpty(invitationsJson) || invitationsJson == "[]")
                        {
                            context.Response.Write("[]");
                            break;
                        }
                        
                        // Filter by user_phone or group_id if provided
                        if (!string.IsNullOrEmpty(userPhone) || !string.IsNullOrEmpty(invGroupId))
                        {
                            List<string> filteredInvitations = new List<string>();
                            string trimmed = invitationsJson.Trim('[', ']');
                            if (!string.IsNullOrEmpty(trimmed))
                            {
                                string[] invitations = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                                foreach (string inv in invitations)
                                {
                                    try
                                    {
                                        string cleanInv = inv.Trim();
                                        if (!cleanInv.StartsWith("{")) cleanInv = "{" + cleanInv;
                                        if (!cleanInv.EndsWith("}")) cleanInv = cleanInv + "}";
                                        
                                        bool matches = true;
                                        if (!string.IsNullOrEmpty(userPhone) && !cleanInv.Contains("\"user_phone\":\"" + userPhone + "\""))
                                            matches = false;
                                        if (!string.IsNullOrEmpty(invGroupId) && !cleanInv.Contains("\"group_id\":\"" + invGroupId + "\""))
                                            matches = false;
                                        
                                        if (matches)
                                            filteredInvitations.Add(cleanInv);
                                    }
                                    catch
                                    {
                                        // Skip invalid invitation entries
                                        continue;
                                    }
                                }
                            }
                            context.Response.Write("[" + string.Join(",", filteredInvitations) + "]");
                        }
                        else
                        {
                            context.Response.Write(invitationsJson);
                        }
                    }
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
                    string stackTrace = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
                    context.Response.Write("{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\",\"stack\":\"" + stackTrace + "\"}");
                }
                break;

            default:
                // Debug: return entity value to see what we got
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json; charset=utf-8";
                string debugEntity = HttpUtility.JavaScriptStringEncode(entity ?? "");
                string debugQuery = HttpUtility.JavaScriptStringEncode(context.Request.QueryString.ToString());
                string originalEntity = context.Request.QueryString["entity"] ?? "";
                // List all available cases for debugging
                string availableCases = "groups,events,members,payments,attendees,guests,users,group_invitations,polls";
                context.Response.Write("{\"error\":\"Invalid entity\",\"entity\":\"" + debugEntity + "\",\"originalEntity\":\"" + HttpUtility.JavaScriptStringEncode(originalEntity) + "\",\"queryString\":\"" + debugQuery + "\",\"availableCases\":\"" + availableCases + "\"}");
                break;
        }
    }

    private void HandlePost(HttpContext context, string entity, string dataFolder)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        
        string body = "";
        try
        {
            using (StreamReader reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
            {
                body = reader.ReadToEnd();
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Write("{\"error\":\"Failed to read request body\",\"details\":\"" + HttpUtility.JavaScriptStringEncode(ex.Message) + "\"}");
            return;
        }
        
        string action = context.Request.QueryString["action"] ?? "";
        string id = context.Request.QueryString["id"] ?? "";
        
        // Re-read entity from query string in case it's empty (shouldn't happen, but just in case)
        if (string.IsNullOrEmpty(entity))
        {
            entity = context.Request.QueryString["entity"] ?? "";
        }
        
        // If action=update and id is provided, treat as update (PUT equivalent)
        // Make sure entity is not empty
        if (action == "update" && !string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(entity))
        {
            HandlePutWithBody(context, entity, dataFolder, body);
            return;
        }
        
        // If action=delete and id is provided, treat as delete (DELETE equivalent)
        if (action == "delete" && !string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(entity))
        {
            HandleDelete(context, entity, dataFolder);
            return;
        }
        
        try
        {
            switch (entity.ToLower())
            {
                case "groups":
                // Simple JSON creation
                string newId = Guid.NewGuid().ToString();
                string createdAt = DateTime.UtcNow.ToString("o");
                string updatedAt = DateTime.UtcNow.ToString("o");
                
                // Parse incoming JSON and add fields
                string json = body;
                if (!json.Contains("\"id\""))
                {
                    json = json.Trim();
                    if (json.StartsWith("{") && json.EndsWith("}"))
                    {
                        json = json.Substring(1, json.Length - 2);
                        json = "{\"id\":\"" + newId + "\",\"created_at\":\"" + createdAt + "\",\"updated_at\":\"" + updatedAt + "\"," + json + "}";
                    }
                }
                
                SaveEntityJson("groups", newId, json, dataFolder);
                context.Response.Write(json);
                break;

            case "events":
                string eventNewId = Guid.NewGuid().ToString();
                string eventCreatedAt = DateTime.UtcNow.ToString("o");
                string eventUpdatedAt = DateTime.UtcNow.ToString("o");
                
                string eventJson = body;
                if (!eventJson.Contains("\"id\""))
                {
                    eventJson = eventJson.Trim();
                    if (eventJson.StartsWith("{") && eventJson.EndsWith("}"))
                    {
                        eventJson = eventJson.Substring(1, eventJson.Length - 2);
                        eventJson = "{\"id\":\"" + eventNewId + "\",\"created_at\":\"" + eventCreatedAt + "\",\"updated_at\":\"" + eventUpdatedAt + "\"," + eventJson + "}";
                    }
                }
                
                SaveEntityJson("events", eventNewId, eventJson, dataFolder);
                context.Response.Write(eventJson);
                break;

            case "members":
                string memberNewId = Guid.NewGuid().ToString();
                string memberCreatedAt = DateTime.UtcNow.ToString("o");
                
                string memberJson = body;
                if (!memberJson.Contains("\"id\""))
                {
                    memberJson = memberJson.Trim();
                    if (memberJson.StartsWith("{") && memberJson.EndsWith("}"))
                    {
                        memberJson = memberJson.Substring(1, memberJson.Length - 2);
                        memberJson = "{\"id\":\"" + memberNewId + "\",\"created_at\":\"" + memberCreatedAt + "\"," + memberJson + "}";
                    }
                }
                
                SaveEntityJson("members", memberNewId, memberJson, dataFolder);
                context.Response.Write(memberJson);
                break;

            case "attendees":
                string attendeeNewId = Guid.NewGuid().ToString();
                string attendeeCreatedAt = DateTime.UtcNow.ToString("o");
                
                string attendeeJson = body;
                if (!attendeeJson.Contains("\"id\""))
                {
                    attendeeJson = attendeeJson.Trim();
                    if (attendeeJson.StartsWith("{") && attendeeJson.EndsWith("}"))
                    {
                        attendeeJson = attendeeJson.Substring(1, attendeeJson.Length - 2);
                        attendeeJson = "{\"id\":\"" + attendeeNewId + "\",\"created_at\":\"" + attendeeCreatedAt + "\"," + attendeeJson + "}";
                    }
                }
                
                SaveEntityJson("attendees", attendeeNewId, attendeeJson, dataFolder);
                context.Response.Write(attendeeJson);
                break;

            case "guests":
                string guestNewId = Guid.NewGuid().ToString();
                string guestCreatedAt = DateTime.UtcNow.ToString("o");
                
                string guestJson = body;
                if (!guestJson.Contains("\"id\""))
                {
                    guestJson = guestJson.Trim();
                    if (guestJson.StartsWith("{") && guestJson.EndsWith("}"))
                    {
                        guestJson = guestJson.Substring(1, guestJson.Length - 2);
                        guestJson = "{\"id\":\"" + guestNewId + "\",\"created_at\":\"" + guestCreatedAt + "\"," + guestJson + "}";
                    }
                }
                
                SaveEntityJson("guests", guestNewId, guestJson, dataFolder);
                context.Response.Write(guestJson);
                break;

            case "payments":
                string paymentNewId = Guid.NewGuid().ToString();
                string paymentCreatedAt = DateTime.UtcNow.ToString("o");
                string paymentUpdatedAt = DateTime.UtcNow.ToString("o");
                
                string paymentJson = body;
                if (!paymentJson.Contains("\"id\""))
                {
                    paymentJson = paymentJson.Trim();
                    if (paymentJson.StartsWith("{") && paymentJson.EndsWith("}"))
                    {
                        paymentJson = paymentJson.Substring(1, paymentJson.Length - 2);
                        paymentJson = "{\"id\":\"" + paymentNewId + "\",\"created_at\":\"" + paymentCreatedAt + "\",\"updated_at\":\"" + paymentUpdatedAt + "\"," + paymentJson + "}";
                    }
                }
                
                SaveEntityJson("payments", paymentNewId, paymentJson, dataFolder);
                context.Response.Write(paymentJson);
                break;

            case "polls":
                // Handle vote action (toggle - add or remove vote)
                if (action == "vote")
                {
                    try
                    {
                        // Parse JSON body to get poll_id, option_id, member_id using string manipulation
                        string pollId = "";
                        string optionId = "";
                        string memberId = "";
                        
                        // Extract poll_id
                        int pollIdIdx = body.IndexOf("\"poll_id\"");
                        if (pollIdIdx >= 0)
                        {
                            int startQuote = body.IndexOf("\"", pollIdIdx + 9);
                            int endQuote = body.IndexOf("\"", startQuote + 1);
                            if (startQuote > 0 && endQuote > startQuote)
                            {
                                pollId = body.Substring(startQuote + 1, endQuote - startQuote - 1);
                            }
                        }
                        
                        // Extract option_id
                        int optionIdIdx = body.IndexOf("\"option_id\"");
                        if (optionIdIdx >= 0)
                        {
                            int startQuote = body.IndexOf("\"", optionIdIdx + 11);
                            int endQuote = body.IndexOf("\"", startQuote + 1);
                            if (startQuote > 0 && endQuote > startQuote)
                            {
                                optionId = body.Substring(startQuote + 1, endQuote - startQuote - 1);
                            }
                        }
                        
                        // Extract member_id
                        int memberIdIdx = body.IndexOf("\"member_id\"");
                        if (memberIdIdx >= 0)
                        {
                            int startQuote = body.IndexOf("\"", memberIdIdx + 12);
                            int endQuote = body.IndexOf("\"", startQuote + 1);
                            if (startQuote > 0 && endQuote > startQuote)
                            {
                                memberId = body.Substring(startQuote + 1, endQuote - startQuote - 1);
                            }
                        }
                        
                        if (string.IsNullOrEmpty(pollId) || string.IsNullOrEmpty(optionId) || string.IsNullOrEmpty(memberId))
                        {
                            context.Response.StatusCode = 400;
                            context.Response.ContentType = "application/json; charset=utf-8";
                            context.Response.Write("{\"error\":\"Missing required fields: poll_id, option_id, member_id\"}");
                            return;
                        }
                        
                        string pollJson = LoadEntityJson("polls", pollId, dataFolder);
                        if (string.IsNullOrEmpty(pollJson))
                        {
                            context.Response.StatusCode = 404;
                            context.Response.ContentType = "application/json; charset=utf-8";
                            context.Response.Write("{\"error\":\"Poll not found\"}");
                            return;
                        }
                        
                        // FIRST: If optionId is "1", fix the first option BEFORE checking for option_id
                        // This ensures the first option gets ID "1" if it's missing
                        bool optionFound = false;
                        if (optionId == "1")
                        {
                            try
                            {
                                int pollOptionsIdx = pollJson.IndexOf("\"options\":[");
                                if (pollOptionsIdx >= 0)
                                {
                                    int arrayStart = pollJson.IndexOf("[", pollOptionsIdx);
                                    if (arrayStart >= 0)
                                    {
                                        // Find the first option - it's the first object after "["
                                        int firstOptionStart = arrayStart + 1;
                                        int firstOptionEnd = -1;
                                        bool inString = false;
                                        int braceCount = 0;
                                        
                                        for (int i = firstOptionStart; i < pollJson.Length; i++)
                                        {
                                            char c = pollJson[i];
                                            if (c == '"' && (i == 0 || pollJson[i - 1] != '\\'))
                                                inString = !inString;
                                            else if (!inString)
                                            {
                                                if (c == '{') braceCount++;
                                                else if (c == '}')
                                                {
                                                    braceCount--;
                                                    if (braceCount == 0)
                                                    {
                                                        firstOptionEnd = i;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        
                                        if (firstOptionEnd > firstOptionStart)
                                        {
                                            string firstOption = pollJson.Substring(firstOptionStart, firstOptionEnd - firstOptionStart + 1).Trim();
                                            
                                            // If first option doesn't have an ID, add "1"
                                            if (!firstOption.Contains("\"id\""))
                                            {
                                                string fixedFirstOption = firstOption.Trim();
                                                if (fixedFirstOption.StartsWith("{"))
                                                    fixedFirstOption = fixedFirstOption.Substring(1);
                                                if (fixedFirstOption.EndsWith("}"))
                                                    fixedFirstOption = fixedFirstOption.Substring(0, fixedFirstOption.Length - 1);
                                                
                                                fixedFirstOption = "{\"id\":\"1\"," + fixedFirstOption.Trim() + "}";
                                                pollJson = pollJson.Substring(0, firstOptionStart) + fixedFirstOption + pollJson.Substring(firstOptionEnd + 1);
                                                SaveEntityJson("polls", pollId, pollJson, dataFolder);
                                                optionFound = true;
                                            }
                                            else if (firstOption.Contains("\"id\":\"1\"") || firstOption.Contains("\"id\": \"1\""))
                                            {
                                                optionFound = true;
                                            }
                                        }
                                    }
                                }
                            }
                            catch (Exception fixEx)
                            {
                                // If fixing fails, continue to check if option exists anyway
                                // Don't return error here, let the code continue
                            }
                        }
                        
                        // NOW check if the option_id exists (if we didn't just fix it)
                        if (!optionFound)
                        {
                            optionFound = pollJson.Contains("\"id\":\"" + optionId + "\"") || pollJson.Contains("\"id\": \"" + optionId + "\"");
                        }
                        
                        // If still not found, try to find by order
                        if (!optionFound)
                        {
                            try
                            {
                                int pollOptionsIdx = pollJson.IndexOf("\"options\":[");
                                if (pollOptionsIdx >= 0)
                            {
                                int arrayStart = pollJson.IndexOf("[", pollOptionsIdx);
                                int arrayEnd = pollJson.IndexOf("]", arrayStart);
                                if (arrayEnd > arrayStart)
                                {
                                    string optionsContent = pollJson.Substring(arrayStart + 1, arrayEnd - arrayStart - 1);
                                    
                                    // First, check if option_id exists
                                    optionFound = optionsContent.Contains("\"id\":\"" + optionId + "\"") || optionsContent.Contains("\"id\": \"" + optionId + "\"");
                                    
                                    // If not found, check if any option is missing an id field and fix them
                                    if (!optionFound && optionsContent.Contains("\"text\""))
                                    {
                                        // Options exist - need to check and fix them
                                        List<string> fixedOptions = new List<string>();
                                        string[] optionParts = optionsContent.Split(new string[] { "},{" }, StringSplitOptions.None);
                                        int optionIndex = 0;
                                        foreach (string part in optionParts)
                                        {
                                            string clean = part.Trim();
                                            if (!clean.StartsWith("{")) clean = "{" + clean;
                                            if (!clean.EndsWith("}")) clean = clean + "}";
                                            
                                            // Check if this option has an id
                                            if (!clean.Contains("\"id\""))
                                            {
                                                // Extract text and order
                                                string text = "";
                                                string order = optionIndex.ToString();
                                                
                                                int textIdx = clean.IndexOf("\"text\"");
                                                if (textIdx >= 0)
                                                {
                                                    int textStart = clean.IndexOf("\"", textIdx + 6);
                                                    int textEnd = clean.IndexOf("\"", textStart + 1);
                                                    if (textStart > 0 && textEnd > textStart)
                                                    {
                                                        text = clean.Substring(textStart + 1, textEnd - textStart - 1);
                                                    }
                                                }
                                                
                                                int orderIdx = clean.IndexOf("\"order\"");
                                                if (orderIdx >= 0)
                                                {
                                                    int orderStart = clean.IndexOf(":", orderIdx);
                                                    int orderEnd = clean.IndexOf(",", orderStart);
                                                    if (orderEnd < 0) orderEnd = clean.IndexOf("}", orderStart);
                                                    if (orderEnd > orderStart)
                                                    {
                                                        order = clean.Substring(orderStart + 1, orderEnd - orderStart - 1).Trim();
                                                    }
                                                }
                                                
                                                // Generate new ID for this option
                                                // If this is the first option (order 0) and optionId is "1" (from CreatePollDialog), use "1" as the ID
                                                string newOptionId = Guid.NewGuid().ToString();
                                                
                                                // If optionId is "1" and this is order 0, use the optionId as the new ID
                                                if (order == "0" && optionId == "1")
                                                {
                                                    newOptionId = "1";
                                                    optionFound = true;
                                                }
                                                
                                                clean = "{\"id\":\"" + newOptionId + "\",\"text\":\"" + HttpUtility.JavaScriptStringEncode(text) + "\",\"order\":" + order + "}";
                                            }
                                            else
                                            {
                                                // Check if this option has the optionId we're looking for
                                                if (clean.Contains("\"id\":\"" + optionId + "\"") || clean.Contains("\"id\": \"" + optionId + "\""))
                                                {
                                                    optionFound = true;
                                                }
                                            }
                                            
                                            fixedOptions.Add(clean);
                                            optionIndex++;
                                        }
                                        
                                        // Rebuild options array
                                        string newOptionsContent = "[" + string.Join(",", fixedOptions.ToArray()) + "]";
                                        pollJson = pollJson.Substring(0, arrayStart + 1) + newOptionsContent.Substring(1, newOptionsContent.Length - 2) + pollJson.Substring(arrayEnd);
                                        
                                        // Save the fixed poll
                                        SaveEntityJson("polls", pollId, pollJson, dataFolder);
                                        
                                        // Re-check if option is now found after fixing
                                        if (optionFound)
                                        {
                                            optionFound = pollJson.Contains("\"id\":\"" + optionId + "\"") || pollJson.Contains("\"id\": \"" + optionId + "\"");
                                        }
                                    }
                                    
                                    // Final check - if option still not found, try to find by order
                                    if (!optionFound && !pollJson.Contains("\"id\":\"" + optionId + "\"") && !pollJson.Contains("\"id\": \"" + optionId + "\""))
                                    {
                                        // If optionId is "1", try to find the first option (order 0) and add the ID
                                        if (optionId == "1")
                                        {
                                            // Reload pollJson to get fresh data
                                            pollJson = LoadEntityJson("polls", pollId, dataFolder);
                                            
                                            // Find the first option in the options array - it's the one right after "["
                                            int optionsStartIdx = pollJson.IndexOf("\"options\":[");
                                            if (optionsStartIdx >= 0)
                                            {
                                                int firstArrayStart = pollJson.IndexOf("[", optionsStartIdx);
                                                int firstOptionStart = firstArrayStart + 1;
                                                
                                                // Find the end of the first option (first "}" after array start, but not if it's inside a string)
                                                int firstOptionEnd = -1;
                                                bool inString = false;
                                                for (int i = firstOptionStart; i < pollJson.Length; i++)
                                                {
                                                    if (pollJson[i] == '"' && (i == 0 || pollJson[i - 1] != '\\'))
                                                        inString = !inString;
                                                    else if (!inString && pollJson[i] == '}')
                                                    {
                                                        firstOptionEnd = i;
                                                        break;
                                                    }
                                                }
                                                
                                                if (firstOptionEnd > firstOptionStart)
                                                {
                                                    // Extract the first option
                                                    string firstOption = pollJson.Substring(firstOptionStart, firstOptionEnd - firstOptionStart + 1).Trim();
                                                    
                                                    // Check if this option doesn't have an ID - if so, add ID "1"
                                                    if (!firstOption.Contains("\"id\""))
                                                    {
                                                        // Add ID "1" at the beginning of the option
                                                        string fixedFirstOption = firstOption.Trim();
                                                        if (fixedFirstOption.StartsWith("{"))
                                                            fixedFirstOption = fixedFirstOption.Substring(1);
                                                        if (fixedFirstOption.EndsWith("}"))
                                                            fixedFirstOption = fixedFirstOption.Substring(0, fixedFirstOption.Length - 1);
                                                        
                                                        fixedFirstOption = "{\"id\":\"1\"," + fixedFirstOption.Trim() + "}";
                                                        
                                                        // Replace the first option in pollJson
                                                        pollJson = pollJson.Substring(0, firstOptionStart) + fixedFirstOption + pollJson.Substring(firstOptionEnd + 1);
                                                        SaveEntityJson("polls", pollId, pollJson, dataFolder);
                                                        optionFound = true;
                                                    }
                                                }
                                            }
                                        }
                                        
                                        // If still not found, return error with more details
                                        if (!optionFound && !pollJson.Contains("\"id\":\"" + optionId + "\"") && !pollJson.Contains("\"id\": \"" + optionId + "\""))
                                        {
                                            context.Response.StatusCode = 400;
                                            context.Response.ContentType = "application/json; charset=utf-8";
                                            string pollPreview = pollJson.Length > 200 ? pollJson.Substring(0, 200) : pollJson;
                                            context.Response.Write("{\"error\":\"Invalid option_id: option not found in poll\",\"optionId\":\"" + HttpUtility.JavaScriptStringEncode(optionId) + "\",\"pollPreview\":\"" + HttpUtility.JavaScriptStringEncode(pollPreview) + "\"}");
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception fixEx)
                        {
                            // If fixing options fails, check if option exists anyway
                            if (!pollJson.Contains("\"id\":\"" + optionId + "\"") && !pollJson.Contains("\"id\": \"" + optionId + "\""))
                            {
                                context.Response.StatusCode = 400;
                                context.Response.ContentType = "application/json; charset=utf-8";
                                string errorDetails = "{\"error\":\"Invalid option_id: option not found in poll\",\"optionId\":\"" + HttpUtility.JavaScriptStringEncode(optionId) + "\",\"exception\":\"" + HttpUtility.JavaScriptStringEncode(fixEx.Message) + "\",\"pollJson\":\"" + HttpUtility.JavaScriptStringEncode(pollJson.Substring(0, Math.Min(200, pollJson.Length))) + "\"}";
                                context.Response.Write(errorDetails);
                                return;
                            }
                        }
                        
                        // If option still not found after all attempts, return error
                        if (!optionFound && !pollJson.Contains("\"id\":\"" + optionId + "\"") && !pollJson.Contains("\"id\": \"" + optionId + "\""))
                        {
                            context.Response.StatusCode = 400;
                            context.Response.ContentType = "application/json; charset=utf-8";
                            context.Response.Write("{\"error\":\"Invalid option_id: option not found in poll\",\"optionId\":\"" + HttpUtility.JavaScriptStringEncode(optionId) + "\"}");
                            return;
                        }
                        }
                        
                        // Check if votes array exists, if not add it
                        if (!pollJson.Contains("\"votes\""))
                        {
                            pollJson = pollJson.Trim();
                            if (pollJson.EndsWith("}"))
                            {
                                pollJson = pollJson.Substring(0, pollJson.Length - 1) + ",\"votes\":[]}";
                            }
                        }
                        
                        // Check if this member already voted for this option
                        string votePattern = "\"member_id\":\"" + memberId + "\"";
                        string optionPattern = "\"option_id\":\"" + optionId + "\"";
                        bool hasVote = pollJson.Contains(votePattern) && pollJson.Contains(optionPattern);
                        
                        // Find the vote entry to remove if exists
                        if (hasVote)
                        {
                            // Find the vote entry and remove it
                            int voteStart = pollJson.IndexOf("{\"id\":");
                            while (voteStart >= 0)
                            {
                                int voteEnd = pollJson.IndexOf("}", voteStart);
                                if (voteEnd >= 0)
                                {
                                    string voteEntry = pollJson.Substring(voteStart, voteEnd - voteStart + 1);
                                    if (voteEntry.Contains(votePattern) && voteEntry.Contains(optionPattern))
                                    {
                                        // Remove this vote entry
                                        // Also remove the comma before or after if exists
                                        if (voteStart > 0 && pollJson[voteStart - 1] == ',')
                                        {
                                            voteStart--;
                                        }
                                        else if (voteEnd + 1 < pollJson.Length && pollJson[voteEnd + 1] == ',')
                                        {
                                            voteEnd++;
                                        }
                                        pollJson = pollJson.Substring(0, voteStart) + pollJson.Substring(voteEnd + 1);
                                        break;
                                    }
                                }
                                voteStart = pollJson.IndexOf("{\"id\":", voteStart + 1);
                            }
                        }
                        else
                        {
                            // Add new vote
                            string newVoteId = Guid.NewGuid().ToString();
                            string votedAt = DateTime.UtcNow.ToString("o");
                            string newVote = "{\"id\":\"" + newVoteId + "\",\"option_id\":\"" + optionId + "\",\"member_id\":\"" + memberId + "\",\"voted_at\":\"" + votedAt + "\"}";
                            
                            // Insert into votes array
                            int votesIdx = pollJson.IndexOf("\"votes\":[");
                            if (votesIdx >= 0)
                            {
                                int arrayStart = pollJson.IndexOf("[", votesIdx);
                                int arrayEnd = pollJson.IndexOf("]", arrayStart);
                                if (arrayEnd > arrayStart)
                                {
                                    string votesContent = pollJson.Substring(arrayStart + 1, arrayEnd - arrayStart - 1).Trim();
                                    if (string.IsNullOrEmpty(votesContent))
                                    {
                                        pollJson = pollJson.Substring(0, arrayEnd) + newVote + pollJson.Substring(arrayEnd);
                                    }
                                    else
                                    {
                                        pollJson = pollJson.Substring(0, arrayEnd) + "," + newVote + pollJson.Substring(arrayEnd);
                                    }
                                }
                            }
                        }
                        
                        SaveEntityJson("polls", pollId, pollJson, dataFolder);
                        context.Response.Write(pollJson);
                        return;
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 500;
                        context.Response.ContentType = "application/json; charset=utf-8";
                        string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
                        string errorStack = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
                        context.Response.Write("{\"error\":\"Error processing vote\",\"details\":\"" + errorMsg + "\",\"stack\":\"" + errorStack + "\"}");
                        return;
                    }
                }
                
                // Create new poll
                string pollNewId = Guid.NewGuid().ToString();
                string pollCreatedAt = DateTime.UtcNow.ToString("o");
                
                string pollJsonBody = body.Trim();
                
                // Always parse and rebuild JSON to ensure all required fields
                if (pollJsonBody.StartsWith("{") && pollJsonBody.EndsWith("}"))
                {
                    // Remove outer braces
                    string pollContent = pollJsonBody.Substring(1, pollJsonBody.Length - 2);
                    
                    // Remove existing id and created_at if they exist (we'll add our own)
                    if (pollContent.Contains("\"id\""))
                    {
                        int idStart = pollContent.IndexOf("\"id\"");
                        int idEnd = pollContent.IndexOf(",", idStart);
                        if (idEnd < 0) idEnd = pollContent.IndexOf("}", idStart);
                        if (idEnd > idStart)
                        {
                            string before = pollContent.Substring(0, idStart);
                            string after = pollContent.Substring(idEnd);
                            // Remove comma if it's at the start of 'after'
                            if (after.StartsWith(","))
                                after = after.Substring(1);
                            pollContent = before.TrimEnd(',') + after;
                        }
                    }
                    
                    if (pollContent.Contains("\"created_at\""))
                    {
                        int createdStart = pollContent.IndexOf("\"created_at\"");
                        int createdEnd = pollContent.IndexOf(",", createdStart);
                        if (createdEnd < 0) createdEnd = pollContent.IndexOf("}", createdStart);
                        if (createdEnd > createdStart)
                        {
                            string before = pollContent.Substring(0, createdStart);
                            string after = pollContent.Substring(createdEnd);
                            // Remove comma if it's at the start of 'after'
                            if (after.StartsWith(","))
                                after = after.Substring(1);
                            pollContent = before.TrimEnd(',') + after;
                        }
                    }
                    
                    // Clean up any double commas
                    while (pollContent.Contains(",,"))
                    {
                        pollContent = pollContent.Replace(",,", ",");
                    }
                    pollContent = pollContent.Trim(',');
                    
                    // Ensure options and votes arrays exist
                    if (!pollContent.Contains("\"options\""))
                    {
                        if (!string.IsNullOrEmpty(pollContent) && !pollContent.EndsWith(","))
                            pollContent = pollContent + ",";
                        pollContent = pollContent + "\"options\":[]";
                    }
                    if (!pollContent.Contains("\"votes\""))
                    {
                        if (!string.IsNullOrEmpty(pollContent) && !pollContent.EndsWith(","))
                            pollContent = pollContent + ",";
                        pollContent = pollContent + "\"votes\":[]";
                    }
                    if (!pollContent.Contains("\"is_active\""))
                    {
                        if (!string.IsNullOrEmpty(pollContent) && !pollContent.EndsWith(","))
                            pollContent = pollContent + ",";
                        pollContent = pollContent + "\"is_active\":true";
                    }
                    
                    // Build final JSON with id and created_at at the beginning
                    string idAndCreated = "\"id\":\"" + pollNewId + "\",\"created_at\":\"" + pollCreatedAt + "\"";
                    if (!string.IsNullOrEmpty(pollContent))
                    {
                        pollJsonBody = "{" + idAndCreated + "," + pollContent + "}";
                    }
                    else
                    {
                        pollJsonBody = "{" + idAndCreated + "}";
                    }
                }
                else
                {
                    // If body is not valid JSON, create minimal poll
                    pollJsonBody = "{\"id\":\"" + pollNewId + "\",\"created_at\":\"" + pollCreatedAt + "\",\"options\":[],\"votes\":[],\"is_active\":true}";
                }
                
                SaveEntityJson("polls", pollNewId, pollJsonBody, dataFolder);
                context.Response.Write(pollJsonBody);
                break;

            case "users":
                string userNewId = Guid.NewGuid().ToString();
                string userCreatedAt = DateTime.UtcNow.ToString("o");
                
                string userJson = body;
                
                // Extract id from userJson if provided (for user_0524444244 format)
                if (userJson.Contains("\"id\""))
                {
                    int idStart = userJson.IndexOf("\"id\":\"") + 6;
                    int idEnd = userJson.IndexOf("\"", idStart);
                    if (idEnd > idStart)
                    {
                        userNewId = userJson.Substring(idStart, idEnd - idStart);
                    }
                }
                
                // Check if user already exists by id
                string existingUserJson = LoadEntityJson("users", userNewId, dataFolder);
                if (!string.IsNullOrEmpty(existingUserJson))
                {
                    // User exists, return existing user
                    context.Response.Write(existingUserJson);
                    return;
                }
                
                // Check if user exists by phone (if phone is in the JSON)
                string phone = "";
                if (userJson.Contains("\"phone\""))
                {
                    int phoneStart = userJson.IndexOf("\"phone\":\"") + 9;
                    int phoneEnd = userJson.IndexOf("\"", phoneStart);
                    if (phoneEnd > phoneStart)
                    {
                        phone = userJson.Substring(phoneStart, phoneEnd - phoneStart);
                    }
                }
                
                // If phone provided, check if user exists by phone
                if (!string.IsNullOrEmpty(phone))
                {
                    try
                    {
                        string allUsersJson = LoadAllJson("users", dataFolder);
                        if (!string.IsNullOrEmpty(allUsersJson) && allUsersJson != "[]")
                        {
                            string trimmed = allUsersJson.Trim('[', ']');
                            if (!string.IsNullOrEmpty(trimmed))
                            {
                                string[] parts = trimmed.Split(new string[] { "},{" }, StringSplitOptions.None);
                                foreach (string part in parts)
                                {
                                    string clean = part.Trim();
                                    if (!clean.StartsWith("{")) clean = "{" + clean;
                                    if (!clean.EndsWith("}")) clean = clean + "}";
                                    if (clean.Contains("\"phone\":\"" + phone + "\""))
                                    {
                                        // User exists, return existing user
                                        context.Response.Write(clean);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    catch
                    {
                        // If error loading users, continue to create new user
                    }
                }
                
                // Create new user
                if (!userJson.Contains("\"id\""))
                {
                    userJson = userJson.Trim();
                    if (userJson.StartsWith("{") && userJson.EndsWith("}"))
                    {
                        userJson = userJson.Substring(1, userJson.Length - 2);
                        userJson = "{\"id\":\"" + userNewId + "\",\"created_at\":\"" + userCreatedAt + "\"," + userJson + "}";
                    }
                }
                else
                {
                    // Ensure created_at is in the JSON
                    if (!userJson.Contains("\"created_at\""))
                    {
                        userJson = userJson.Trim();
                        if (userJson.StartsWith("{") && userJson.EndsWith("}"))
                        {
                            userJson = userJson.Substring(1, userJson.Length - 2);
                            userJson = "{" + userJson + ",\"created_at\":\"" + userCreatedAt + "\"}";
                        }
                    }
                }
                
                SaveEntityJson("users", userNewId, userJson, dataFolder);
                context.Response.Write(userJson);
                break;

            case "group_invitations":
                try
                {
                    string invitationNewId = Guid.NewGuid().ToString();
                    string invitationCreatedAt = DateTime.UtcNow.ToString("o");

                    string invitationJson = body;
                    if (string.IsNullOrEmpty(invitationJson) || !invitationJson.Trim().StartsWith("{") || !invitationJson.Trim().EndsWith("}"))
                    {
                        context.Response.StatusCode = 400;
                        context.Response.ContentType = "application/json; charset=utf-8";
                        context.Response.Write("{\"error\":\"Invalid JSON format for group_invitations POST\"}");
                        break;
                    }

                    if (!invitationJson.Contains("\"id\""))
                    {
                        invitationJson = invitationJson.Trim();
                        if (invitationJson.StartsWith("{") && invitationJson.EndsWith("}"))
                        {
                            invitationJson = invitationJson.Substring(1, invitationJson.Length - 2);
                            invitationJson = "{\"id\":\"" + invitationNewId + "\",\"created_at\":\"" + invitationCreatedAt + "\"," + invitationJson + "}";
                        }
                    }

                    SaveEntityJson("group_invitations", invitationNewId, invitationJson, dataFolder);
                    context.Response.Write(invitationJson);
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
                    string stackTrace = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
                    context.Response.Write("{\"error\":\"Error in HandlePost for group_invitations\",\"details\":\"" + errorMsg + "\",\"stack\":\"" + stackTrace + "\"}");
                }
                break;

                default:
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Write("{\"error\":\"Invalid entity\",\"entity\":\"" + HttpUtility.JavaScriptStringEncode(entity ?? "") + "\"}");
                    break;
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json; charset=utf-8";
            string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
            string errorStack = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
            context.Response.Write("{\"error\":\"Error in HandlePost\",\"details\":\"" + errorMsg + "\",\"stack\":\"" + errorStack + "\"}");
        }
    }

    private void HandlePut(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }

        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
        HandlePutWithBody(context, entity, dataFolder, body);
    }
    
    private void HandlePutWithBody(HttpContext context, string entity, string dataFolder, string body)
    {
        // Always read entity from query string to ensure we have the latest value
        entity = context.Request.QueryString["entity"] ?? "";
        
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }
        
        // Debug: log the entity and id
        if (string.IsNullOrEmpty(entity))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            string errorMsg = "{\"error\":\"Missing entity parameter\",\"queryString\":\"" + HttpUtility.JavaScriptStringEncode(context.Request.QueryString.ToString()) + "\"}";
            context.Response.Write(errorMsg);
            return;
        }
        
        // Normalize entity to lowercase for comparison
        entity = entity.ToLower();
        
        switch (entity)
        {
            case "groups":
                string updatedAt = DateTime.UtcNow.ToString("o");
                string json = body;
                // Ensure id is in the JSON
                json = json.Trim();
                if (json.StartsWith("{") && json.EndsWith("}"))
                {
                    json = json.Substring(1, json.Length - 2);
                    // Add/update id
                    if (!json.Contains("\"id\""))
                    {
                        json = "\"id\":\"" + id + "\"," + json;
                    }
                    // Add/update updated_at
                    if (json.Contains("\"updated_at\""))
                    {
                        // Replace existing updated_at
                        int updatedIdx = json.IndexOf("\"updated_at\"");
                        if (updatedIdx > 0)
                        {
                            int startQuote = json.IndexOf("\"", updatedIdx + 13);
                            int endQuote = json.IndexOf("\"", startQuote + 1);
                            if (startQuote > 0 && endQuote > startQuote)
                            {
                                string before = json.Substring(0, startQuote + 1);
                                string after = json.Substring(endQuote);
                                json = before + updatedAt + after;
                            }
                        }
                    }
                    else
                    {
                        json = json + ",\"updated_at\":\"" + updatedAt + "\"";
                    }
                    json = "{" + json + "}";
                }
                
                SaveEntityJson("groups", id, json, dataFolder);
                context.Response.Write(json);
                break;

            case "events":
                string eventUpdatedAt = DateTime.UtcNow.ToString("o");
                string eventJson = body;
                if (!eventJson.Contains("\"updated_at\""))
                {
                    eventJson = eventJson.Trim();
                    if (eventJson.StartsWith("{") && eventJson.EndsWith("}"))
                    {
                        eventJson = eventJson.Substring(1, eventJson.Length - 2);
                        eventJson = eventJson + ",\"updated_at\":\"" + eventUpdatedAt + "\"}";
                        if (!eventJson.StartsWith("{")) eventJson = "{" + eventJson;
                    }
                }
                
                SaveEntityJson("events", id, eventJson, dataFolder);
                context.Response.Write(eventJson);
                break;

            case "members":
                string memberJson = body;
                // Preserve created_at if exists
                string existingMemberJson = LoadEntityJson("members", id, dataFolder);
                if (!string.IsNullOrEmpty(existingMemberJson) && existingMemberJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingMemberJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingMemberJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingMemberJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string createdAt = existingMemberJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                            memberJson = memberJson.Trim();
                            if (memberJson.StartsWith("{") && memberJson.EndsWith("}"))
                            {
                                memberJson = memberJson.Substring(1, memberJson.Length - 2);
                                if (!memberJson.Contains("\"created_at\""))
                                {
                                    memberJson = memberJson + ",\"created_at\":\"" + createdAt + "\"";
                                }
                                memberJson = "{" + memberJson + "}";
                            }
                        }
                    }
                }
                
                SaveEntityJson("members", id, memberJson, dataFolder);
                context.Response.Write(memberJson);
                break;

            case "payments":
                string paymentUpdatedAt = DateTime.UtcNow.ToString("o");
                string paymentJson = body;
                
                // Preserve created_at if exists
                string existingPaymentJson = LoadEntityJson("payments", id, dataFolder);
                string paymentCreatedAt = "";
                if (!string.IsNullOrEmpty(existingPaymentJson) && existingPaymentJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingPaymentJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingPaymentJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingPaymentJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            paymentCreatedAt = existingPaymentJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                        }
                    }
                }
                
                // Parse and rebuild JSON
                paymentJson = paymentJson.Trim();
                if (!paymentJson.StartsWith("{") || !paymentJson.EndsWith("}"))
                {
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Write("{\"error\":\"Invalid JSON format\"}");
                    return;
                }
                
                // Remove outer braces
                string paymentJsonContent = paymentJson.Substring(1, paymentJson.Length - 2);
                
                // Ensure id is in the JSON
                if (!paymentJsonContent.Contains("\"id\""))
                {
                    paymentJsonContent = "\"id\":\"" + id + "\"," + paymentJsonContent;
                }
                else
                {
                    // Replace existing id with the one from query string
                    int idIdx = paymentJsonContent.IndexOf("\"id\"");
                    if (idIdx >= 0)
                    {
                        int startQuote = paymentJsonContent.IndexOf("\"", idIdx + 4);
                        int endQuote = paymentJsonContent.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = paymentJsonContent.Substring(0, startQuote + 1);
                            string after = paymentJsonContent.Substring(endQuote);
                            paymentJsonContent = before + id + after;
                        }
                    }
                }
                
                // Add created_at if we have it
                if (!string.IsNullOrEmpty(paymentCreatedAt) && !paymentJsonContent.Contains("\"created_at\""))
                {
                    paymentJsonContent = paymentJsonContent + ",\"created_at\":\"" + paymentCreatedAt + "\"";
                }
                
                // Add/update updated_at
                if (paymentJsonContent.Contains("\"updated_at\""))
                {
                    // Replace existing updated_at
                    int updatedIdx = paymentJsonContent.IndexOf("\"updated_at\"");
                    if (updatedIdx > 0)
                    {
                        int startQuote = paymentJsonContent.IndexOf("\"", updatedIdx + 13);
                        int endQuote = paymentJsonContent.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = paymentJsonContent.Substring(0, startQuote + 1);
                            string after = paymentJsonContent.Substring(endQuote);
                            paymentJsonContent = before + paymentUpdatedAt + after;
                        }
                    }
                }
                else
                {
                    paymentJsonContent = paymentJsonContent + ",\"updated_at\":\"" + paymentUpdatedAt + "\"";
                }
                
                // Rebuild JSON
                paymentJson = "{" + paymentJsonContent + "}";
                
                SaveEntityJson("payments", id, paymentJson, dataFolder);
                context.Response.Write(paymentJson);
                break;

            case "polls":
                string pollJsonUpdate = body;
                // Preserve created_at if exists
                string existingPollJson = LoadEntityJson("polls", id, dataFolder);
                string pollCreatedAt = "";
                if (!string.IsNullOrEmpty(existingPollJson) && existingPollJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingPollJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingPollJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingPollJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            pollCreatedAt = existingPollJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                        }
                    }
                }
                
                // Parse and rebuild JSON
                pollJsonUpdate = pollJsonUpdate.Trim();
                if (!pollJsonUpdate.StartsWith("{") || !pollJsonUpdate.EndsWith("}"))
                {
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Write("{\"error\":\"Invalid JSON format\"}");
                    return;
                }
                
                // Remove outer braces
                string pollJsonContent = pollJsonUpdate.Substring(1, pollJsonUpdate.Length - 2);
                
                // Ensure id is in the JSON
                if (!pollJsonContent.Contains("\"id\""))
                {
                    pollJsonContent = "\"id\":\"" + id + "\"," + pollJsonContent;
                }
                else
                {
                    // Replace existing id with the one from query string
                    int idIdx = pollJsonContent.IndexOf("\"id\"");
                    if (idIdx >= 0)
                    {
                        int startQuote = pollJsonContent.IndexOf("\"", idIdx + 4);
                        int endQuote = pollJsonContent.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = pollJsonContent.Substring(0, startQuote + 1);
                            string after = pollJsonContent.Substring(endQuote);
                            pollJsonContent = before + id + after;
                        }
                    }
                }
                
                // Add created_at if we have it
                if (!string.IsNullOrEmpty(pollCreatedAt) && !pollJsonContent.Contains("\"created_at\""))
                {
                    pollJsonContent = pollJsonContent + ",\"created_at\":\"" + pollCreatedAt + "\"";
                }
                
                // Rebuild JSON
                pollJsonUpdate = "{" + pollJsonContent + "}";
                
                SaveEntityJson("polls", id, pollJsonUpdate, dataFolder);
                context.Response.Write(pollJsonUpdate);
                break;

            case "attendees":
                string attendeeJson = body;
                if (string.IsNullOrEmpty(attendeeJson))
                {
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Write("{\"error\":\"Empty request body\"}");
                    return;
                }
                
                // Preserve created_at if exists
                string existingAttendeeJson = LoadEntityJson("attendees", id, dataFolder);
                string attendeeCreatedAt = "";
                if (!string.IsNullOrEmpty(existingAttendeeJson) && existingAttendeeJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingAttendeeJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingAttendeeJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingAttendeeJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            attendeeCreatedAt = existingAttendeeJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                        }
                    }
                }
                
                // Parse and rebuild JSON
                attendeeJson = attendeeJson.Trim();
                if (!attendeeJson.StartsWith("{") || !attendeeJson.EndsWith("}"))
                {
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Write("{\"error\":\"Invalid JSON format\"}");
                    return;
                }
                
                // Remove outer braces
                string attendeeJsonContent = attendeeJson.Substring(1, attendeeJson.Length - 2);
                
                // Ensure id is in the JSON
                if (!attendeeJsonContent.Contains("\"id\""))
                {
                    attendeeJsonContent = "\"id\":\"" + id + "\"," + attendeeJsonContent;
                }
                else
                {
                    // Replace existing id with the one from query string
                    int idIdx = attendeeJsonContent.IndexOf("\"id\"");
                    if (idIdx >= 0)
                    {
                        int startQuote = attendeeJsonContent.IndexOf("\"", idIdx + 4);
                        int endQuote = attendeeJsonContent.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = attendeeJsonContent.Substring(0, startQuote + 1);
                            string after = attendeeJsonContent.Substring(endQuote);
                            attendeeJsonContent = before + id + after;
                        }
                    }
                }
                
                // Add created_at if we have it
                if (!string.IsNullOrEmpty(attendeeCreatedAt) && !attendeeJsonContent.Contains("\"created_at\""))
                {
                    attendeeJsonContent = attendeeJsonContent + ",\"created_at\":\"" + attendeeCreatedAt + "\"";
                }
                
                // Rebuild JSON
                attendeeJson = "{" + attendeeJsonContent + "}";
                
                SaveEntityJson("attendees", id, attendeeJson, dataFolder);
                context.Response.Write(attendeeJson);
                break;

            case "guests":
                string guestJson = body;
                // Preserve created_at if exists
                string existingGuestJson = LoadEntityJson("guests", id, dataFolder);
                if (!string.IsNullOrEmpty(existingGuestJson) && existingGuestJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingGuestJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingGuestJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingGuestJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string createdAt = existingGuestJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                            guestJson = guestJson.Trim();
                            if (guestJson.StartsWith("{") && guestJson.EndsWith("}"))
                            {
                                guestJson = guestJson.Substring(1, guestJson.Length - 2);
                                if (!guestJson.Contains("\"created_at\""))
                                {
                                    guestJson = guestJson + ",\"created_at\":\"" + createdAt + "\"";
                                }
                                guestJson = "{" + guestJson + "}";
                            }
                        }
                    }
                }
                
                SaveEntityJson("guests", id, guestJson, dataFolder);
                context.Response.Write(guestJson);
                break;

            case "users":
                string userJson = body;
                // Preserve created_at if exists
                string existingUserJson = LoadEntityJson("users", id, dataFolder);
                if (!string.IsNullOrEmpty(existingUserJson) && existingUserJson.Contains("\"created_at\""))
                {
                    int createdIdx = existingUserJson.IndexOf("\"created_at\"");
                    if (createdIdx > 0)
                    {
                        int startQuote = existingUserJson.IndexOf("\"", createdIdx + 12);
                        int endQuote = existingUserJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string createdAt = existingUserJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                            userJson = userJson.Trim();
                            if (userJson.StartsWith("{") && userJson.EndsWith("}"))
                            {
                                userJson = userJson.Substring(1, userJson.Length - 2);
                                if (!userJson.Contains("\"created_at\""))
                                {
                                    userJson = userJson + ",\"created_at\":\"" + createdAt + "\"";
                                }
                                userJson = "{" + userJson + "}";
                            }
                        }
                    }
                }
                
                SaveEntityJson("users", id, userJson, dataFolder);
                context.Response.Write(userJson);
                break;

            case "group_invitations":
                try
                {
                    string invitationUpdatedAt = DateTime.UtcNow.ToString("o");
                    string invitationJson = body;
                    
                    // Preserve created_at if exists
                    string existingInvitationJson = LoadEntityJson("group_invitations", id, dataFolder);
                    if (!string.IsNullOrEmpty(existingInvitationJson) && existingInvitationJson.Contains("\"created_at\""))
                    {
                        int createdIdx = existingInvitationJson.IndexOf("\"created_at\"");
                        if (createdIdx > 0)
                        {
                            int startQuote = existingInvitationJson.IndexOf("\"", createdIdx + 12);
                            int endQuote = existingInvitationJson.IndexOf("\"", startQuote + 1);
                            if (startQuote > 0 && endQuote > startQuote)
                            {
                                string createdAt = existingInvitationJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                                invitationJson = invitationJson.Trim();
                                if (invitationJson.StartsWith("{") && invitationJson.EndsWith("}"))
                                {
                                    invitationJson = invitationJson.Substring(1, invitationJson.Length - 2);
                                    if (!invitationJson.Contains("\"created_at\""))
                                    {
                                        invitationJson = invitationJson + ",\"created_at\":\"" + createdAt + "\"";
                                    }
                                    invitationJson = "{" + invitationJson + "}";
                                }
                            }
                        }
                    }
                    
                    // Ensure id and updated_at are in the JSON
                    invitationJson = invitationJson.Trim();
                    if (invitationJson.StartsWith("{") && invitationJson.EndsWith("}"))
                    {
                        invitationJson = invitationJson.Substring(1, invitationJson.Length - 2);
                        // Add/update id
                        if (!invitationJson.Contains("\"id\""))
                        {
                            invitationJson = "\"id\":\"" + id + "\"," + invitationJson;
                        }
                        // Add/update updated_at
                        if (invitationJson.Contains("\"updated_at\""))
                        {
                            // Replace existing updated_at
                            int updatedIdx = invitationJson.IndexOf("\"updated_at\"");
                            if (updatedIdx > 0)
                            {
                                int startQuote = invitationJson.IndexOf("\"", updatedIdx + 13);
                                int endQuote = invitationJson.IndexOf("\"", startQuote + 1);
                                if (startQuote > 0 && endQuote > startQuote)
                                {
                                    string before = invitationJson.Substring(0, startQuote + 1);
                                    string after = invitationJson.Substring(endQuote);
                                    invitationJson = before + invitationUpdatedAt + after;
                                }
                            }
                        }
                        else
                        {
                            invitationJson = invitationJson + ",\"updated_at\":\"" + invitationUpdatedAt + "\"";
                        }
                        invitationJson = "{" + invitationJson + "}";
                    }
                    
                    SaveEntityJson("group_invitations", id, invitationJson, dataFolder);
                    context.Response.Write(invitationJson);
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
                    string stackTrace = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
                    context.Response.Write("{\"error\":\"Error in HandlePutWithBody for group_invitations\",\"details\":\"" + errorMsg + "\",\"stack\":\"" + stackTrace + "\"}");
                }
                break;

            default:
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json; charset=utf-8";
                string originalEntity = context.Request.QueryString["entity"] ?? "";
                string errorResponse = "{\"error\":\"Invalid entity\",\"entity\":\"" + HttpUtility.JavaScriptStringEncode(entity ?? "") + "\",\"originalEntity\":\"" + HttpUtility.JavaScriptStringEncode(originalEntity) + "\",\"id\":\"" + HttpUtility.JavaScriptStringEncode(id ?? "") + "\",\"queryString\":\"" + HttpUtility.JavaScriptStringEncode(context.Request.QueryString.ToString()) + "\"}";
                context.Response.Write(errorResponse);
                break;
        }
    }

    private void HandlePaymentWebhook(HttpContext context, string dataFolder)
    {
        // Webhook endpoint for PayBox payment notifications
        // PayBox will call this URL when a payment is completed
        // Expected parameters: payment_id (PayBox payment ID), amount, payer_phone (optional)
        
        string payboxPaymentId = context.Request.QueryString["payment_id"] ?? "";
        string amountStr = context.Request.QueryString["amount"] ?? "";
        string payerPhone = context.Request.QueryString["payer_phone"] ?? "";
        
        if (string.IsNullOrEmpty(payboxPaymentId))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Write("{\"error\":\"Missing payment_id parameter\"}");
            return;
        }

        try
        {
            // Read webhook data from PayBox (usually in POST body)
            string body = new StreamReader(context.Request.InputStream).ReadToEnd();
            
            // Try to parse PayBox webhook data
            // PayBox typically sends: {"status": "paid", "payment_id": "...", "amount": ..., "payer_phone": "..."}
            // Try to find payment by paybox_payment_id first, then by amount + payer_phone
            
            string paymentId = null;
            string existingPaymentJson = null;
            
            // First, try to find by paybox_payment_id
            string[] allPaymentFiles = Directory.GetFiles(Path.Combine(dataFolder, "payments"), "*.json");
            foreach (string file in allPaymentFiles)
            {
                string content = File.ReadAllText(file);
                if (content.Contains("\"paybox_payment_id\"") && content.Contains("\"" + payboxPaymentId + "\""))
                {
                    paymentId = Path.GetFileNameWithoutExtension(file);
                    existingPaymentJson = content;
                    break;
                }
            }
            
            // If not found by paybox_payment_id, try to find by amount + payer_phone
            if (string.IsNullOrEmpty(existingPaymentJson) && !string.IsNullOrEmpty(amountStr) && !string.IsNullOrEmpty(payerPhone))
            {
                decimal amount = 0;
                if (decimal.TryParse(amountStr, out amount))
                {
                    foreach (string file in allPaymentFiles)
                    {
                        string content = File.ReadAllText(file);
                        // Check if amount matches and if we can find payer by phone
                        if (content.Contains("\"amount\":" + amount.ToString("F2")) || 
                            content.Contains("\"amount\":" + amount.ToString("F")))
                        {
                            // Try to match payer by phone (need to check members/guests)
                            // For now, mark as potential match
                            paymentId = Path.GetFileNameWithoutExtension(file);
                            existingPaymentJson = content;
                            break;
                        }
                    }
                }
            }
            
            // If still not found, try direct lookup by paymentId (if payboxPaymentId is our internal ID)
            if (string.IsNullOrEmpty(existingPaymentJson))
            {
                existingPaymentJson = LoadEntityJson("payments", payboxPaymentId, dataFolder);
                if (!string.IsNullOrEmpty(existingPaymentJson))
                {
                    paymentId = payboxPaymentId;
                }
            }
            
            if (string.IsNullOrEmpty(existingPaymentJson))
            {
                context.Response.StatusCode = 404;
                context.Response.Write("{\"error\":\"Payment not found\",\"paybox_payment_id\":\"" + HttpUtility.JavaScriptStringEncode(payboxPaymentId) + "\"}");
                return;
            }
            
            if (string.IsNullOrEmpty(paymentId))
            {
                // Extract payment ID from JSON
                int idIdx = existingPaymentJson.IndexOf("\"id\"");
                if (idIdx > 0)
                {
                    int startQuote = existingPaymentJson.IndexOf("\"", idIdx + 4);
                    int endQuote = existingPaymentJson.IndexOf("\"", startQuote + 1);
                    if (startQuote > 0 && endQuote > startQuote)
                    {
                        paymentId = existingPaymentJson.Substring(startQuote + 1, endQuote - startQuote - 1);
                    }
                }
            }

            // Update payment status to paid
            string paymentUpdatedAt = DateTime.UtcNow.ToString("o");
            string paymentJson = existingPaymentJson;
            
            // Update payment_status to "paid"
            if (paymentJson.Contains("\"payment_status\""))
            {
                int statusIdx = paymentJson.IndexOf("\"payment_status\"");
                if (statusIdx > 0)
                {
                    int startQuote = paymentJson.IndexOf("\"", statusIdx + 17);
                    int endQuote = paymentJson.IndexOf("\"", startQuote + 1);
                    if (startQuote > 0 && endQuote > startQuote)
                    {
                        string before = paymentJson.Substring(0, startQuote + 1);
                        string after = paymentJson.Substring(endQuote);
                        paymentJson = before + "paid" + after;
                    }
                }
            }
            else
            {
                // Add payment_status if it doesn't exist
                paymentJson = paymentJson.Trim();
                if (paymentJson.EndsWith("}"))
                {
                    paymentJson = paymentJson.Substring(0, paymentJson.Length - 1);
                    paymentJson = paymentJson + ",\"payment_status\":\"paid\"}";
                }
            }

            // Add/update paid_at
            if (paymentJson.Contains("\"paid_at\""))
            {
                int paidAtIdx = paymentJson.IndexOf("\"paid_at\"");
                if (paidAtIdx > 0)
                {
                    int startQuote = paymentJson.IndexOf("\"", paidAtIdx + 9);
                    int endQuote = paymentJson.IndexOf("\"", startQuote + 1);
                    if (startQuote > 0 && endQuote > startQuote)
                    {
                        string before = paymentJson.Substring(0, startQuote + 1);
                        string after = paymentJson.Substring(endQuote);
                        paymentJson = before + paymentUpdatedAt + after;
                    }
                }
            }
            else
            {
                paymentJson = paymentJson.Trim();
                if (paymentJson.EndsWith("}"))
                {
                    paymentJson = paymentJson.Substring(0, paymentJson.Length - 1);
                    paymentJson = paymentJson + ",\"paid_at\":\"" + paymentUpdatedAt + "\"}";
                }
            }
            
            // Add/update paybox_payment_id (to track which PayBox payment this is)
            if (!string.IsNullOrEmpty(payboxPaymentId))
            {
                if (paymentJson.Contains("\"paybox_payment_id\""))
                {
                    int payboxIdIdx = paymentJson.IndexOf("\"paybox_payment_id\"");
                    if (payboxIdIdx > 0)
                    {
                        int startQuote = paymentJson.IndexOf("\"", payboxIdIdx + 19);
                        int endQuote = paymentJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = paymentJson.Substring(0, startQuote + 1);
                            string after = paymentJson.Substring(endQuote);
                            paymentJson = before + payboxPaymentId + after;
                        }
                    }
                }
                else
                {
                    paymentJson = paymentJson.Trim();
                    if (paymentJson.EndsWith("}"))
                    {
                        paymentJson = paymentJson.Substring(0, paymentJson.Length - 1);
                        paymentJson = paymentJson + ",\"paybox_payment_id\":\"" + HttpUtility.JavaScriptStringEncode(payboxPaymentId) + "\"}";
                    }
                }
            }
            
            // Add/update paid_by_phone if provided (to track who paid)
            if (!string.IsNullOrEmpty(payerPhone))
            {
                if (paymentJson.Contains("\"paid_by_phone\""))
                {
                    int paidByIdx = paymentJson.IndexOf("\"paid_by_phone\"");
                    if (paidByIdx > 0)
                    {
                        int startQuote = paymentJson.IndexOf("\"", paidByIdx + 15);
                        int endQuote = paymentJson.IndexOf("\"", startQuote + 1);
                        if (startQuote > 0 && endQuote > startQuote)
                        {
                            string before = paymentJson.Substring(0, startQuote + 1);
                            string after = paymentJson.Substring(endQuote);
                            paymentJson = before + HttpUtility.JavaScriptStringEncode(payerPhone) + after;
                        }
                    }
                }
                else
                {
                    paymentJson = paymentJson.Trim();
                    if (paymentJson.EndsWith("}"))
                    {
                        paymentJson = paymentJson.Substring(0, paymentJson.Length - 1);
                        paymentJson = paymentJson + ",\"paid_by_phone\":\"" + HttpUtility.JavaScriptStringEncode(payerPhone) + "\"}";
                    }
                }
            }

            // Update updated_at
            if (paymentJson.Contains("\"updated_at\""))
            {
                int updatedIdx = paymentJson.IndexOf("\"updated_at\"");
                if (updatedIdx > 0)
                {
                    int startQuote = paymentJson.IndexOf("\"", updatedIdx + 13);
                    int endQuote = paymentJson.IndexOf("\"", startQuote + 1);
                    if (startQuote > 0 && endQuote > startQuote)
                    {
                        string before = paymentJson.Substring(0, startQuote + 1);
                        string after = paymentJson.Substring(endQuote);
                        paymentJson = before + paymentUpdatedAt + after;
                    }
                }
            }
            else
            {
                paymentJson = paymentJson.Trim();
                if (paymentJson.EndsWith("}"))
                {
                    paymentJson = paymentJson.Substring(0, paymentJson.Length - 1);
                    paymentJson = paymentJson + ",\"updated_at\":\"" + paymentUpdatedAt + "\"}";
                }
            }

            SaveEntityJson("payments", paymentId, paymentJson, dataFolder);
            
            // Return success to PayBox
            context.Response.StatusCode = 200;
            context.Response.Write("{\"success\":true,\"message\":\"Payment updated\"}");
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
            context.Response.Write("{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\"}");
        }
    }

    private void HandleDelete(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }

        string filePath = Path.Combine(dataFolder, entity, id + ".json");
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            context.Response.Write("{\"success\":true}");
        }
        else
        {
            context.Response.StatusCode = 404;
            context.Response.Write("{\"error\":\"Not found\"}");
        }
    }

    private string LoadEntityJson(string entity, string id, string dataFolder)
    {
        string filePath = Path.Combine(dataFolder, entity, id + ".json");
        if (File.Exists(filePath))
        {
            return File.ReadAllText(filePath, Encoding.UTF8);
        }
        return null;
    }

    private string LoadAllJson(string entity, string dataFolder)
    {
        List<string> items = new List<string>();
        string folderPath = Path.Combine(dataFolder, entity);
        if (Directory.Exists(folderPath))
        {
            foreach (string file in Directory.GetFiles(folderPath, "*.json"))
            {
                try
                {
                    string content = File.ReadAllText(file, Encoding.UTF8);
                    // Remove BOM if present
                    if (content.Length > 0 && content[0] == '\uFEFF')
                    {
                        content = content.Substring(1);
                    }
                    // Trim whitespace
                    content = content.Trim();
                    // Only add if it's valid JSON (starts with {)
                    if (!string.IsNullOrEmpty(content) && content.StartsWith("{"))
                    {
                        items.Add(content);
                    }
                }
                catch
                {
                    // Skip invalid files
                    continue;
                }
            }
        }
        if (items.Count == 0)
        {
            return "[]";
        }
        return "[" + string.Join(",", items.ToArray()) + "]";
    }

    private void SaveEntityJson(string entity, string id, string json, string dataFolder)
    {
        string folderPath = Path.Combine(dataFolder, entity);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }
        string filePath = Path.Combine(folderPath, id + ".json");
        File.WriteAllText(filePath, json, Encoding.UTF8);
    }

    public bool IsReusable { get { return true; } }
}
