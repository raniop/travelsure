<%@ WebHandler Language="C#" Class="BBQHandler" %>

using System;
using System.Web;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Text.RegularExpressions;

public class BBQHandler : IHttpHandler
{
    private string GetDataFolder(HttpContext context)
    {
        return context.Server.MapPath("~/data/bbq");
    }
    
    public void ProcessRequest(HttpContext context)
    {
        try
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

            string dataFolder = GetDataFolder(context);
            if (!Directory.Exists(dataFolder))
            {
                Directory.CreateDirectory(dataFolder);
            }

            string action = context.Request.QueryString["action"] ?? "";
            string entity = context.Request.QueryString["entity"] ?? "";

            switch (context.Request.HttpMethod)
            {
                case "GET":
                    HandleGet(context, entity, action, dataFolder);
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
                    WriteJsonSimple(context, "{\"error\":\"Method not allowed\"}");
                    break;
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json; charset=utf-8";
            string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
            string errorDetails = "{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\",\"type\":\"" + HttpUtility.JavaScriptStringEncode(ex.GetType().ToString()) + "\"}";
            context.Response.Write(errorDetails);
        }
    }

    private void HandleGet(HttpContext context, string entity, string action, string dataFolder)
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
                        context.Response.StatusCode = 404;
                }
                else
                {
                    string json = LoadAllJson("groups", dataFolder);
                    context.Response.Write(json);
                }
                break;

            case "members":
                string membersJson = LoadAllJson("members", dataFolder);
                if (!string.IsNullOrEmpty(groupId))
                {
                    // Filter by group_id manually
                    List<Dictionary<string, object>> members = ParseJsonArray(membersJson);
                    members = members.FindAll(m => m.ContainsKey("group_id") && m["group_id"] != null && m["group_id"].ToString() == groupId);
                    context.Response.Write(SerializeJsonArray(members));
                }
                else
                {
                    context.Response.Write(membersJson);
                }
                break;

            case "events":
                string eventsJson = LoadAllJson("events", dataFolder);
                List<Dictionary<string, object>> events = ParseJsonArray(eventsJson);
                if (!string.IsNullOrEmpty(groupId))
                    events = events.FindAll(e => e.ContainsKey("group_id") && e["group_id"] != null && e["group_id"].ToString() == groupId);
                if (!string.IsNullOrEmpty(id))
                    events = events.FindAll(e => e.ContainsKey("id") && e["id"] != null && e["id"].ToString() == id);
                context.Response.Write(SerializeJsonArray(events));
                break;

            case "attendees":
                string attendeesJson = LoadAllJson("attendees", dataFolder);
                List<Dictionary<string, object>> attendees = ParseJsonArray(attendeesJson);
                if (!string.IsNullOrEmpty(eventId))
                    attendees = attendees.FindAll(a => a.ContainsKey("event_id") && a["event_id"] != null && a["event_id"].ToString() == eventId);
                context.Response.Write(SerializeJsonArray(attendees));
                break;

            case "guests":
                string guestsJson = LoadAllJson("guests", dataFolder);
                List<Dictionary<string, object>> guests = ParseJsonArray(guestsJson);
                if (!string.IsNullOrEmpty(eventId))
                    guests = guests.FindAll(g => g.ContainsKey("event_id") && g["event_id"] != null && g["event_id"].ToString() == eventId);
                context.Response.Write(SerializeJsonArray(guests));
                break;

            case "payments":
                string paymentsJson = LoadAllJson("payments", dataFolder);
                List<Dictionary<string, object>> payments = ParseJsonArray(paymentsJson);
                if (!string.IsNullOrEmpty(eventId))
                    payments = payments.FindAll(p => p.ContainsKey("event_id") && p["event_id"] != null && p["event_id"].ToString() == eventId);
                context.Response.Write(SerializeJsonArray(payments));
                break;

            default:
                context.Response.StatusCode = 400;
                WriteJsonSimple(context, "{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandlePost(HttpContext context, string entity, string dataFolder)
    {
        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
        Dictionary<string, object> obj = ParseJsonObject(body);
        
        switch (entity.ToLower())
        {
            case "groups":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("groups", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "members":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                if (!obj.ContainsKey("is_active")) obj["is_active"] = true;
                SaveEntityJson("members", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "events":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("events", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "attendees":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                if (!obj.ContainsKey("attended")) obj["attended"] = true;
                SaveEntityJson("attendees", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "guests":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                if (!obj.ContainsKey("visit_count")) obj["visit_count"] = 1;
                SaveEntityJson("guests", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "payments":
                obj["id"] = Guid.NewGuid().ToString();
                obj["created_at"] = DateTime.UtcNow.ToString("o");
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                if (!obj.ContainsKey("payment_status") || obj["payment_status"] == null) obj["payment_status"] = "pending";
                SaveEntityJson("payments", obj["id"].ToString(), SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            default:
                context.Response.StatusCode = 400;
                WriteJsonSimple(context, "{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandlePut(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            WriteJsonSimple(context, "{\"error\":\"Missing id parameter\"}");
            return;
        }

        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
        Dictionary<string, object> obj = ParseJsonObject(body);
        
        switch (entity.ToLower())
        {
            case "groups":
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("groups", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "members":
                SaveEntityJson("members", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "events":
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("events", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "attendees":
                SaveEntityJson("attendees", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "guests":
                SaveEntityJson("guests", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            case "payments":
                obj["updated_at"] = DateTime.UtcNow.ToString("o");
                SaveEntityJson("payments", id, SerializeJsonObject(obj), dataFolder);
                context.Response.Write(SerializeJsonObject(obj));
                break;

            default:
                context.Response.StatusCode = 400;
                WriteJsonSimple(context, "{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandleDelete(HttpContext context, string entity, string dataFolder)
    {
        string id = context.Request.QueryString["id"] ?? "";
        if (string.IsNullOrEmpty(id))
        {
            context.Response.StatusCode = 400;
            WriteJsonSimple(context, "{\"error\":\"Missing id parameter\"}");
            return;
        }

        string filePath = Path.Combine(dataFolder, entity, id + ".json");
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            WriteJsonSimple(context, "{\"success\":true}");
        }
        else
        {
            context.Response.StatusCode = 404;
            WriteJsonSimple(context, "{\"error\":\"Not found\"}");
        }
    }

    // Simple JSON helpers - no external dependencies
    private void WriteJsonSimple(HttpContext context, string json)
    {
        context.Response.Write(json);
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

    // Simple JSON parsing (basic implementation)
    private Dictionary<string, object> ParseJsonObject(string json)
    {
        Dictionary<string, object> result = new Dictionary<string, object>();
        json = json.Trim();
        if (json.StartsWith("{") && json.EndsWith("}"))
        {
            json = json.Substring(1, json.Length - 2);
            string[] pairs = Regex.Split(json, @",(?=(?:[^""]*""[^""]*"")*[^""]*$)");
            foreach (string pair in pairs)
            {
                string[] kv = pair.Split(new char[] { ':' }, 2);
                if (kv.Length == 2)
                {
                    string key = kv[0].Trim().Trim('"');
                    string value = kv[1].Trim();
                    result[key] = ParseJsonValue(value);
                }
            }
        }
        return result;
    }

    private List<Dictionary<string, object>> ParseJsonArray(string json)
    {
        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>();
        json = json.Trim();
        if (json.StartsWith("[") && json.EndsWith("]"))
        {
            json = json.Substring(1, json.Length - 2);
            string[] items = Regex.Split(json, @"\},\s*\{");
            foreach (string item in items)
            {
                string itemJson = item;
                if (!itemJson.StartsWith("{")) itemJson = "{" + itemJson;
                if (!itemJson.EndsWith("}")) itemJson = itemJson + "}";
                result.Add(ParseJsonObject(itemJson));
            }
        }
        return result;
    }

    private object ParseJsonValue(string value)
    {
        value = value.Trim();
        if (value.StartsWith("\"") && value.EndsWith("\""))
            return value.Substring(1, value.Length - 2);
        if (value == "true") return true;
        if (value == "false") return false;
        if (value == "null") return null;
        if (value.Contains("."))
        {
            decimal d;
            if (decimal.TryParse(value, out d)) return d;
        }
        int i;
        if (int.TryParse(value, out i)) return i;
        return value;
    }

    private string SerializeJsonObject(Dictionary<string, object> obj)
    {
        StringBuilder sb = new StringBuilder();
        sb.Append("{");
        bool first = true;
        foreach (var kvp in obj)
        {
            if (!first) sb.Append(",");
            first = false;
            sb.Append("\"");
            sb.Append(HttpUtility.JavaScriptStringEncode(kvp.Key));
            sb.Append("\":");
            sb.Append(SerializeJsonValue(kvp.Value));
        }
        sb.Append("}");
        return sb.ToString();
    }

    private string SerializeJsonArray(List<Dictionary<string, object>> items)
    {
        StringBuilder sb = new StringBuilder();
        sb.Append("[");
        bool first = true;
        foreach (var item in items)
        {
            if (!first) sb.Append(",");
            first = false;
            sb.Append(SerializeJsonObject(item));
        }
        sb.Append("]");
        return sb.ToString();
    }

    private string SerializeJsonValue(object value)
    {
        if (value == null) return "null";
        if (value is string) return "\"" + HttpUtility.JavaScriptStringEncode(value.ToString()) + "\"";
        if (value is bool) return value.ToString().ToLower();
        if (value is int || value is decimal || value is double || value is float) return value.ToString();
        return "\"" + HttpUtility.JavaScriptStringEncode(value.ToString()) + "\"";
    }

    public bool IsReusable { get { return true; } }
}
