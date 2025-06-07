import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Loader,
  AlertCircle,
  Users
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

// Import API services - updated to match Attendance.tsx approach
import { presenceAPI, formateurAPI, groupeAPI, apprenantAPI, sessionAPI } from '../../api/apiService';

// Define types - aligned with Attendance.tsx
interface AttendanceRecord {
  id: number;
  date: string;
  statut: string;
  apprenantId: number;
  apprenantNom: string;
  groupeId: number;
  groupeName: string;
  sessionId?: number;
  sessionTitle?: string;
}

interface Groupe {
  id: number;
  name: string;
  capaciteMax?: number;
  formationId?: number;
  formationTitle?: string;
  trainerId?: number;
  trainerName?: string;
  learnerCount?: number;
}

interface AttendanceSummary {
  totalRecords: number;
  present: number;
  absent: number;
  presentRate: number;
}

interface GroupedAttendance {
  date: string;
  groupId: number;
  groupName: string;
  formateurId?: number;
  formateurName?: string;
  sessionId?: number;
  sessionTitle?: string;
  records: AttendanceRecord[];
}

interface Learner {
  id: number;
  nom: string;
  prenom: string;
}

const AttendanceHistory: React.FC = () => {
  const { user } = useAuth();
  
  // State for data
  const [groups, setGroups] = useState<Groupe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  
  // State for attendance data - updated to match Attendance.tsx approach
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedAttendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [selectedLearner, setSelectedLearner] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  
  // Fetch summary data - aligned with Attendance.tsx approach
  const fetchSummary = async () => {
    try {
      // Create a default summary if API endpoint doesn't exist
      const defaultSummary = {
        totalRecords: filteredData.length,
        present: filteredData.filter(record => record.statut === 'PRESENT').length,
        absent: filteredData.filter(record => record.statut === 'ABSENT').length,
        presentRate: filteredData.length > 0 
          ? (filteredData.filter(record => record.statut === 'PRESENT').length / filteredData.length) * 100 
          : 0
      };
      
      try {
        // Try to get from API first
        const responseSummary = await presenceAPI.getSummary();
        if (responseSummary.data) {
          setSummary(responseSummary.data);
        } else {
          setSummary(defaultSummary);
        }
      } catch (err) {
        console.log('Using calculated summary instead:', defaultSummary);
        setSummary(defaultSummary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };
  
  // Fetch all necessary data - using the approach from Attendance.tsx
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch attendance data using our API service - similar to Attendance.tsx
        let attendanceResult: AttendanceRecord[] = [];
        try {
          // First try to get all presence data by trainer ID
          const responseAttendance = await presenceAPI.getByFormateur(user.id.toString());
          
          // Handle both direct array and paginated response structures
          if (Array.isArray(responseAttendance.data)) {
            attendanceResult = responseAttendance.data;
          } else if (responseAttendance.data && responseAttendance.data._embedded && Array.isArray(responseAttendance.data._embedded.presences)) {
            attendanceResult = responseAttendance.data._embedded.presences;
          } else {
            console.warn('Expected array or _embedded.presences in attendance data but got:', responseAttendance.data);
            
            // Fallback to regular getAll if getByFormateur doesn't exist or fails
            const allPresenceResponse = await presenceAPI.getAll();
            if (Array.isArray(allPresenceResponse.data)) {
              attendanceResult = allPresenceResponse.data;
            } else if (allPresenceResponse.data && allPresenceResponse.data._embedded && Array.isArray(allPresenceResponse.data._embedded.presences)) {
              attendanceResult = allPresenceResponse.data._embedded.presences;
            } else {
              console.warn('Fallback also failed, using empty array for attendance data');
              attendanceResult = [];
            }
          }
        } catch (err) {
          console.error('Error fetching attendance data:', err);
          // Try to get sessions and their attendance as a fallback
          try {
            // Get trainer's sessions
            const responseTrainerSessions = await sessionAPI.getByFormateur(user.id.toString());
            
            if (responseTrainerSessions.data && responseTrainerSessions.data.length > 0) {
              setSessions(responseTrainerSessions.data);
              
              // Fetch attendance data for each session
              for (const session of responseTrainerSessions.data) {
                try {
                  const attendanceResponse = await sessionAPI.getAttendance(session.id.toString());
                  
                  if (attendanceResponse.data && attendanceResponse.data.length > 0) {
                    // Process the attendance records
                    const sessionAttendance = attendanceResponse.data.map((record: any) => ({
                      id: record.id,
                      date: session.date,
                      statut: record.statut,
                      apprenantId: record.apprenantId,
                      apprenantNom: record.apprenantNom || `${record.apprenant?.nom || ''} ${record.apprenant?.prenom || ''}`,
                      groupeId: session.groupeId,
                      groupeName: '',  // Will be filled in later
                      sessionId: session.id,
                      sessionTitle: session.title
                    }));
                    
                    attendanceResult = [...attendanceResult, ...sessionAttendance];
                  }
                } catch (sessionErr) {
                  console.error(`Error fetching attendance for session ${session.id}:`, sessionErr);
                }
              }
            }
          } catch (sessionsErr) {
            console.error('Error fetching sessions:', sessionsErr);
          }
        }
        
        setAttendanceData(attendanceResult);
        setFilteredData(attendanceResult);
        
        // Fetch trainer's groups
        try {
          const responseGroups = await groupeAPI.getByFormateur(user.id.toString());
          
          if (responseGroups.data && responseGroups.data.length > 0) {
            setGroups(responseGroups.data);
            
            // Update attendance records with group names
            const enhancedAttendance = attendanceResult.map(record => {
              const group = responseGroups.data.find(g => g.id === record.groupeId);
              return {
                ...record,
                groupeName: group?.name || 'Unknown Group'
              };
            });
            
            setAttendanceData(enhancedAttendance);
            setFilteredData(enhancedAttendance);
          } else {
            // Try regular getAll if getByFormateur doesn't exist or returns empty
            const allGroupsResponse = await groupeAPI.getAll();
            let groupsData = [];
            
            if (Array.isArray(allGroupsResponse.data)) {
              groupsData = allGroupsResponse.data;
            } else if (allGroupsResponse.data && allGroupsResponse.data._embedded && Array.isArray(allGroupsResponse.data._embedded.groupes)) {
              groupsData = allGroupsResponse.data._embedded.groupes;
            }
            
            setGroups(groupsData);
            
            // Update attendance records with group names
            const enhancedAttendance = attendanceResult.map(record => {
              const group = groupsData.find(g => g.id === record.groupeId);
              return {
                ...record,
                groupeName: group?.name || 'Unknown Group'
              };
            });
            
            setAttendanceData(enhancedAttendance);
            setFilteredData(enhancedAttendance);
          }
        } catch (groupsErr) {
          console.error('Error fetching groups:', groupsErr);
        }
        
        // Fetch learners
        try {
          const responseLearners = await apprenantAPI.getAll();
          let learnersData = [];
          
          // Handle both direct array and paginated response structures
          if (Array.isArray(responseLearners.data)) {
            learnersData = responseLearners.data;
          } else if (responseLearners.data && responseLearners.data._embedded && Array.isArray(responseLearners.data._embedded.apprenants)) {
            learnersData = responseLearners.data._embedded.apprenants;
          } else {
            console.warn('Expected array or _embedded.apprenants in learners data but got:', responseLearners.data);
            setLearners([]);
          }
          
          const formattedLearners = learnersData.map(learner => ({
            id: learner.id,
            nom: learner.nom,
            prenom: learner.prenom
          }));
          setLearners(formattedLearners);
        } catch (learnersErr) {
          console.error('Error fetching learners data:', learnersErr);
        }
        
        // Fetch or calculate summary
        await fetchSummary();
        
      } catch (err) {
        setError('Failed to load attendance data');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Group attendance data for grouped view - aligned with Attendance.tsx approach
  useEffect(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      setGroupedData([]);
      return;
    }
    
    const grouped: { [key: string]: GroupedAttendance } = {};
    
    filteredData.forEach(record => {
      const groupInfo = groups.find(g => g.id === record.groupeId);
      const formateurName = user?.name || 'Unknown';
      const formateurId = user?.id || null;
      const groupName = record.groupeName || groupInfo?.name || 'Unknown Group';
      const formattedDate = new Date(record.date).toISOString().split('T')[0];
      
      // Create a unique key that includes session info if available
      const key = record.sessionId 
        ? `${formateurId || 'none'}-${record.groupeId}-${formattedDate}-${record.sessionId}`
        : `${formateurId || 'none'}-${record.groupeId}-${formattedDate}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date: formattedDate,
          groupId: record.groupeId,
          groupName: groupName,
          formateurId: formateurId,
          formateurName: formateurName,
          sessionId: record.sessionId,
          sessionTitle: record.sessionTitle,
          records: [record]
        };
      } else {
        grouped[key].records.push(record);
      }
    });
    
    setGroupedData(Object.values(grouped));
  }, [filteredData, groups, user]);
  
  // Update summary whenever filtered data changes
  useEffect(() => {
    if (filteredData.length > 0) {
      const calculatedSummary = {
        totalRecords: filteredData.length,
        present: filteredData.filter(record => record.statut === 'PRESENT').length,
        absent: filteredData.filter(record => record.statut === 'ABSENT').length,
        presentRate: filteredData.length > 0 
          ? (filteredData.filter(record => record.statut === 'PRESENT').length / filteredData.length) * 100 
          : 0
      };
      setSummary(calculatedSummary);
    }
  }, [filteredData]);
  
  // Apply filters - unified with Attendance.tsx approach
  const applyFilters = async () => {
    try {
      setIsLoading(true);
      
      let filtered = [...attendanceData];
      
      // Apply filters on the client side
      if (selectedDate) {
        const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
        filtered = filtered.filter(record => 
          new Date(record.date).toISOString().split('T')[0] === formattedDate);
      }
      
      if (selectedLearner) {
        filtered = filtered.filter(record => 
          record.apprenantId === Number(selectedLearner));
      }
      
      if (selectedGroup) {
        filtered = filtered.filter(record => 
          record.groupeId === Number(selectedGroup));
      }
      
      // Apply search query to learner names
      if (searchQuery) {
        filtered = filtered.filter(record => 
          record.apprenantNom?.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      setFilteredData(filtered);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to apply filters');
      setIsLoading(false);
      console.error('Error applying filters:', err);
    }
  };
  
  // Effect to apply filters
  useEffect(() => {
    if (attendanceData.length > 0) {
      applyFilters();
    }
  }, [selectedDate, selectedLearner, selectedGroup, searchQuery, attendanceData]);
  
  // Handle filter changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const handleLearnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLearner(e.target.value ? Number(e.target.value) : '');
  };
  
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value ? Number(e.target.value) : '');
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMode(e.target.value as 'list' | 'grouped');
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedDate('');
    setSelectedLearner('');
    setSelectedGroup('');
    setSearchQuery('');
  };
  
  // Render attendance list view
  const renderAttendanceList = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
              {sessions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((record, index) => (
              <tr key={record.id || index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.groupeName}
                </td>
                {sessions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.sessionTitle || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.apprenantNom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.statut === 'PRESENT' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render grouped attendance view - matched with Attendance.tsx style
  const renderGroupedAttendance = () => {
    return (
      <div className="space-y-8">
        {groupedData.map((group, index) => (
          <Card key={index}>
            <div className="p-4">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {group.sessionTitle && (
                      <span className="text-blue-600 mr-2">{group.sessionTitle}</span>
                    )}
                    <span className="ml-2">{group.groupName}</span>
                  </h3>
                  <p className="text-sm text-gray-500">Date: {new Date(group.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Users size={16} className="mr-1" />
                    {group.records.length} Learners
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Present: {group.records.filter(r => r.statut === 'PRESENT').length}
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Absent: {group.records.filter(r => r.statut === 'ABSENT').length}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.records.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.apprenantNom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.statut === 'PRESENT' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attendance History</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin h-8 w-8 text-primary-600" />
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards - matched with Attendance.tsx */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4 bg-blue-50 h-full">
                  <h3 className="text-lg font-medium text-blue-700">Total Records</h3>
                  <p className="text-3xl font-bold mt-2">{summary.totalRecords}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 bg-green-50 h-full">
                  <h3 className="text-lg font-medium text-green-700">Present</h3>
                  <p className="text-3xl font-bold mt-2">{summary.present}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 bg-red-50 h-full">
                  <h3 className="text-lg font-medium text-red-700">Absent</h3>
                  <p className="text-3xl font-bold mt-2">{summary.absent}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 bg-purple-50 h-full">
                  <h3 className="text-lg font-medium text-purple-700">Present Rate</h3>
                  <p className="text-3xl font-bold mt-2">{summary.presentRate?.toFixed(1) || '0.0'}%</p>
                </div>
              </Card>
            </div>
          )}
          
          {/* Filters - aligned with Attendance.tsx */}
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">Filter Attendance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={selectedGroup}
                    onChange={handleGroupChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Groups</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learner</label>
                  <select
                    value={selectedLearner}
                    onChange={handleLearnerChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Learners</option>
                    {Array.isArray(learners) && learners.map(learner => (
                      <option key={learner.id} value={learner.id}>{`${learner.nom} ${learner.prenom || ''}`}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Learner</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
                  <select
                    value={viewMode}
                    onChange={handleViewModeChange}
                    className="w-full sm:w-48 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="list">List View</option>
                    <option value="grouped">Grouped View</option>
                  </select>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </Card>
          
          {/* Results - matched with Attendance.tsx */}
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">Attendance Records</h2>
              
              {viewMode === 'list' ? (
                filteredData.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No attendance records found for the selected filters.
                  </div>
                ) : (
                  renderAttendanceList()
                )
              ) : (
                groupedData.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No attendance records found for the selected filters.
                  </div>
                ) : (
                  renderGroupedAttendance()
                )
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceHistory;