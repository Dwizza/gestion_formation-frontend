import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { emploiDuTempsAPI, groupeAPI } from '../../api/apiService';

// Updated interface for new API response structure
interface EmploiDuTemps {
  id: number;
  groupeId: number;
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

interface CalendarEvent {
  id: number;
  title: string;
  groupName: string;
  trainerName: string;
  formationTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  salle?: string;
  location?: string;
  type: 'emploi';
  groupeId?: number;
  formateurId?: number;
  formationId?: number;
}

const TrainingCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'calendar'>('calendar');
  
  // New filter states
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month' | 'groupe' | 'formateur'>('all');
  const [selectedGroupeId, setSelectedGroupeId] = useState<string>('');
  const [selectedFormateurId, setSelectedFormateurId] = useState<string>('');
  const [groupes, setGroupes] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDropdownData();
  }, [filterType, selectedGroupeId, selectedFormateurId]);

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(start.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const loadDropdownData = async () => {
    try {
      // Load groups for filter dropdown
      const groupesResponse = await groupeAPI.getAll();
      const groupsData = Array.isArray(groupesResponse.data) ? groupesResponse.data : 
                        (groupesResponse.data?._embedded?.groupes || []);
      setGroupes(groupsData);
      
      // Extract unique trainers from groups
      const uniqueTrainers = groupsData.reduce((trainers: any[], group: any) => {
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
      setFormateurs(uniqueTrainers);
      
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading training calendar data with filter:', filterType);
      let response;
      
      // Use different API endpoints based on filter type
      switch (filterType) {
        case 'today':
          response = await emploiDuTempsAPI.getToday();
          break;
        case 'week':
          const weekStart = getWeekStart(currentDate);
          const weekEnd = getWeekEnd(currentDate);
          response = await emploiDuTempsAPI.getByPeriode(
            weekStart.toISOString().split('T')[0],
            weekEnd.toISOString().split('T')[0]
          );
          break;
        case 'month':
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          response = await emploiDuTempsAPI.getByPeriode(
            monthStart.toISOString().split('T')[0],
            monthEnd.toISOString().split('T')[0]
          );
          break;
        case 'groupe':
          if (selectedGroupeId) {
            response = await emploiDuTempsAPI.getByGroupe(selectedGroupeId);
          } else {
            response = await emploiDuTempsAPI.getAll();
          }
          break;
        case 'formateur':
          if (selectedFormateurId) {
            response = await emploiDuTempsAPI.getByFormateur(selectedFormateurId);
          } else {
            response = await emploiDuTempsAPI.getAll();
          }
          break;
        default:
          response = await emploiDuTempsAPI.getAll();
      }
      
      console.log('API Response:', response);
      
      const emploiData: EmploiDuTemps[] = response.data || [];
      console.log('Emploi data:', emploiData);

      // Check if data is valid
      if (!Array.isArray(emploiData)) {
        console.warn('Invalid data format received from API:', emploiData);
        setError('Invalid data format received from API');
        return;
      }

      if (emploiData.length === 0) {
        console.log('No training data found');
        setEvents([]);
        return;
      }

      // Convert emploi data to calendar events
      const calendarEvents: CalendarEvent[] = [];

      emploiData.forEach((emploi: EmploiDuTemps) => {
        // Handle different response formats from different endpoints
        if (filterType === 'today' && emploi.date) {
          // Today endpoint returns sessions with specific dates
          calendarEvents.push({
            id: emploi.id,
            title: emploi.sessionTitle || emploi.formationTitle || 'Training Session',
            groupName: emploi.groupeName || 'Unknown Group',
            trainerName: emploi.formateurName || 'Unknown Trainer',
            formationTitle: emploi.formationTitle || 'Training Session',
            date: emploi.date,
            startTime: emploi.startTime || '09:00',
            endTime: emploi.endTime || '12:00',
            status: emploi.status || 'active',
            salle: emploi.salle || emploi.location,
            location: emploi.location,
            type: 'emploi',
            groupeId: emploi.groupeId,
            formateurId: emploi.formateurId,
            formationId: emploi.formationId
          });
        } else if (emploi.startDate && emploi.endDate && emploi.startTime && emploi.endTime) {
          // Regular schedule data with recurring sessions
          const startDate = new Date(emploi.startDate);
          const endDate = new Date(emploi.endDate);
          const today = new Date();
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Skipping emploi with invalid dates:', emploi);
            return;
          }
          
          // Map day of week to number
          const dayMapping: { [key: string]: number } = {
            'dimanche': 0, 'lundi': 1, 'mardi': 2, 'mercredi': 3,
            'jeudi': 4, 'vendredi': 5, 'samedi': 6,
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          
          // Safe check for dayOfWeek with fallback
          const dayOfWeek = emploi.dayOfWeek?.toLowerCase() || 'monday';
          const targetDayOfWeek = dayMapping[dayOfWeek] ?? 1; // Default to Monday
          
          // Find the first occurrence of the target day of week
          let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
          
          // Move to the target day of the week
          while (currentDate.getDay() !== targetDayOfWeek && currentDate <= endDate) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Generate weekly occurrences
          while (currentDate <= endDate) {
            calendarEvents.push({
              id: emploi.id * 1000 + Math.floor(currentDate.getTime() / 1000000), // Unique ID
              title: emploi.formationTitle || 'Training Session',
              groupName: emploi.groupeName || 'Unknown Group',
              trainerName: emploi.formateurName || 'Unknown Trainer',
              formationTitle: emploi.formationTitle || 'Training Session',
              date: currentDate.toISOString().split('T')[0],
              startTime: emploi.startTime,
              endTime: emploi.endTime,
              status: emploi.status || 'active',
              salle: emploi.salle,
              location: emploi.location,
              type: 'emploi',
              groupeId: emploi.groupeId,
              formateurId: emploi.formateurId,
              formationId: emploi.formationId
            });
            
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
          }
        } else {
          console.warn('Skipping emploi with missing required fields:', emploi);
        }
      });

      console.log('Generated calendar events:', calendarEvents);
      
      // Sort events by date
      const sortedEvents = calendarEvents.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.startTime);
        const dateB = new Date(b.date + 'T' + b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setEvents(sortedEvents);
      
    } catch (err: any) {
      console.error('Error loading calendar:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(`Error loading training calendar: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading training calendar...</span>
      </div>
    );
  }

  const weekDates = getWeekDates(currentDate);

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Training Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage your training sessions
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sessions</option>
              <option value="today">Today Only</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="groupe">By Group</option>
              <option value="formateur">By Trainer</option>
            </select>
            
            {filterType === 'groupe' && (
              <select
                value={selectedGroupeId}
                onChange={(e) => setSelectedGroupeId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Group...</option>
                {groupes.map((groupe) => (
                  <option key={groupe.id} value={groupe.id}>
                    {groupe.name} - {groupe.formationTitle}
                  </option>
                ))}
              </select>
            )}
            
            {filterType === 'formateur' && (
              <select
                value={selectedFormateurId}
                onChange={(e) => setSelectedFormateurId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Trainer...</option>
                {formateurs.map((formateur) => (
                  <option key={formateur.id} value={formateur.id}>
                    {formateur.name}
                  </option>
                ))}
              </select>
            )}
            
            <Button
              onClick={loadData}
              variant="outline-primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              onClick={loadData}
              variant="outline-primary"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Show info message if no events */}
      {!loading && events.length === 0 && !error && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-blue-800 font-medium text-lg mb-2">No training sessions found</h3>
            <p className="text-blue-600">
              There are no training sessions scheduled for your selected filter.
            </p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      {events.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            variant="outline-primary"
            size="sm"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous {viewMode === 'week' ? 'Week' : 'Month'}
          </Button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'week' 
              ? `Week of ${weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h2>
          
          <Button
            onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
            variant="outline-primary"
            size="sm"
            className="flex items-center gap-2"
          >
            Next {viewMode === 'week' ? 'Week' : 'Month'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && events.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
              
              {weekDates.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={index} className={`min-h-32 p-2 border rounded ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                    <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded text-white ${getStatusColor(event.status)}`}
                          title={`${event.title} - ${event.groupName} - ${formatTime(event.startTime)}-${formatTime(event.endTime)}`}
                        >
                          <div className="font-medium truncate">
                            {formatTime(event.startTime).replace(/\s?(AM|PM)/, '')} {event.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Month/List View */}
      {(viewMode === 'month' || viewMode === 'calendar') && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.groupName}</span>
                      </div>
                      
                      {event.salle && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.salle}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Trainer:</span> {event.trainerName}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Legend */}
      {events.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h3>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrainingCalendar;
