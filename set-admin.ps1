# Script to set user as admin for BBQ group
# Usage: .\set-admin.ps1 -Phone "0524444244"

param(
    [Parameter(Mandatory=$true)]
    [string]$Phone
)

$cleanPhone = $Phone -replace '[^\d]', ''
$userId = "user_$cleanPhone"
$apiUrl = "http://travsure.chatpilotapi.com/api-bbq.ashx"

Write-Host "Setting user $userId as admin..." -ForegroundColor Cyan

# Get all groups
try {
    $groupsResponse = Invoke-RestMethod -Uri "$apiUrl?entity=groups" -Method Get
    $groups = $groupsResponse
    
    if ($groups -is [array] -and $groups.Count -gt 0) {
        # Find the first group (or default-group-001)
        $targetGroup = $groups | Where-Object { $_.id -eq "default-group-001" } | Select-Object -First 1
        if (-not $targetGroup) {
            $targetGroup = $groups[0]
        }
        
        Write-Host "Found group: $($targetGroup.id) - $($targetGroup.name)" -ForegroundColor Green
        
        # Update group with owner_id
        $updateData = @{
            id = $targetGroup.id
            name = $targetGroup.name
            description = $targetGroup.description
            owner_id = $userId
            created_at = $targetGroup.created_at
            updated_at = (Get-Date).ToUniversalTime().ToString("o")
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$apiUrl?entity=groups&id=$($targetGroup.id)&action=update" -Method Post -Body $updateData -ContentType "application/json"
        
        Write-Host "Success! User $userId is now the admin of group $($targetGroup.id)" -ForegroundColor Green
        Write-Host "Group updated: $($updateResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "No groups found. Creating a new group..." -ForegroundColor Yellow
        
        $newGroupData = @{
            name = "BBQ Group"
            description = "Weekly BBQ group"
            owner_id = $userId
        } | ConvertTo-Json
        
        $newGroup = Invoke-RestMethod -Uri "$apiUrl?entity=groups" -Method Post -Body $newGroupData -ContentType "application/json"
        
        Write-Host "Success! Created new group with user $userId as admin" -ForegroundColor Green
        Write-Host "New group: $($newGroup | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
