// src/pages/president/SessionManagement.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupeAPI, sessionAPI } from '../../api/apiService';

interface Groupe {
  id: number;
  name?: string;     // Updated to handle different API responses
  nom?: string;      // Some APIs use 'nom' instead of 'name'
  formateurId?: number;
  trainer?: {
    id: number;
    name: string;
  };
}

interface Session {
  id?: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  groupeId?: number;     // Some APIs use groupeId directly
  groupe?: {            // Some APIs nest it under groupe
    id: number;
  };
  formateurId?: number;
  formateur?: {         // Some APIs nest it under formateur
    id: number;
    name?: string;
  };
}

const SessionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Groupe[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // New session form data
  const [sessionForm, setSessionForm] = useState<Session>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startTime: '09:00',
    endTime: '12:00',
    status: 'PLANNED',
    groupeId: 0 // Changed from groupe.id to groupeId
  });

  // Check authentication on mount
  useEffect(() => {
    const sessionData = localStorage.getItem('tweadup_president');
    if (!sessionData) {
      navigate('/president');
    }
  }, [navigate]);

  // Fetch groups and sessions on mount
  useEffect(() => {
    fetchGroups();
    fetchSessions();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Try direct fetch with the correct endpoint (groupes, not groups)
      try {
        const response = await fetch('http://localhost:8080/api/groupes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tweadup_president') ? 
              JSON.parse(localStorage.getItem('tweadup_president') || '{}').token : ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Groups fetched successfully:', data);
        
        // Handle various response formats
        let groupData: Groupe[] = [];
        if (Array.isArray(data)) {
          groupData = data;
        } else if (data && data._embedded && Array.isArray(data._embedded.groupes)) {
          groupData = data._embedded.groupes;
        } else if (data && data.content && Array.isArray(data.content)) {
          groupData = data.content;
        }
        
        setGroups(groupData);
        
        // Set the first group as default if available
        if (groupData.length > 0) {
          setSessionForm(prev => ({
            ...prev,
            groupeId: groupData[0].id
          }));
        }
        return;
      } catch (directError) {
        console.error('Direct group fetch failed, trying groupeAPI service:', directError);
      }
      
      // Fallback to using the API service
      const response = await groupeAPI.getAll();
      
      let groupData: Groupe[] = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        groupData = response.data;
      } else if (response.data && response.data._embedded && Array.isArray(response.data._embedded.groupes)) {
        groupData = response.data._embedded.groupes;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        groupData = response.data.content;
      }
      
      setGroups(groupData);
      
      // Set the first group as default if available
      if (groupData.length > 0) {
        setSessionForm(prev => ({
          ...prev,
          groupeId: groupData[0].id
        }));
      }
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(`Failed to load groups: ${err.response?.data?.message || err.message}`);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
  try {
    // Try several approaches to get sessions
    let sessionData: Session[] = [];
    let fetchSuccessful = false;
    
    // Try 1: Direct fetch with search endpoint
    try {
      const response = await fetch('http://localhost:8080/api/sessions/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tweadup_president') ? 
            JSON.parse(localStorage.getItem('tweadup_president') || '{}').token : ''}`
        },
        body: JSON.stringify({}) // Empty search criteria to get all sessions
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Sessions fetched successfully via search:', data);
      
      // Handle various response formats
      if (Array.isArray(data)) {
        sessionData = data;
      } else if (data && data._embedded && Array.isArray(data._embedded.sessions)) {
        sessionData = data._embedded.sessions;
      } else if (data && data.content && Array.isArray(data.content)) {
        sessionData = data.content;
      }
      
      fetchSuccessful = true;
    } catch (searchError) {
      console.error('Search endpoint fetch failed:', searchError);
    }
    
    // Try 2: Direct GET if search failed
    if (!fetchSuccessful) {
      try {
        const response = await fetch('http://localhost:8080/api/sessions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tweadup_president') ? 
              JSON.parse(localStorage.getItem('tweadup_president') || '{}').token : ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Sessions fetched successfully via GET:', data);
        
        // Handle various response formats
        if (Array.isArray(data)) {
          sessionData = data;
        } else if (data && data._embedded && Array.isArray(data._embedded.sessions)) {
          sessionData = data._embedded.sessions;
        } else if (data && data.content && Array.isArray(data.content)) {
          sessionData = data.content;
        }
        
        fetchSuccessful = true;
      } catch (getError) {
        console.error('GET sessions fetch failed:', getError);
      }
    }
    
    // Try 3: Use API service as last resort
    if (!fetchSuccessful) {
      try {
        const response = await sessionAPI.getAll();
        console.log('Sessions fetched via API service:', response);
        
        if (Array.isArray(response.data)) {
          sessionData = response.data;
        } else if (response.data && response.data._embedded && Array.isArray(response.data._embedded.sessions)) {
          sessionData = response.data._embedded.sessions;
        } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
          sessionData = response.data.content;
        }
        
        fetchSuccessful = true;
      } catch (apiError) {
        console.error('API service sessions fetch failed:', apiError);
      }
    }
    
    // If all approaches failed, use mock data to prevent UI blocking
    if (!fetchSuccessful) {
      console.warn('All session fetch approaches failed, using any previously fetched data or empty array');
      // Keep any previously fetched sessions or use empty array
      if (sessions.length === 0) {
        sessionData = [];
      } else {
        return; // Keep current sessions if we had some already
      }
    }
    
    setSessions(sessionData);
  } catch (err: any) {
    console.error('Error fetching sessions:', err);
    // Don't show error for sessions, just log it
    setSessions([]);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'groupeId') {
      setSessionForm(prev => ({
        ...prev,
        groupeId: parseInt(value)
      }));
    } else {
      setSessionForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!sessionForm.title.trim()) {
      setError('Session title is required');
      return false;
    }
    
    if (!sessionForm.date) {
      setError('Date is required');
      return false;
    }
    
    if (!sessionForm.startTime) {
      setError('Start time is required');
      return false;
    }
    
    if (!sessionForm.endTime) {
      setError('End time is required');
      return false;
    }
    
    if (!sessionForm.groupeId) {
      setError('Please select a group');
      return false;
    }
    
    return true;
  };

  // Update the handleSubmit function in SessionManagement.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccessMessage(null);
  
  if (!validateForm()) {
    return;
  }
  
  try {
    setLoading(true);
    
    // Format the session data according to what the API expects
    const sessionData = {
      title: sessionForm.title,
      description: sessionForm.description,
      date: sessionForm.date,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      formateurId: 0, // This will be assigned by backend based on group
      groupeId: sessionForm.groupeId,
      status: 'PLANNED'
    };
    
    console.log('Submitting session data:', sessionData);
    
    // Use the improved sessionAPI.create method which has multiple fallback mechanisms
    const response = await sessionAPI.create(sessionData as any);
    console.log('Session created successfully:', response.data);
    
    setSuccessMessage(`Session "${sessionForm.title}" created successfully!`);
    
    // Reset form
    setSessionForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
      status: 'PLANNED',
      groupeId: sessionForm.groupeId // Keep the same group selected
    });
    
    // Refresh sessions list
    fetchSessions();
    
  } catch (err: any) {
    console.error('Error creating session:', err);
    setError(`Failed to create session: ${err.response?.data?.message || err.message}`);
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Find group name by ID - handling different API response formats
  const getGroupName = (groupId: number | undefined) => {
    if (!groupId) return 'Unknown Group';
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return 'Unknown Group';
    
    // Handle different API responses that might use 'name' or 'nom'
    return group.name || group.nom || 'Unnamed Group';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold mb-6">Training Session Management</h2>
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r">
          <p>{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Session Creation Form */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Create New Session</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Session Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={sessionForm.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to React"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={sessionForm.description}
                onChange={handleInputChange}
                placeholder="Brief description of the session content"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={sessionForm.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="groupeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Group*
                </label>
                <select
                  id="groupeId"
                  name="groupeId"
                  value={sessionForm.groupeId || 0}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={0} disabled>Select a group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.formateurId ? `(ID: ${group.formateurId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time*
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={sessionForm.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time*
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={sessionForm.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Upcoming Sessions List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
          
          {sessions.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
              No sessions scheduled yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sessions
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date
                .map(session => {
                  // Handle both groupeId directly or nested under groupe
                  const groupId = session.groupeId || (session.groupe ? session.groupe.id : undefined);
                  
                  return (
                    <li key={session.id} className="py-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                          <h4 className="font-medium text-blue-800">{session.title}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.date)} • {session.startTime} - {session.endTime}
                          </p>
                          <p className="text-sm text-gray-700">
                            Group: {getGroupName(groupId)}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                      {session.description && (
                        <p className="mt-1 text-sm text-gray-600">{session.description}</p>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManagement;