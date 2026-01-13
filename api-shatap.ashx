<%@ WebHandler Language="C#" Class="ShatapHandler" %>

using System;
using System.Web;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

public class ShatapHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }

        try
        {
            string id = context.Request.QueryString["id"];
            if (string.IsNullOrEmpty(id))
            {
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Missing id parameter\"}");
                return;
            }

            // קריאה ל-XML
            string xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
            string xmlText = null;

            try
            {
                using (WebClient client = new WebClient())
                {
                    client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                    client.Headers.Add("Accept", "application/xml, text/xml, */*");
                    xmlText = client.DownloadString(xmlUrl);
                }
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = 502;
                context.Response.Write($"{{\"error\":\"Failed to fetch XML\",\"details\":\"{HttpUtility.JavaScriptStringEncode(ex.Message)}\"}}");
                return;
            }

            if (string.IsNullOrEmpty(xmlText))
            {
                context.Response.StatusCode = 502;
                context.Response.Write("{\"error\":\"Empty XML response\"}");
                return;
            }

            // חיפוש ה-ID ב-XML
            string pattern = @"<ShatapItem>\s*<Id>(.*?)</Id>\s*<Name>(.*?)</Name>\s*</ShatapItem>";
            MatchCollection matches = Regex.Matches(xmlText, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);

            foreach (Match match in matches)
            {
                string itemId = match.Groups[1].Value.Trim();
                string itemName = match.Groups[2].Value.Trim();

                if (itemId == id && !string.IsNullOrEmpty(itemName))
                {
                    // פיענוח HTML entities
                    itemName = HttpUtility.HtmlDecode(itemName);
                    itemName = System.Text.RegularExpressions.Regex.Replace(itemName, @"&#(\d+);", m =>
                    {
                        int code = int.Parse(m.Groups[1].Value);
                        return ((char)code).ToString();
                    });

                    context.Response.StatusCode = 200;
                    context.Response.Write($"{{\"id\":\"{HttpUtility.JavaScriptStringEncode(itemId)}\",\"name\":\"{HttpUtility.JavaScriptStringEncode(itemName)}\"}}");
                    return;
                }
            }

            // לא נמצא
            context.Response.StatusCode = 404;
            context.Response.Write("{\"error\":\"Shatap not found\"}");
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.Write($"{{\"error\":\"Internal server error\",\"details\":\"{HttpUtility.JavaScriptStringEncode(ex.Message)}\"}}");
        }
    }

    public bool IsReusable
    {
        get { return true; }
    }
}
