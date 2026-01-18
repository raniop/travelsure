# Set owner for BBQ group
$apiUrl = "https://ophir.travelsure.co.il/api-bbq.ashx"
$userId = "user_0524444244"

Write-Host "Getting groups..." -ForegroundColor Cyan

try {
    # Get all groups
    $groupsResponse = Invoke-RestMethod -Uri "$apiUrl?entity=groups" -Method Get
    $groups = $groupsResponse
    
    if ($groups -is [array] -and $groups.Count -gt 0) {
        # Find default-group-001 or first group
        $targetGroup = $groups | Where-Object { $_.id -eq "default-group-001" } | Select-Object -First 1
        if (-not $targetGroup) {
            $targetGroup = $groups[0]
        }
        
        Write-Host "Found group: $($targetGroup.id) - $($targetGroup.name)" -ForegroundColor Green
        Write-Host "Current owner_id: $($targetGroup.owner_id)" -ForegroundColor Yellow
        
        # Update group with owner_id
        $updateData = @{
            id = $targetGroup.id
            name = $targetGroup.name
            description = if ($targetGroup.description) { $targetGroup.description } else { "" }
            owner_id = $userId
            created_at = $targetGroup.created_at
            updated_at = (Get-Date).ToUniversalTime().ToString("o")
        }
        
        Write-Host "Updating group..." -ForegroundColor Cyan
        
        $updateResponse = Invoke-RestMethod -Uri "$apiUrl?entity=groups&id=$($targetGroup.id)&action=update" -Method Post -Body ($updateData | ConvertTo-Json) -ContentType "application/json"
        
        Write-Host "Success! User $userId is now the admin" -ForegroundColor Green
        Write-Host "Updated group owner_id: $($updateResponse.owner_id)" -ForegroundColor Green
    } else {
        Write-Host "No groups found" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
