import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { presenceAPI, formateurAPI, groupeAPI, apprenantAPI } from '../../api/apiService';
import { format } from 'date-fns';

// Types
interface Attendance {
  id: number;
  date: string;
  statut: string;
  apprenantId: number;
  apprenantNom: string;
  groupeId: number;
  groupeName: string;
}

interface Learner {
  id: number;
  nom: string;
  prenom: string;
}

interface Group {
  id: number;
  name: string;
  trainerId?: number;
  trainerName?: string;
}

interface Trainer {
  id: number;
  nom: string;
  prenom: string;
}

interface AttendanceSummary {
  totalRecords: number;
  present: number;
  absent: number;
  presentRate: number;
}

interface GroupedAttendance {
  trainer: string | null;
  trainerId: number | null;
  group: string;
  groupId: number;
  date: string;
  records: Attendance[];
}

const Attendance: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [filteredData, setFilteredData] = useState<Attendance[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [learners, setLearners] = useState<Learner[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLearner, setSelectedLearner] = useState<number | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  // Fetch summary data
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch attendance data using our API service
        let attendanceResult: Attendance[] = [];
        try {
          const responseAttendance = await presenceAPI.getAll();
          
          // Handle both direct array and paginated response structures
          if (Array.isArray(responseAttendance.data)) {
            attendanceResult = responseAttendance.data;
          } else if (responseAttendance.data && responseAttendance.data._embedded && Array.isArray(responseAttendance.data._embedded.presences)) {
            attendanceResult = responseAttendance.data._embedded.presences;
          } else {
            console.warn('Expected array or _embedded.presences in attendance data but got:', responseAttendance.data);
            attendanceResult = [];
          }
        } catch (err) {
          console.error('Error fetching attendance data:', err);
          // Sample data if API fails
          attendanceResult = [
            {
              id: 1,
              date: new Date().toISOString(),
              statut: 'PRESENT',
              apprenantId: 101,
              apprenantNom: 'John Doe',
              groupeId: 201,
              groupeName: 'Web Development'
            },
            {
              id: 2,
              date: new Date().toISOString(),
              statut: 'ABSENT',
              apprenantId: 102,
              apprenantNom: 'Jane Smith',
              groupeId: 201,
              groupeName: 'Web Development'
            }
          ];
        }
        
        setAttendanceData(attendanceResult);
        setFilteredData(attendanceResult);
        
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
            return;
          }
          
          const formattedLearners = learnersData.map(learner => ({
            id: learner.id,
            nom: `${learner.nom} ${learner.prenom || ''}`
          }));
          setLearners(formattedLearners);
        } catch (err) {
          console.error('Error fetching learners data:', err);
          setLearners([]);
        }
        
        // Fetch trainers
        try {
          const responseTrainers = await formateurAPI.getAll();
          // Handle paginated response structure with _embedded.formateurs
          if (responseTrainers.data && responseTrainers.data._embedded && Array.isArray(responseTrainers.data._embedded.formateurs)) {
            const formattedTrainers = responseTrainers.data._embedded.formateurs.map(trainer => ({
              id: trainer.id,
              nom: trainer.nom,
              prenom: trainer.prenom
            }));
            setTrainers(formattedTrainers);
          } else {
            console.warn('Expected _embedded.formateurs array in trainers data but got:', responseTrainers.data);
            setTrainers([]);
          }
        } catch (err) {
          console.error('Error fetching trainers data:', err);
          setTrainers([]);
        }
        
        // Fetch groups
        try {
          const responseGroups = await groupeAPI.getAll();
          let groupsData = [];
          
          // Handle both direct array and paginated response structures
          if (Array.isArray(responseGroups.data)) {
            groupsData = responseGroups.data;
          } else if (responseGroups.data && responseGroups.data._embedded && Array.isArray(responseGroups.data._embedded.groupes)) {
            groupsData = responseGroups.data._embedded.groupes;
          } else {
            console.warn('Expected array or _embedded.groupes in groups data but got:', responseGroups.data);
            setGroups([]);
            return;
          }
          
          // Enhance group data with trainer info
          const enhancedGroups = groupsData.map(group => {
            const trainer = trainers.find(t => t.id === group.trainerId);
            return {
              ...group,
              trainerName: trainer ? `${trainer.nom} ${trainer.prenom || ''}` : 'Not Assigned'
            };
          });
          setGroups(enhancedGroups);
        } catch (err) {
          console.error('Error fetching groups data:', err);
          setGroups([]);
        }
        
        // Fetch or calculate summary
        await fetchSummary();
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load attendance data');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Update groups with trainer info when trainers are loaded
  useEffect(() => {
    if (trainers.length > 0 && groups.length > 0) {
      const enhancedGroups = groups.map(group => {
        const trainer = trainers.find(t => t.id === group.trainerId);
        return {
          ...group,
          trainerName: trainer ? `${trainer.nom} ${trainer.prenom || ''}` : 'Not Assigned'
        };
      });
      setGroups(enhancedGroups);
    }
  }, [trainers]);

  // Group attendance data
  useEffect(() => {
    if (!Array.isArray(filteredData)) {
      console.error('filteredData is not an array:', filteredData);
      setGroupedData([]);
      return;
    }

    const grouped: { [key: string]: GroupedAttendance } = {};
    
    filteredData.forEach(record => {
      const groupInfo = groups.find(g => g.id === record.groupeId);
      const trainerName = groupInfo?.trainerName || 'Unknown';
      const trainerId = groupInfo?.trainerId || null;
      const groupName = record.groupeName || 'Unknown Group';
      const formattedDate = new Date(record.date).toISOString().split('T')[0];
      
      const key = `${trainerId || 'none'}-${record.groupeId}-${formattedDate}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          trainer: trainerName,
          trainerId: trainerId,
          group: groupName,
          groupId: record.groupeId,
          date: formattedDate,
          records: [record]
        };
      } else {
        grouped[key].records.push(record);
      }
    });
    
    setGroupedData(Object.values(grouped));
  }, [filteredData, groups]);

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

  // Apply filters
  const applyFilters = async () => {
    try {
      setLoading(true);
      
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
      
      setFilteredData(filtered);
      setLoading(false);
    } catch (err) {
      setError('Failed to apply filters');
      setLoading(false);
      console.error('Error applying filters:', err);
    }
  };

  // Effect to apply filters
  useEffect(() => {
    if (attendanceData.length > 0) {
      applyFilters();
    }
  }, [selectedDate, selectedLearner, selectedGroup, attendanceData]);

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
  
  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMode(e.target.value as 'list' | 'grouped');
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedDate('');
    setSelectedLearner('');
    setSelectedGroup('');
  };

  // Helper function to safely render the attendance table
  const renderAttendanceTable = () => {
    if (!Array.isArray(filteredData)) {
      return (
        <div className="text-center py-6 text-red-500">
          Error: Attendance data is not in the expected format.
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((record) => {
              const groupInfo = groups.find(g => g.id === record.groupeId);
              return (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.apprenantNom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.groupeName}
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
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render grouped attendance view
  const renderGroupedAttendance = () => {
    if (!Array.isArray(groupedData)) {
      return (
        <div className="text-center py-6 text-red-500">
          Error: Grouped attendance data is not in the expected format.
        </div>
      );
    }
    
    return (
      <div className="space-y-8">
        {groupedData.map((group, index) => (
          <Card key={index}>
            <div className="p-4">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    <span className="text-blue-600">{group.trainer || 'Unassigned'}</span> - 
                    <span className="ml-2">{group.group}</span>
                  </h3>
                  <p className="text-sm text-gray-500">Date: {new Date(group.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
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
      <h1 className="text-2xl font-semibold">Attendance Management</h1>
      
      {/* Summary Cards */}
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
      
      {/* Filters */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Filter Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
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
                  <option key={learner.id} value={learner.id}>{learner.nom}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select
                value={selectedGroup}
                onChange={handleGroupChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Groups</option>
                {Array.isArray(groups) && groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <select
              value={viewMode}
              onChange={handleViewModeChange}
              className="w-full sm:w-48 p-2 border border-gray-300 rounded-md"
            >
              <option value="list">List View</option>
              <option value="grouped">Grouped by Trainer</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Results */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Attendance Records</h2>
          
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
              <p className="mt-2 text-gray-600">Loading data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">{error}</div>
          ) : (
            viewMode === 'list' ? (
              // List view
              Array.isArray(filteredData) && filteredData.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No attendance records found for the selected filters.
                </div>
              ) : (
                renderAttendanceTable()
              )
            ) : (
              // Grouped view
              Array.isArray(groupedData) && groupedData.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No attendance records found for the selected filters.
                </div>
              ) : (
                renderGroupedAttendance()
              )
            )
          )}
        </div>
      </Card>
    </div>
  );
};

export default Attendance;