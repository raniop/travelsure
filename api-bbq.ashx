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
                string errorStack = HttpUtility.JavaScriptStringEncode(ex.StackTrace ?? "");
                string errorDetails = "{\"error\":\"Internal server error\",\"details\":\"" + errorMsg + "\",\"type\":\"" + errorType + "\",\"stack\":\"" + errorStack + "\"}";
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
