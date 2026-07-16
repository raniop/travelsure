<%@ WebHandler Language="C#" Class="ApiContactHandler" %>
using System;
using System.Configuration;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Web;

public class ApiContactHandler : IHttpHandler
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

        string body;
        using (var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            body = reader.ReadToEnd();
        }

        if (string.IsNullOrWhiteSpace(body))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Invalid payload\"}");
            return;
        }

        string name = ExtractJsonValue(body, "name");
        string email = ExtractJsonValue(body, "email");
        string phone = ExtractJsonValue(body, "phone");
        string message = ExtractJsonValue(body, "message");

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(message))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Missing required fields\"}");
            return;
        }

        if (name.Length > 100 || email.Length > 255 || message.Length > 5000)
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Input too long\"}");
            return;
        }

        try
        {
            SendEmail(name, email, phone, message);
            context.Response.StatusCode = 200;
            context.Response.Write("{\"success\":true}");
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.Write("{\"error\":\"Mail failed\",\"details\":\"" + EscapeJson(ex.Message) + "\"}");
        }
    }

    private static void SendEmail(string name, string email, string phone, string message)
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
            string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to))
        {
            throw new Exception("SMTP settings are missing.");
        }

        var mail = new MailMessage();
        mail.From = new MailAddress(from, "TravelSure");
        mail.To.Add(new MailAddress(to));
        mail.Subject = "פנייה חדשה מהאתר - TravelSure";
        mail.Body = BuildBody(name, email, phone, message);
        mail.IsBodyHtml = false;
        mail.ReplyToList.Add(new MailAddress(email));

        var client = new SmtpClient(host, port);
        client.EnableSsl = enableSsl;
        client.Credentials = new NetworkCredential(user, pass);
        client.Send(mail);
    }

    private static string BuildBody(string name, string email, string phone, string message)
    {
        var sb = new StringBuilder();
        sb.AppendLine("שם: " + name);
        sb.AppendLine("אימייל: " + email);
        sb.AppendLine("טלפון: " + (string.IsNullOrWhiteSpace(phone) ? "לא צוין" : phone));
        sb.AppendLine("הודעה:");
        sb.AppendLine(message);
        return sb.ToString();
    }

    private static string ExtractJsonValue(string json, string key)
    {
        if (string.IsNullOrEmpty(json)) return string.Empty;
        string pattern = "\"" + key + "\"";
        int index = json.IndexOf(pattern, StringComparison.OrdinalIgnoreCase);
        if (index < 0) return string.Empty;
        int colon = json.IndexOf(':', index);
        if (colon < 0) return string.Empty;
        int startQuote = json.IndexOf('"', colon + 1);
        if (startQuote < 0) return string.Empty;
        int endQuote = json.IndexOf('"', startQuote + 1);
        if (endQuote < 0) return string.Empty;
        return json.Substring(startQuote + 1, endQuote - startQuote - 1);
    }

    private static string EscapeJson(string value)
    {
        if (value == null) return string.Empty;
        return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    public bool IsReusable { get { return false; } }
}
