// Run this in browser console on https://ophir.travelsure.co.il/bbq

(async function() {
  const apiUrl = 'https://ophir.travelsure.co.il/api-bbq.ashx';
  const userId = 'user_0524444244';
  
  try {
    // Get all groups
    const groupsResponse = await fetch(`${apiUrl}?entity=groups`);
    const groups = await groupsResponse.json();
    
    console.log('Groups:', groups);
    
    if (!groups || groups.length === 0) {
      console.error('No groups found');
      return;
    }
    
    // Find default-group-001 or first group
    let targetGroup = groups.find(g => g.id === 'default-group-001');
    if (!targetGroup) {
      targetGroup = groups[0];
    }
    
    console.log('Target group:', targetGroup);
    console.log('Current owner_id:', targetGroup.owner_id);
    
    // Update group with owner_id
    const updateData = {
      id: targetGroup.id,
      name: targetGroup.name,
      description: targetGroup.description || '',
      owner_id: userId,
      created_at: targetGroup.created_at,
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating with:', updateData);
    
    const updateResponse = await fetch(
      `${apiUrl}?entity=groups&id=${targetGroup.id}&action=update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );
    
    const result = await updateResponse.json();
    console.log('Update result:', result);
    console.log('New owner_id:', result.owner_id);
    
    alert('עודכן! רענן את הדף (Ctrl+F5)');
  } catch (error) {
    console.error('Error:', error);
    alert('שגיאה: ' + error.message);
  }
})();
