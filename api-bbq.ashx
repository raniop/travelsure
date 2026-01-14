<%@ WebHandler Language="C#" Class="BBQHandler" %>

using System;
using System.Web;
using System.IO;
using System.Text;
using System.Collections.Generic;

public class BBQHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Charset = "utf-8";
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

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
                            context.Response.Write("{\"error\":\"Method not allowed\"}");
                            break;
                    }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            string errorMsg = HttpUtility.JavaScriptStringEncode(ex.Message);
            string errorType = HttpUtility.JavaScriptStringEncode(ex.GetType().ToString());
            string errorStack = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
            string errorDetails = "{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\",\"type\":\"" + errorType + "\",\"stack\":\"" + errorStack + "\"}";
            context.Response.Write(errorDetails);
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
        entity = entity.ToLower();
        
        // If entity is still empty, return error
        if (string.IsNullOrEmpty(entity))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Missing entity parameter\"}");
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

            default:
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\":\"Invalid entity\"}");
                break;
        }
    }

    private void HandlePost(HttpContext context, string entity, string dataFolder)
    {
        string body = new StreamReader(context.Request.InputStream).ReadToEnd();
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
            context.Response.Write("{\"error\":\"Missing id parameter\"}");
            return;
        }
        
        // Debug: log the entity and id
        if (string.IsNullOrEmpty(entity))
        {
            context.Response.StatusCode = 400;
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

            case "attendees":
                string attendeeJson = body;
                if (string.IsNullOrEmpty(attendeeJson))
                {
                    context.Response.StatusCode = 400;
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

            default:
                context.Response.StatusCode = 400;
                string originalEntity = context.Request.QueryString["entity"] ?? "";
                string errorMsg = "{\"error\":\"Invalid entity\",\"entity\":\"" + HttpUtility.JavaScriptStringEncode(entity ?? "") + "\",\"originalEntity\":\"" + HttpUtility.JavaScriptStringEncode(originalEntity) + "\",\"id\":\"" + HttpUtility.JavaScriptStringEncode(id ?? "") + "\",\"queryString\":\"" + HttpUtility.JavaScriptStringEncode(context.Request.QueryString.ToString()) + "\"}";
                context.Response.Write(errorMsg);
                break;
        }
    }

    private void HandlePaymentWebhook(HttpContext context, string dataFolder)
    {
        // Webhook endpoint for PayBox payment notifications
        // PayBox will call this URL when a payment is completed
        // Expected parameters: payment_id (from query string), status (from POST body)
        
        string paymentId = context.Request.QueryString["payment_id"] ?? "";
        if (string.IsNullOrEmpty(paymentId))
        {
            context.Response.StatusCode = 400;
            context.Response.Write("{\"error\":\"Missing payment_id parameter\"}");
            return;
        }

        try
        {
            // Read webhook data from PayBox (usually in POST body)
            string body = new StreamReader(context.Request.InputStream).ReadToEnd();
            
            // Try to parse PayBox webhook data
            // PayBox typically sends: {"status": "paid", "payment_id": "...", "amount": ...}
            // For now, we'll mark as paid if webhook is called (PayBox only calls on success)
            string existingPaymentJson = LoadEntityJson("payments", paymentId, dataFolder);
            if (string.IsNullOrEmpty(existingPaymentJson))
            {
                context.Response.StatusCode = 404;
                context.Response.Write("{\"error\":\"Payment not found\"}");
                return;
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
