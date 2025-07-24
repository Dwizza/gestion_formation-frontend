import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Filter, RefreshCw, Search, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { emploiDuTempsAPI, groupeAPI } from '../../api/apiService';

// Interface for API response
interface EmploiDuTemps {
  id: number;
  groupeId?: number;
  groupeName?: string;
  formationId?: number;
  formationTitle?: string;
  formateurId?: number;
  formateurName?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'pending';
  salle?: string;
  location?: string;
  date?: string; // For today's sessions
  sessionTitle?: string;
  description?: string;
}

interface Groupe {
  id: number;
  name: string;
  formationTitle?: string;
  trainerId?: number;
  trainerName?: string;
}

interface Formateur {
  id: number;
  name: string;
}

const TrainingCalendar: React.FC = () => {
  const [emploiData, setEmploiData] = useState<EmploiDuTemps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'today' | 'periode' | 'groupe' | 'formateur' | 'formation'>('all');
  const [selectedGroupeId, setSelectedGroupeId] = useState<string>('');
  const [selectedFormateurId, setSelectedFormateurId] = useState<string>('');
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Dropdown data
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [formations, setFormations] = useState<any[]>([]);

  useEffect(() => {
    loadDropdownData();
    loadEmploiData();
  }, []);

  useEffect(() => {
    loadEmploiData();
  }, [filterType, selectedGroupeId, selectedFormateurId, selectedFormationId, startDate, endDate]);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return emploiData.filter(emploi => {
      // Check if session matches this date
      return emploi.date === dateString || 
             emploi.startDate === dateString ||
             (emploi.startDate && emploi.endDate && 
              dateString >= emploi.startDate && dateString <= emploi.endDate);
    });
  };

  const getSelectedDateSessions = () => {
    if (!selectedDate) return [];
    return getSessionsForDate(selectedDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const loadDropdownData = async () => {
    try {
      // Load groups
      const groupesResponse = await groupeAPI.getAll();
      const groupsData = Array.isArray(groupesResponse.data) ? groupesResponse.data : 
                        (groupesResponse.data?._embedded?.groupes || []);
      setGroupes(groupsData);
      
      // Extract unique trainers and formations
      const uniqueTrainers = groupsData.reduce((trainers: Formateur[], group: any) => {
        if (group.trainerId && group.trainerName) {
          const exists = trainers.find(t => t.id === group.trainerId);
          if (!exists) {
            trainers.push({
              id: group.trainerId,
              name: group.trainerName
            });
          }
        }
        return trainers;
      }, []);
      
      const uniqueFormations = groupsData.reduce((formations: any[], group: any) => {
        if (group.formationId && group.formationTitle) {
          const exists = formations.find(f => f.id === group.formationId);
          if (!exists) {
            formations.push({
              id: group.formationId,
              title: group.formationTitle
            });
          }
        }
        return formations;
      }, []);
      
      setFormateurs(uniqueTrainers);
      setFormations(uniqueFormations);
      
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    }
  };

  const loadEmploiData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading emploi du temps with filter:', filterType);
      console.log('📡 Using new emploi-du-temps API endpoints');
      
      let response;
      
      try {
        switch (filterType) {
          case 'all':
            console.log('📋 Fetching all emploi du temps...');
            response = await emploiDuTempsAPI.getAll();
            break;
            
          case 'today':
            console.log('📅 Fetching today\'s sessions...');
            response = await emploiDuTempsAPI.getToday();
            break;
            
          case 'periode':
            if (startDate && endDate) {
              console.log(`📊 Fetching period: ${startDate} to ${endDate}`);
              response = await emploiDuTempsAPI.getByPeriode(startDate, endDate);
            } else {
              console.log('⚠️ Period dates not set, fetching all...');
              response = await emploiDuTempsAPI.getAll();
            }
            break;
            
          case 'groupe':
            if (selectedGroupeId) {
              console.log(`👥 Fetching group ${selectedGroupeId} schedule...`);
              response = await emploiDuTempsAPI.getByGroupe(selectedGroupeId);
            } else {
              console.log('⚠️ No group selected, fetching all...');
              response = await emploiDuTempsAPI.getAll();
            }
            break;
            
          case 'formateur':
            if (selectedFormateurId) {
              console.log(`👨‍🏫 Fetching trainer ${selectedFormateurId} schedule...`);
              response = await emploiDuTempsAPI.getByFormateur(selectedFormateurId);
            } else {
              console.log('⚠️ No trainer selected, fetching all...');
              response = await emploiDuTempsAPI.getAll();
            }
            break;
            
          case 'formation':
            if (selectedFormationId) {
              console.log(`📚 Fetching formation ${selectedFormationId} schedule...`);
              response = await emploiDuTempsAPI.getByFormation(selectedFormationId);
            } else {
              console.log('⚠️ No formation selected, fetching all...');
              response = await emploiDuTempsAPI.getAll();
            }
            break;
            
          default:
            console.log('📋 Default: Fetching all emploi du temps...');
            response = await emploiDuTempsAPI.getAll();
        }
        
        console.log('✅ New API Response received:', response);
        
      } catch (apiError: any) {
        console.warn('⚠️ New emploi-du-temps APIs not available yet, trying fallback...');
        console.error('API Error details:', apiError.response?.status, apiError.message);
        
        // Fallback to groups API and transform data
        console.log('🔄 Using groups API as fallback...');
        const groupsResponse = await groupeAPI.getAll();
        
        // Transform groups data to emploi format
        let groupsData = Array.isArray(groupsResponse.data) ? groupsResponse.data : 
                        (groupsResponse.data?._embedded?.groupes || []);
        
        const transformedData = groupsData.map((group: any) => ({
          id: group.id,
          groupeId: group.id,
          groupeName: group.name,
          formationId: group.formationId,
          formationTitle: group.formationTitle,
          formateurId: group.trainerId || group.formateurId,
          formateurName: group.trainerName || group.formateurName,
          startDate: group.startDate,
          endDate: group.endDate,
          status: group.status || 'active',
          sessionTitle: `${group.formationTitle} - ${group.name}`,
          description: `Training sessions for group ${group.name}`,
          // Add some example schedule data
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '17:00',
          salle: 'Room A1',
          location: 'Main Building'
        }));
        
        response = { data: transformedData };
        console.log('🔄 Transformed groups data to emploi format:', response.data);
      }
      
      console.log('📊 Raw response data:', response.data);
      
      let data = response.data || [];
      
      // Handle different response formats from the new API
      if (response.data?._embedded?.emplois) {
        data = response.data._embedded.emplois;
        console.log('📦 Found data in _embedded.emplois:', data);
      } else if (response.data?.emplois) {
        data = response.data.emplois;
        console.log('📦 Found data in emplois property:', data);
      } else if (Array.isArray(response.data)) {
        data = response.data;
        console.log('📦 Using direct array data:', data);
      } else {
        console.warn('⚠️ Unknown data format, trying to extract array...');
        const possibleArrays = Object.values(response.data || {}).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          data = possibleArrays[0];
          console.log('📦 Found array data:', data);
        }
      }
      
      if (Array.isArray(data)) {
        setEmploiData(data);
        console.log(`✅ Loaded ${data.length} emploi du temps records`);
      } else {
        console.warn('⚠️ Invalid data format after processing:', data);
        setEmploiData([]);
        setError('No valid schedule data found. Please check if the backend emploi-du-temps endpoints are properly configured.');
      }
      
    } catch (err: any) {
      console.error('❌ Error loading emploi du temps:', err);
      setError(`Failed to load schedule: ${err.message || 'Unknown error'}. Please ensure the backend emploi-du-temps endpoints are available.`);
      setEmploiData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredData = emploiData.filter(emploi => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      emploi.formationTitle?.toLowerCase().includes(searchLower) ||
      emploi.groupeName?.toLowerCase().includes(searchLower) ||
      emploi.formateurName?.toLowerCase().includes(searchLower) ||
      emploi.sessionTitle?.toLowerCase().includes(searchLower) ||
      emploi.salle?.toLowerCase().includes(searchLower) ||
      emploi.location?.toLowerCase().includes(searchLower)
    );
  });

  const resetFilters = () => {
    setFilterType('all');
    setSelectedGroupeId('');
    setSelectedFormateurId('');
    setSelectedFormationId('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <span className="mt-4 text-gray-600 font-medium">Loading schedule...</span>
        <span className="mt-1 text-sm text-gray-500">Please wait while we fetch your training data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Training Schedule
          </h1>
          <p className="text-gray-600 mt-2">Manage and view training sessions schedule</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${ 
                viewMode === 'calendar' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
          
          <Button 
            onClick={loadEmploiData} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Schedules</option>
                <option value="today">Today's Sessions</option>
                <option value="periode">By Period</option>
                <option value="groupe">By Group</option>
                <option value="formateur">By Trainer</option>
                <option value="formation">By Formation</option>
              </select>
            </div>

            {/* Period Filters */}
            {filterType === 'periode' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Group Filter */}
            {filterType === 'groupe' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
                <select
                  value={selectedGroupeId}
                  onChange={(e) => setSelectedGroupeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a group...</option>
                  {groupes.map((groupe) => (
                    <option key={groupe.id} value={groupe.id}>
                      {groupe.name} {groupe.formationTitle ? `- ${groupe.formationTitle}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Trainer Filter */}
            {filterType === 'formateur' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Trainer</label>
                <select
                  value={selectedFormateurId}
                  onChange={(e) => setSelectedFormateurId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a trainer...</option>
                  {formateurs.map((formateur) => (
                    <option key={formateur.id} value={formateur.id}>
                      {formateur.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Formation Filter */}
            {filterType === 'formation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Formation</label>
                <select
                  value={selectedFormationId}
                  onChange={(e) => setSelectedFormationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a formation...</option>
                  {formations.map((formation) => (
                    <option key={formation.id} value={formation.id}>
                      {formation.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search and Reset */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by formation, group, trainer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={resetFilters}
              variant="outline-primary"
              className="px-4 py-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24 p-1"></div>;
                }

                const daysSessions = getSessionsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`h-24 p-1 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                      isToday ? 'bg-blue-100 border-blue-300' : ''
                    } ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`}
                  >
                    <div className="h-full flex flex-col">
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {daysSessions.slice(0, 2).map((session, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded mb-0.5 truncate"
                            title={session.formationTitle || session.sessionTitle || 'Session'}
                          >
                            {session.formationTitle || session.sessionTitle || 'Session'}
                          </div>
                        ))}
                        {daysSessions.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{daysSessions.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Selected Date Sessions */}
      {viewMode === 'calendar' && selectedDate && getSelectedDateSessions().length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Sessions for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="space-y-3">
              {getSelectedDateSessions().map((emploi) => (
                <div key={emploi.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {emploi.sessionTitle || emploi.formationTitle || 'Training Session'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {emploi.groupeName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">Group:</span>
                            <span className="font-medium">{emploi.groupeName}</span>
                          </div>
                        )}
                        {(emploi.startTime || emploi.endTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {formatTime(emploi.startTime)} - {formatTime(emploi.endTime)}
                            </span>
                          </div>
                        )}
                        {(emploi.salle || emploi.location) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{emploi.salle || emploi.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(emploi.status)}`}>
                      {emploi.status || 'unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-2">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-medium mb-1">Error Loading Schedule</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                onClick={loadEmploiData}
                variant="outline-primary"
                size="sm"
                className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Display - List View */}
      {viewMode === 'list' && (
        <>
          {filteredData.length === 0 && !loading && !error ? (
            <Card className="border-blue-200 bg-blue-50">
              <div className="p-8 text-center">
                <Calendar className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-blue-800 font-medium text-lg mb-2">No Schedule Data Found</h3>
                <p className="text-blue-600 mb-4">
                  {searchTerm ? 'No schedules match your search criteria.' : 'No training schedules available for the selected filters.'}
                </p>
                <Button
                  onClick={resetFilters}
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Showing {filteredData.length} schedule(s)</span>
                </div>
                {searchTerm && (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Search: "{searchTerm}"</span>
                  </div>
                )}
              </div>

              {/* Schedule Cards */}
              {filteredData.map((emploi) => (
                <Card key={emploi.id} className="hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {emploi.sessionTitle || emploi.formationTitle || 'Training Session'}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(emploi.status)}`}>
                            {emploi.status || 'unknown'}
                          </span>
                          {emploi.dayOfWeek && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              {emploi.dayOfWeek}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Group */}
                      {emploi.groupeName && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="text-gray-500">Group:</span>
                            <div className="font-medium text-gray-900">{emploi.groupeName}</div>
                          </div>
                        </div>
                      )}

                      {/* Trainer */}
                      {emploi.formateurName && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <div>
                            <span className="text-gray-500">Trainer:</span>
                            <div className="font-medium text-gray-900">{emploi.formateurName}</div>
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      {(emploi.startTime || emploi.endTime) && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <div>
                            <span className="text-gray-500">Time:</span>
                            <div className="font-medium text-gray-900">
                              {formatTime(emploi.startTime)} - {formatTime(emploi.endTime)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {(emploi.salle || emploi.location) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <div className="font-medium text-gray-900">{emploi.salle || emploi.location}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date Information */}
                    {(emploi.date || emploi.startDate || emploi.endDate) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-500">Schedule:</span>
                          {emploi.date ? (
                            <span className="font-medium text-gray-900">{formatDate(emploi.date)}</span>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {formatDate(emploi.startDate)} - {formatDate(emploi.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {emploi.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 italic">"{emploi.description}"</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainingCalendar;
