<%@ WebHandler Language="C#" Class="ApiClaimHandler" %>
using System;
using System.Configuration;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Web;

public class ApiClaimHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.AddHeader("Access-Control-Allow-Origin", "*");
        context.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        context.Response.AddHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 204;
            return;
        }

        if (context.Request.HttpMethod != "POST")
        {
            context.Response.StatusCode = 405;
            context.Response.Write("{\"error\":\"Method Not Allowed\"}");
            return;
        }

        try
        {
            string payloadRaw = context.Request.Form["payload"] ?? "";
            if (string.IsNullOrWhiteSpace(payloadRaw))
            {
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Invalid payload\"}");
                return;
            }

            string claimTypeLabel = ExtractJsonValue(payloadRaw, "claimTypeLabel");
            string idNumber = ExtractJsonValue(payloadRaw, "idNumber");
            string email = ExtractJsonValue(payloadRaw, "email");
            string incidentDate = ExtractJsonValue(payloadRaw, "incidentDate");
            string details = ExtractJsonValue(payloadRaw, "details");
            string fullName = ExtractJsonValue(payloadRaw, "fullName");
            if (string.IsNullOrWhiteSpace(fullName))
            {
                fullName = (ExtractJsonValue(payloadRaw, "firstName") + " " + ExtractJsonValue(payloadRaw, "lastName")).Trim();
            }

            if (string.IsNullOrWhiteSpace(claimTypeLabel) || string.IsNullOrWhiteSpace(idNumber) ||
                string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(incidentDate) ||
                string.IsNullOrWhiteSpace(details) || string.IsNullOrWhiteSpace(fullName))
            {
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Missing required fields\"}");
                return;
            }

            if (context.Request.Files == null || context.Request.Files.Count < 1)
            {
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"At least one attachment is required\"}");
                return;
            }

            SendClaimEmail(payloadRaw, fullName, claimTypeLabel, email, context.Request.Files);
            context.Response.StatusCode = 200;
            context.Response.Write("{\"success\":true}");
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.Write("{\"error\":\"Mail failed\",\"details\":\"" + EscapeJson(ex.Message) + "\"}");
        }
    }

    private static void SendClaimEmail(string payloadRaw, string fullName, string claimTypeLabel, string replyTo, HttpFileCollection files)
    {
        string host = ConfigurationManager.AppSettings["ContactSmtpHost"];
        string portValue = ConfigurationManager.AppSettings["ContactSmtpPort"];
        string user = ConfigurationManager.AppSettings["ContactSmtpUser"];
        string pass = ConfigurationManager.AppSettings["ContactSmtpPass"];
        string from = ConfigurationManager.AppSettings["ContactFromAddress"];
        string to = ConfigurationManager.AppSettings["ContactToAddress"];
        string enableSslValue = ConfigurationManager.AppSettings["ContactSmtpEnableSsl"];

        int port = 587;
        int.TryParse(portValue, out port);
        bool enableSsl = true;
        if (!string.IsNullOrEmpty(enableSslValue))
        {
            enableSsl = enableSslValue.Trim().ToLowerInvariant() != "false";
        }

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass) ||
            string.IsNullOrWhiteSpace(from))
        {
            throw new Exception("SMTP settings are missing.");
        }

        var mail = new MailMessage();
        mail.From = new MailAddress(from, "TravelSure");
        string recipients = string.IsNullOrWhiteSpace(to) ? "ophir@ophirins.co.il,rani@ophirins.co.il,eli@ophirins.co.il" : to;
        foreach (var part in recipients.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries))
        {
            mail.To.Add(new MailAddress(part.Trim()));
        }
        mail.Subject = "תביעה חדשה: " + claimTypeLabel + " - " + fullName;
        mail.Body = BuildHtml(payloadRaw, fullName, claimTypeLabel);
        mail.IsBodyHtml = true;
        if (!string.IsNullOrWhiteSpace(replyTo))
        {
            try { mail.ReplyToList.Add(new MailAddress(replyTo)); } catch { }
        }

        string[] allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".heic" };
        for (int i = 0; i < files.Count; i++)
        {
            HttpPostedFile file = files[i];
            if (file == null || file.ContentLength <= 0) continue;
            if (file.ContentLength > 10 * 1024 * 1024) continue;
            string ext = Path.GetExtension(file.FileName ?? "").ToLowerInvariant();
            bool okExt = false;
            for (int a = 0; a < allowed.Length; a++) if (allowed[a] == ext) okExt = true;
            if (!okExt) continue;
            string safeName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(safeName)) safeName = "attachment" + ext;
            mail.Attachments.Add(new Attachment(file.InputStream, safeName, string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType));
        }

        if (mail.Attachments.Count == 0)
        {
            throw new Exception("No valid attachments");
        }

        var client = new SmtpClient(host, port);
        client.EnableSsl = enableSsl;
        client.Credentials = new NetworkCredential(user, pass);
        client.Send(mail);
    }

    private static string BuildHtml(string payloadRaw, string fullName, string claimTypeLabel)
    {
        var sb = new StringBuilder();
        sb.Append("<div dir=\"rtl\" style=\"font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">");
        sb.Append("<h2 style=\"margin:0 0 12px;color:#1f4b46;\">הוגשה תביעה חדשה באתר TravelSure</h2>");
        sb.Append("<p style=\"margin:0 0 12px;color:#64748b;font-size:13px;\">אופיר ושות׳ סוכנות לביטוח</p>");
        sb.Append("<table style=\"border-collapse:collapse;width:100%;max-width:900px;\">");
        AppendRow(sb, "שם מלא", fullName);
        AppendRow(sb, "סוג תביעה", claimTypeLabel);
        string[] keys = new[] {
            "baggageSubtypeLabel","idNumber","birthDate","email","mobile","phone",
            "policyNumber","incidentDate","country","details","totalClaimed",
            "bankName","bankCode","branchName","branchNumber","accountNumber",
            "crmCustomerName","selectedPolicyId"
        };
        string[] labels = new[] {
            "סוג מטען","תעודת זהות","תאריך לידה","אימייל","נייד","טלפון",
            "מספר פוליסה","תאריך האירוע","מדינה","תיאור","סכום נתבע",
            "בנק","קוד בנק","סניף","מספר סניף","חשבון",
            "שם מ-CRM","פוליסה שנבחרה"
        };
        for (int i = 0; i < keys.Length; i++)
        {
            string val = ExtractJsonValue(payloadRaw, keys[i]);
            if (!string.IsNullOrWhiteSpace(val)) AppendRow(sb, labels[i], val);
        }
        sb.Append("</table>");
        sb.Append("<pre style=\"margin-top:16px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;font-size:12px;\">");
        sb.Append(HttpUtility.HtmlEncode(payloadRaw));
        sb.Append("</pre></div>");
        return sb.ToString();
    }

    private static void AppendRow(StringBuilder sb, string label, string value)
    {
        sb.Append("<tr><td style=\"padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:34%;\"><strong>");
        sb.Append(HttpUtility.HtmlEncode(label));
        sb.Append("</strong></td><td style=\"padding:8px;border:1px solid #e2e8f0;white-space:pre-wrap;\">");
        sb.Append(HttpUtility.HtmlEncode(value));
        sb.Append("</td></tr>");
    }

    private static string ExtractJsonValue(string json, string key)
    {
        if (string.IsNullOrEmpty(json)) return string.Empty;
        string pattern = "\"" + key + "\"";
        int index = json.IndexOf(pattern, StringComparison.OrdinalIgnoreCase);
        if (index < 0) return string.Empty;
        int colon = json.IndexOf(':', index);
        if (colon < 0) return string.Empty;
        int i = colon + 1;
        while (i < json.Length && char.IsWhiteSpace(json[i])) i++;
        if (i >= json.Length) return string.Empty;
        if (json[i] == '"')
        {
            int startQuote = i;
            int endQuote = json.IndexOf('"', startQuote + 1);
            while (endQuote > 0 && json[endQuote - 1] == '\\')
            {
                endQuote = json.IndexOf('"', endQuote + 1);
            }
            if (endQuote < 0) return string.Empty;
            return json.Substring(startQuote + 1, endQuote - startQuote - 1)
                .Replace("\\n", "\n")
                .Replace("\\\"", "\"")
                .Replace("\\\\", "\\");
        }
        int end = i;
        while (end < json.Length && json[end] != ',' && json[end] != '}' && json[end] != ']') end++;
        return json.Substring(i, end - i).Trim().Trim('"');
    }

    private static string EscapeJson(string value)
    {
        if (value == null) return string.Empty;
        return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    public bool IsReusable { get { return false; } }
}
