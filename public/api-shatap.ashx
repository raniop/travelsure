<%@ WebHandler Language="C#" Class="ShatapHandler" %>

using System;
using System.Web;
using System.Net;
using System.Text;
using System.IO;

public class ShatapHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.Charset = "utf-8";
        context.Response.AppendHeader("Access-Control-Allow-Origin", "*");
        context.Response.AppendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        context.Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type");

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            context.Response.Write("{\"status\":\"ok\"}");
            return;
        }

        string id = context.Request.QueryString["id"];
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }

        try
        {
            string xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(xmlUrl);
            request.Method = "GET";
            request.Accept = "application/xml, text/xml, */*";
            request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
            request.Timeout = 15000;
            request.ReadWriteTimeout = 15000;
            
            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            Stream stream = response.GetResponseStream();
            byte[] bytes = null;
            using (MemoryStream ms = new MemoryStream())
            {
                stream.CopyTo(ms);
                bytes = ms.ToArray();
            }
            stream.Close();
            response.Close();

            string header = Encoding.ASCII.GetString(bytes, 0, Math.Min(bytes.Length, 2000));
            string detectedEncoding = null;
            int encIndex = header.IndexOf("encoding=");
            if (encIndex >= 0 && encIndex + 10 < header.Length)
            {
                char quote = header[encIndex + 9];
                int start = encIndex + 10;
                int end = header.IndexOf(quote, start);
                if (end > start)
                {
                    detectedEncoding = header.Substring(start, end - start);
                }
            }

            Encoding xmlEncoding = Encoding.UTF8;
            if (!string.IsNullOrEmpty(detectedEncoding))
            {
                try
                {
                    xmlEncoding = Encoding.GetEncoding(detectedEncoding);
                }
                catch
                {
                    xmlEncoding = Encoding.UTF8;
                }
            }

            string xmlText = xmlEncoding.GetString(bytes);

            // חיפוש פשוט
            string searchPattern = "<Id>" + id + "</Id>";
            int idPos = xmlText.IndexOf(searchPattern);
            
            if (idPos == -1)
            {
                context.Response.StatusCode = 404;
                context.Response.Write("{\"error\":\"Shatap not found\"}");
                return;
            }
            
            // חיפוש <Name> אחרי ה-Id
            int nameStart = xmlText.IndexOf("<Name>", idPos);
            if (nameStart == -1)
            {
                context.Response.StatusCode = 404;
                context.Response.Write("{\"error\":\"Name tag not found\"}");
                return;
            }
            
            int nameEnd = xmlText.IndexOf("</Name>", nameStart);
            if (nameEnd == -1)
            {
                context.Response.StatusCode = 404;
                context.Response.Write("{\"error\":\"Name end tag not found\"}");
                return;
            }
            
            string name = xmlText.Substring(nameStart + 6, nameEnd - nameStart - 6).Trim();
            name = HttpUtility.HtmlDecode(name);
            
            context.Response.StatusCode = 200;
            context.Response.Write("{\"id\":\"" + HttpUtility.JavaScriptStringEncode(id) + "\",\"name\":\"" + HttpUtility.JavaScriptStringEncode(name) + "\"}");
        }
        catch (WebException webEx)
        {
            string errorMsg = webEx.Message;
            if (webEx.Response != null)
            {
                try
                {
                    Stream errorStream = webEx.Response.GetResponseStream();
                    StreamReader errorReader = new StreamReader(errorStream);
                    errorMsg = errorReader.ReadToEnd();
                    errorReader.Close();
                    errorStream.Close();
                }
                catch
                {
                    // ignore
                }
            }
            context.Response.StatusCode = 502;
            context.Response.Write("{\"error\":\"Failed to fetch XML\",\"details\":\"" + HttpUtility.JavaScriptStringEncode(errorMsg) + "\"}");
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.Write("{\"error\":\"Internal server error\",\"details\":\"" + HttpUtility.JavaScriptStringEncode(ex.Message) + "\"}");
        }
    }

    public bool IsReusable
    {
        get { return true; }
    }
}
