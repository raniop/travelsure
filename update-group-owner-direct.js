// Script to update group owner via API
// Run this in browser console on https://travsure.chatpilotapi.com/bbq

(async () => {
  try {
    const phone = "0524444244";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const userId = `user_${cleanPhone}`;
    
    console.log("Updating group owner to:", userId);
    
    // Get all groups
    const groupsResponse = await fetch('/api-bbq.ashx?entity=groups');
    const groups = await groupsResponse.json();
    
    console.log("Found groups:", groups);
    
    // Find the default group
    const targetGroup = groups.find(g => g.id === 'default-group-001') || groups[0];
    
    if (!targetGroup) {
      console.error("No group found!");
      return;
    }
    
    console.log("Updating group:", targetGroup);
    
    // Update the group with new owner_id
    const updatedGroup = {
      ...targetGroup,
      owner_id: userId,
      updated_at: new Date().toISOString()
    };
    
    console.log("Updated group:", updatedGroup);
    
    // Update via API
    const updateResponse = await fetch(`/api-bbq.ashx?entity=groups&id=${targetGroup.id}&action=update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedGroup)
    });
    
    const result = await updateResponse.json();
    console.log("Update result:", result);
    
    if (updateResponse.ok) {
      console.log("✅ Success! Group owner updated to:", userId);
      console.log("Please refresh the page and login again with phone:", phone);
    } else {
      console.error("❌ Error updating group:", result);
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
