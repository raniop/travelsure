<%@ WebHandler Language="C#" Class="BBQHandler" %>

using System;
using System.Web;
using System.IO;
using System.Text;

public class BBQHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.AppendHeader("Access-Control-Allow-Origin", "*");
        context.Response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        context.Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type");

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }

        try
        {
            string dataFolder = context.Server.MapPath("~/data/bbq");
            if (!Directory.Exists(dataFolder))
            {
                Directory.CreateDirectory(dataFolder);
            }

            string entity = context.Request.QueryString["entity"] ?? "";

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
                    context.Response.Write("{\"error\":\"Method not allowed\"}");
                    break;
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
            string errorDetails = "{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\"}";
            context.Response.Write(errorDetails);
        }
    }

    private void HandleGet(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        string groupId = context.Request.QueryString["group_id"] ?? "";
        string eventId = context.Request.QueryString["event_id"] ?? "";

        switch (entity.ToLower())
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
                    context.Response.Write(json);
                }
                break;

            default:
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandlePost(HttpContext context, string entity, string dataFolder)
    {
        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
        
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

            default:
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandlePut(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }

        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
        
        switch (entity.ToLower())
        {
            case "groups":
                string updatedAt = DateTime.UtcNow.ToString("o");
                string json = body;
                // Add updated_at if not present
                if (!json.Contains("\"updated_at\""))
                {
                    json = json.Trim();
                    if (json.StartsWith("{") && json.EndsWith("}"))
                    {
                        json = json.Substring(1, json.Length - 2);
                        json = json + ",\"updated_at\":\"" + updatedAt + "\"}";
                        if (!json.StartsWith("{")) json = "{" + json;
                    }
                }
                
                SaveEntityJson("groups", id, json, dataFolder);
                context.Response.Write(json);
                break;

            default:
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandleDelete(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
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
                items.Add(File.ReadAllText(file, Encoding.UTF8));
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
