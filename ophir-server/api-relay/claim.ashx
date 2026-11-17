<%@ WebHandler Language="C#" Class="ClaimRelayHandler" %>
// Relays claim submissions to the send-contact-email edge function, for customers whose
// network (filtered internet, antivirus) blocks supabase.co but allows ophir.travelsure.co.il.
// It forwards only to that one function. The anon key is the public one the site already ships.
using System;
using System.IO;
using System.Net;
using System.Web;

public class ClaimRelayHandler : IHttpHandler
{
    private const string TargetUrl = "https://zhsfjwpwxjeysvstgsus.supabase.co/functions/v1/send-contact-email";
    private const string AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoc2Zqd3B3eGpleXN2c3Rnc3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjUyNjQsImV4cCI6MjA4MjI0MTI2NH0.kU8g5NpJv1bpkvDLuWqg4vXc6xuGbka3pE9bD9sKl3Y";

    public bool IsReusable { get { return true; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.AddHeader("Access-Control-Allow-Origin", "*");
        context.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type");
        context.Response.AddHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        context.Response.ContentType = "application/json; charset=utf-8";

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

        byte[] body;
        using (var ms = new MemoryStream())
        {
            context.Request.InputStream.CopyTo(ms);
            body = ms.ToArray();
        }
        if (body.Length == 0)
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Empty body\"}");
            return;
        }

        try
        {
            // TLS 1.2 (the enum value is missing when compiling against .NET 4.0)
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
            var req = (HttpWebRequest)WebRequest.Create(TargetUrl);
            req.Method = "POST";
            req.ContentType = "application/json";
            req.Headers["apikey"] = AnonKey;
            req.Headers["Authorization"] = "Bearer " + AnonKey;
            req.Timeout = 280000;
            req.ReadWriteTimeout = 280000;
            req.ContentLength = body.Length;
            using (var rs = req.GetRequestStream())
            {
                rs.Write(body, 0, body.Length);
            }

            HttpWebResponse res;
            try
            {
                res = (HttpWebResponse)req.GetResponse();
            }
            catch (WebException wex)
            {
                res = wex.Response as HttpWebResponse;
                if (res == null) throw;
            }
            using (res)
            using (var reader = new StreamReader(res.GetResponseStream()))
            {
                context.Response.StatusCode = (int)res.StatusCode;
                context.Response.Write(reader.ReadToEnd());
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 502;
            context.Response.Write("{\"error\":\"relay_failed\",\"details\":\"" +
                HttpUtility.JavaScriptStringEncode(ex.Message) + "\"}");
        }
    }
}
