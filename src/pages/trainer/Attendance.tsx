import React, { useState, useEffect } from 'react';
import { Search, Calendar, Check, X, Save, Loader, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { groupeAPI, apprenantAPI, presenceAPI } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';

// Define interfaces based on your API data structures
interface Group {
  id: number;
  name: string;
  formationId: number;
  formationTitle: string;
  startDate: string;
  endDate: string;
  status: string;
  learnerCount: number;
}

interface Learner {
  id: number;
  nom: string;
  email: string;
  phone?: string;
  status?: string;
}

interface AttendanceRecord {
  [learnerId: string]: boolean;
}

const TrainerAttendance: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [learners, setLearners] = useState<Learner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch trainer's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        if (user && user.id) {
          const response = await groupeAPI.getByFormateur(user.id.toString());
          setGroups(response.data);
          
          // Set the first group as selected if there are groups
          if (response.data && response.data.length > 0) {
            setSelectedGroup(response.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups. Please check if the API endpoint for getting trainer groups exists.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Fetch learners when group selection changes
  useEffect(() => {
    const fetchLearners = async () => {
      if (!selectedGroup) return;
      
      try {
        setIsLoading(true);
        const response = await apprenantAPI.getByGroupe(selectedGroup);
        setLearners(response.data);
        
        // Reset attendance when group changes
        setAttendance({});
      } catch (err) {
        console.error('Error fetching learners:', err);
        setError('Failed to load learners for this group. Please ensure the API endpoint works correctly.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearners();
  }, [selectedGroup]);

  // Fetch existing attendance records when date or group changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedGroup || !selectedDate) return;
      
      try {
        setIsLoading(true);
        const response = await presenceAPI.getByGroupe(selectedGroup, selectedDate);
        
        // Convert API response to our attendance format
        const attendanceData: AttendanceRecord = {};
        if (response.data && response.data.length > 0) {
          response.data.forEach((record: any) => {
            // Assuming API returns statut as "PRESENT" or "ABSENT"
            attendanceData[record.apprenantId] = record.statut === "PRESENT";
          });
        }
        
        setAttendance(attendanceData);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        // Don't show error for this as it might just mean no attendance has been taken yet
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedGroup, selectedDate]);

  // Filter learners by search query
  const filteredLearners = learners.filter(learner => 
    learner.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  const markAttendance = (learnerId: string, isPresent: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [learnerId]: isPresent
    }));
  };
  
  const markAllPresent = () => {
    const newAttendance: AttendanceRecord = {};
    learners.forEach(learner => {
      newAttendance[learner.id] = true;
    });
    setAttendance(newAttendance);
  };
  
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Prepare attendance records for the API
      const attendanceRecords = Object.entries(attendance).map(([learnerId, isPresent]) => ({
        apprenantId: parseInt(learnerId),
        groupeId: parseInt(selectedGroup),
        date: selectedDate,
        statut: isPresent ? "PRESENT" : "ABSENT"
      }));
      
      if (attendanceRecords.length === 0) {
        setError('No attendance records to save.');
        setIsSaving(false);
        return;
      }
      
      // Submit attendance data to the API
      await presenceAPI.bulkCreate(attendanceRecords);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to save attendance. Please check the API endpoint for saving attendance records.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };
  
  const isLearnerMarked = (learnerId: string) => {
    return learnerId in attendance;
  };
  
  const getMarkedCount = () => {
    return Object.keys(attendance).length;
  };
  
  const getPresentCount = () => {
    return Object.values(attendance).filter(status => status).length;
  };
  
  const getAbsentCount = () => {
    return Object.values(attendance).filter(status => !status).length;
  };
  
  if (isLoading && groups.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Attendance Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="success" 
            onClick={markAllPresent}
            disabled={learners.length === 0}
          >
            Mark All Present
          </Button>
          <Button 
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            disabled={getMarkedCount() === 0}
            className="flex items-center space-x-1"
          >
            <Save size={16} />
            <span>Save Attendance</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <Check size={16} className="mr-2" />
          Attendance saved successfully!
        </div>
      )}
      
      {groups.length === 0 && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          No groups found for this trainer. Please check if you have been assigned to any groups.
        </div>
      )}
      
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="group" className="form-label">Select Group</label>
            <select
              id="group"
              className="form-input"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setAttendance({});
              }}
            >
              {groups.length === 0 ? (
                <option value="">No groups available</option>
              ) : (
                groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.formationTitle || 'Unknown Training'}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="form-label">Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="date"
                id="date"
                className="form-input pl-10"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="search" className="form-label">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search learners..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Present: {getPresentCount()}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Absent: {getAbsentCount()}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
            <span className="text-sm">Not Marked: {learners.length - getMarkedCount()}</span>
          </div>
        </div>
        
        {isLoading && selectedGroup ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="animate-spin h-6 w-6 text-primary-600" />
            <span className="ml-2">Loading learners...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-500 py-2 border-b">
              <div className="col-span-4 md:col-span-5">Learner</div>
              <div className="col-span-6 md:col-span-5">Email</div>
              <div className="col-span-2">Status</div>
            </div>
            
            {filteredLearners.length > 0 ? (
              filteredLearners.map((learner) => (
                <div key={learner.id} className="grid grid-cols-12 gap-4 py-3 border-b items-center">
                  <div className="col-span-4 md:col-span-5 font-medium">{learner.nom}</div>
                  <div className="col-span-6 md:col-span-5 text-sm text-gray-600 truncate">{learner.email}</div>
                  <div className="col-span-2 flex space-x-1">
                    <button
                      className={`p-1 rounded-full ${attendance[learner.id] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => markAttendance(learner.id.toString(), true)}
                      title="Mark Present"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className={`p-1 rounded-full ${isLearnerMarked(learner.id.toString()) && !attendance[learner.id] ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => markAttendance(learner.id.toString(), false)}
                      title="Mark Absent"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedGroup 
                  ? "No learners found in this group or matching your search criteria" 
                  : "Please select a group to view learners"}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TrainerAttendance;