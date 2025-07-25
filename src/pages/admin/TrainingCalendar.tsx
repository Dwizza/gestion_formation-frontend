import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Filter, RefreshCw, Search, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { groupeAPI, sessionAPI } from '../../api/apiService';

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
  date?: string;
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
  // 🔧 Helper function to get consistent local date strings
  const getLocalDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

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
  }, [filterType, selectedGroupeId, selectedFormateurId, selectedFormationId, startDate, endDate, currentDate]);

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
    // 🔧 FIX: Use local date string to match event dates
    const dateString = getLocalDateString(date);
    return emploiData.filter(emploi => emploi.date === dateString);
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

      console.log('🔄 Loading calendar data...');
      
      // Load groups and sessions data
      const groupsResponse = await groupeAPI.getAll();
      let groupsData = Array.isArray(groupsResponse.data) ? groupsResponse.data : 
                      (groupsResponse.data?._embedded?.groupes || []);

      const sessionsResponse = await sessionAPI.getAll();
      let sessionsData = Array.isArray(sessionsResponse.data) ? sessionsResponse.data : 
                        (sessionsResponse.data?._embedded?.sessions || 
                         sessionsResponse.data?.content || 
                         sessionsResponse.data?.sessions || []);

      console.log('✅ Data loaded - Groups:', groupsData.length, 'Sessions:', sessionsData.length);

      // 🔍 DEBUG: Log sample data to understand structure
      if (groupsData.length > 0) {
        console.log('📊 Sample Group:', JSON.stringify(groupsData[0], null, 2));
      }
      if (sessionsData.length > 0) {
        console.log('📊 Sample Session:', JSON.stringify(sessionsData[0], null, 2));
      }

      // SIMPLE calendar event generation - no complex loops
      let calendarEvents: EmploiDuTemps[] = [];
      
      // Day mapping
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };

      // Current month only to avoid duplications
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      console.log(`📅 Generating for: ${year}-${month + 1} (${daysInMonth} days)`);

      // Process each session simply
      sessionsData.forEach((session: any) => {
        console.log(`🔍 Session: ${session.title}, Days: ${JSON.stringify(session.days)}, Status: ${session.status}`);
        
        const groupe = groupsData.find((g: any) => g.id === session.groupeId);
        
        if (session.days && Array.isArray(session.days)) {
          // For each day of this session
          session.days.forEach((dayName: string) => {
            const dayNumber = dayMap[dayName.toLowerCase()];
            
            if (dayNumber !== undefined) {
              // Find all dates in current month that match this day
              for (let date = 1; date <= daysInMonth; date++) {
                const checkDate = new Date(year, month, date);
                
                if (checkDate.getDay() === dayNumber) {
                  // 🔧 FIX: Use local date string to avoid timezone offset issues
                  const dateStr = getLocalDateString(checkDate);
                  
                  // 🔍 CHECK FORMATION PERIOD: Only create event if within formation period
                  let isWithinFormationPeriod = true;
                  
                  // Check if we have formation period from group data
                  if (groupe) {
                    if (groupe.startDate && groupe.endDate) {
                      isWithinFormationPeriod = dateStr >= groupe.startDate && dateStr <= groupe.endDate;
                      console.log(`🗓️ Formation Period Check - ${groupe.name}: ${groupe.startDate} to ${groupe.endDate}, Event: ${dateStr}, Valid: ${isWithinFormationPeriod}`);
                    } else if (groupe.formationStartDate && groupe.formationEndDate) {
                      isWithinFormationPeriod = dateStr >= groupe.formationStartDate && dateStr <= groupe.formationEndDate;
                      console.log(`🗓️ Formation Period Check - ${groupe.name}: ${groupe.formationStartDate} to ${groupe.formationEndDate}, Event: ${dateStr}, Valid: ${isWithinFormationPeriod}`);
                    }
                  }
                  
                  // Check if session itself has period limits
                  if (session.startDate && session.endDate) {
                    const sessionPeriodValid = dateStr >= session.startDate && dateStr <= session.endDate;
                    isWithinFormationPeriod = isWithinFormationPeriod && sessionPeriodValid;
                    console.log(`🗓️ Session Period Check - ${session.title}: ${session.startDate} to ${session.endDate}, Event: ${dateStr}, Valid: ${sessionPeriodValid}`);
                  }
                  
                  // Only create event if within valid period
                  if (isWithinFormationPeriod) {
                    const event: EmploiDuTemps = {
                      id: parseInt(`${session.id}${dayNumber}${date}000`),
                      groupeId: session.groupeId,
                      groupeName: session.groupeName || groupe?.name || 'Unknown',
                      formationId: groupe?.formationId,
                      formationTitle: groupe?.formationTitle || session.title,
                      formateurId: session.formateurId,
                      formateurName: session.formateurName || groupe?.trainerName || 'Unknown',
                      date: dateStr,
                      startDate: dateStr,
                      endDate: dateStr,
                      status: session.status || 'active',
                      sessionTitle: session.title,
                      description: `${session.title} - ${dayName}`,
                      dayOfWeek: dayName.toLowerCase(),
                      startTime: session.startTime || '09:00',
                      endTime: session.endTime || '17:00',
                      location: session.location || 'TBD',
                      salle: session.location || 'TBD'
                    };
                    
                    calendarEvents.push(event);
                    console.log(`✅ Event: ${session.title} on ${dateStr} (${dayName}) - VALID PERIOD`);
                    console.log(`🔧 Date created as: ${dateStr}, Calendar day: ${checkDate.getDate()}, Month: ${checkDate.getMonth() + 1}`);
                  } else {
                    console.log(`❌ Event SKIPPED: ${session.title} on ${dateStr} (${dayName}) - OUTSIDE FORMATION PERIOD`);
                  }
                }
              }
            }
          });
        } else if (session.date) {
          // Single date event - check if within formation period
          let isWithinFormationPeriod = true;
          
          // Check if we have formation period from group data
          if (groupe) {
            if (groupe.startDate && groupe.endDate) {
              isWithinFormationPeriod = session.date >= groupe.startDate && session.date <= groupe.endDate;
              console.log(`🗓️ Formation Period Check - ${groupe.name}: ${groupe.startDate} to ${groupe.endDate}, Event: ${session.date}, Valid: ${isWithinFormationPeriod}`);
            } else if (groupe.formationStartDate && groupe.formationEndDate) {
              isWithinFormationPeriod = session.date >= groupe.formationStartDate && session.date <= groupe.formationEndDate;
              console.log(`🗓️ Formation Period Check - ${groupe.name}: ${groupe.formationStartDate} to ${groupe.formationEndDate}, Event: ${session.date}, Valid: ${isWithinFormationPeriod}`);
            }
          }
          
          if (isWithinFormationPeriod) {
            const event: EmploiDuTemps = {
              id: session.id,
              groupeId: session.groupeId,
              groupeName: session.groupeName || groupe?.name || 'Unknown',
              formationId: groupe?.formationId,
              formationTitle: groupe?.formationTitle || session.title,
              formateurId: session.formateurId,
              formateurName: session.formateurName || groupe?.trainerName || 'Unknown',
              date: session.date,
              startDate: session.date,
              endDate: session.date,
              status: session.status || 'active',
              sessionTitle: session.title,
              description: session.description || session.title,
              dayOfWeek: new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
              startTime: session.startTime || '09:00',
              endTime: session.endTime || '17:00',
              location: session.location || 'TBD',
              salle: session.location || 'TBD'
            };
            
            calendarEvents.push(event);
            console.log(`✅ Single event: ${session.title} on ${session.date} - VALID PERIOD`);
          } else {
            console.log(`❌ Single event SKIPPED: ${session.title} on ${session.date} - OUTSIDE FORMATION PERIOD`);
          }
        }
      });

      // Apply filters
      if (filterType === 'groupe' && selectedGroupeId) {
        calendarEvents = calendarEvents.filter(event => 
          event.groupeId?.toString() === selectedGroupeId
        );
      } else if (filterType === 'formateur' && selectedFormateurId) {
        calendarEvents = calendarEvents.filter(event => 
          event.formateurId?.toString() === selectedFormateurId
        );
      } else if (filterType === 'formation' && selectedFormationId) {
        calendarEvents = calendarEvents.filter(event => 
          event.formationId?.toString() === selectedFormationId
        );
      } else if (filterType === 'periode' && startDate && endDate) {
        calendarEvents = calendarEvents.filter(event => 
          event.date && event.date >= startDate && event.date <= endDate
        );
      } else if (filterType === 'today') {
        // 🔧 FIX: Use local date string for today filter
        const today = new Date();
        const todayStr = getLocalDateString(today);
        calendarEvents = calendarEvents.filter(event => event.date === todayStr);
        console.log(`🗓️ Today filter: Looking for ${todayStr}, Found ${calendarEvents.length} events`);
      }

      setEmploiData(calendarEvents);
      console.log(`📅 Final result: ${calendarEvents.length} events created`);
      
      // Log breakdown by session
      const breakdown = sessionsData.map((s: any) => {
        const count = calendarEvents.filter(e => e.sessionTitle === s.title).length;
        return `${s.title}: ${count} events`;
      });
      console.log('📊 Session breakdown:', breakdown);
      
    } catch (err: any) {
      console.error('❌ Error loading calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
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
            Training Schedule - Fixed Version
          </h1>
          <p className="text-gray-600 mt-2">Simple calendar without duplications</p>
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

            {/* Conditional filters based on type */}
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
                            className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate ${
                              session.sessionTitle === 'Aliqua' ? 'bg-red-500 text-white' :
                              session.sessionTitle === 'photoshop 1' ? 'bg-blue-500 text-white' :
                              session.sessionTitle === 'ziko' ? 'bg-green-500 text-white' :
                              'bg-purple-500 text-white'
                            }`}
                            title={session.sessionTitle || 'Session'}
                          >
                            {session.sessionTitle || 'Session'}
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
