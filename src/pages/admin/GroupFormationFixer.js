// GroupFormationFixer.js
// Use this utility to fix missing formation IDs in your database

/**
 * This utility helps fix groups with missing formation IDs.
 * It can be run directly in the browser console or integrated into your admin panel.
 * 
 * HOW TO USE IN CONSOLE:
 * 1. Open your browser console on the Groups page
 * 2. Copy and paste this entire file
 * 3. Run: await fixGroupFormation(5, 1) - to set Group ID 5 to use Formation ID 1
 */

// Get auth token from localStorage or any other storage mechanism
const getAuthToken = () => {
    // Replace with your actual method of getting auth token
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    return auth.token || '';
  };
  
  // Base API URL - replace with your actual API URL
  const getApiUrl = () => {
    // You might want to get this from your environment or configuration
    return process.env.REACT_APP_API_URL || 'https://f06d-197-146-109-130.ngrok-free.app ';
  };
  
  // Function to fix a group's formation ID
  const fixGroupFormation = async (groupId, formationId) => {
    if (!groupId || !formationId) {
      console.error('Both groupId and formationId are required');
      return false;
    }
    
    try {
      // First, fetch the current group to get all its properties
      const response = await fetch(`${getApiUrl()}/groupes/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch group ${groupId}:`, response.statusText);
        return false;
      }
      
      const group = await response.json();
      console.log(`Current group data:`, group);
      
      // Update the group with the new formation ID
      const updateResponse = await fetch(`${getApiUrl()}/groupes/${groupId}`, {
        method: 'PUT',  // Or PATCH depending on your API
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...group,
          formationId: formationId
        })
      });
      
      if (!updateResponse.ok) {
        console.error(`Failed to update group ${groupId}:`, updateResponse.statusText);
        return false;
      }
      
      console.log(`Group ${groupId} successfully updated with formationId ${formationId}`);
      return true;
      
    } catch (error) {
      console.error('Error fixing group formation:', error);
      return false;
    }
  };
  
  // Function to find all groups without formation IDs
  const findGroupsWithoutFormation = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/groupes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch groups:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      // Extract groups from the response based on your API structure
      let groups = [];
      if (data._embedded?.groupes) {
        groups = data._embedded.groupes;
      } else if (Array.isArray(data)) {
        groups = data;
      } else if (data) {
        groups = [data];
      }
      
      // Filter groups without formation IDs
      const groupsWithoutFormation = groups.filter(group => {
        // Check common places where formation ID might be stored
        return (
          (!group.formationId || group.formationId === null || isNaN(Number(group.formationId))) && 
          (!group.formation?.id || group.formation.id === null || isNaN(Number(group.formation.id)))
        );
      });
      
      console.log('Groups without formation IDs:', groupsWithoutFormation);
      return groupsWithoutFormation;
      
    } catch (error) {
      console.error('Error finding groups without formation:', error);
      return [];
    }
  };
  
  // Function to fix all groups without formation IDs
  const fixAllGroupsWithoutFormation = async (defaultFormationId) => {
    if (!defaultFormationId) {
      console.error('defaultFormationId is required');
      return;
    }
    
    try {
      const groupsWithoutFormation = await findGroupsWithoutFormation();
      
      if (groupsWithoutFormation.length === 0) {
        console.log('No groups found without formation IDs');
        return;
      }
      
      console.log(`Found ${groupsWithoutFormation.length} groups without formation IDs`);
      
      // Confirm before proceeding
      if (!confirm(`This will update ${groupsWithoutFormation.length} groups to use formation ID ${defaultFormationId}. Continue?`)) {
        console.log('Operation cancelled');
        return;
      }
      
      // Process each group
      let successCount = 0;
      let failCount = 0;
      
      for (const group of groupsWithoutFormation) {
        const groupId = group.id || 
          (group._links?.self?.href ? parseInt(group._links.self.href.split('/').pop()) : null);
        
        if (!groupId) {
          console.error('Could not determine group ID for:', group);
          failCount++;
          continue;
        }
        
        const success = await fixGroupFormation(groupId, defaultFormationId);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      console.log(`Fix completed: ${successCount} groups updated successfully, ${failCount} failed`);
      
    } catch (error) {
      console.error('Error fixing all groups:', error);
    }
  };
  
  // Export the functions for use in the browser console or elsewhere
  window.fixGroupFormation = fixGroupFormation;
  window.findGroupsWithoutFormation = findGroupsWithoutFormation;
  window.fixAllGroupsWithoutFormation = fixAllGroupsWithoutFormation;
  
  console.log('Group Formation Fixer utility loaded. Available commands:');
  console.log('- findGroupsWithoutFormation() - Find all groups without formation IDs');
  console.log('- fixGroupFormation(groupId, formationId) - Fix a specific group');
  console.log('- fixAllGroupsWithoutFormation(defaultFormationId) - Fix all groups without formation IDs');