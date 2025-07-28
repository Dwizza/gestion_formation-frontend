import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Calendar, Clock, Users, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { sessionAPI, groupeAPI } from '../../api/apiService';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-200';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-200';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out animate-slide-in-right`}>
      <div className={`rounded-xl p-4 shadow-2xl border ${getToastStyles()}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          confirmBtn: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-8 w-8 text-amber-500" />,
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
        };
      default:
        return {
          icon: <CheckCircle className="h-8 w-8 text-blue-500" />,
          confirmBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center p-6">
        <div className="flex justify-center mb-4">
          {styles.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onClose}
            variant="outline-primary"
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${styles.confirmBtn}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface Session {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  days?: string[] | string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  groupeId: number;
  groupName?: string;
  formateurId: number;
  trainerName?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SessionFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  days: string[];
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  groupeId: string;
  formateurId: string;
  location: string;
  maxParticipants: string;
  notes: string;
}

interface Groupe {
  id: number;
  name: string;
  capaciteMax: number;
  startDate: string;
  endDate: string;
  status: string;
  learnerCount: number;
  formationId: number;
  formationTitle: string;
  trainerId: number;
  trainerName: string;
}

interface Formateur {
  id: number;
  name: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    date: '',
    days: [],
    status: 'active',
    groupeId: '',
    formateurId: '',
    location: '',
    maxParticipants: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<SessionFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to show toast
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadSessions();
    loadDropdownData();
  }, []);

  
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sessionAPI.getAll();
      
      if (response && response.data) {
        let sessionsData = [];
        
        if (Array.isArray(response.data)) {
          sessionsData = response.data;
        } else if (response.data._embedded && response.data._embedded.sessions) {
          sessionsData = response.data._embedded.sessions;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          sessionsData = response.data.content;
        } else if (response.data.sessions && Array.isArray(response.data.sessions)) {
          sessionsData = response.data.sessions;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          sessionsData = response.data.data;
        } else {
          sessionsData = [];
        }
        
        setSessions(sessionsData);
      } else {
        setSessions([]);
      }
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      const groupesResponse = await groupeAPI.getAll().catch(err => {
        console.warn('Failed to fetch groups:', err);
        return { data: [] };
      });

      
      const groupsData = Array.isArray(groupesResponse.data) ? groupesResponse.data : [];
      setGroupes(groupsData);
      
      
      const uniqueTrainers = groupsData.reduce((trainers: Formateur[], group: Groupe) => {
        const existingTrainer = trainers.find(t => t.id === group.trainerId);
        if (!existingTrainer && group.trainerId && group.trainerName) {
          trainers.push({
            id: group.trainerId,
            name: group.trainerName
          });
        }
        return trainers;
      }, []);
      
      setFormateurs(uniqueTrainers);
      
      console.log('📊 API Response Analysis:');
      console.log('🔹 Groups API Data:', groupsData);
      console.log('🔹 Extracted Trainers:', uniqueTrainers);
      console.log(`✅ Loaded ${groupsData.length} groups and ${uniqueTrainers.length} unique trainers`);
      
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleCreateSession = () => {
    setModalMode('create');
    setSelectedSession(null);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      date: '',
      days: [],
      status: 'active',
      groupeId: '',
      formateurId: '',
      location: '',
      maxParticipants: '',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setModalMode('edit');
    setSelectedSession(session);
    setFormData({
      title: session.title || '',
      description: session.description || '',
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      date: session.date || '',
      days: session.days ? (
        Array.isArray(session.days) 
          ? session.days 
          : session.days.split(',').map(d => d.trim())
      ) : [],
      status: session.status || 'active',
      groupeId: session.groupeId?.toString() || '',
      formateurId: session.formateurId?.toString() || '',
      location: session.location || '',
      maxParticipants: session.maxParticipants?.toString() || '',
      notes: session.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  
  const handleViewSession = async (session: Session) => {
    try {
      setLoading(true);
      const response = await sessionAPI.getById(session.id.toString());
      console.log('Loaded session details:', response.data);
      setSelectedSession(response.data);
      setIsViewModalOpen(true);
    } catch (err: any) {
      console.error('Error loading session details:', err);
      setError('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleDeleteSession = async (session: Session) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Session',
      message: `Are you sure you want to delete the session "${session.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await sessionAPI.delete(session.id.toString());
          await loadSessions();
          showToast('Session deleted successfully!', 'success');
        } catch (err: any) {
          console.error('Error deleting session:', err);
          showToast('Failed to delete session. Please try again.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const validateForm = (): boolean => {
    const errors: Partial<SessionFormData> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.groupeId.trim()) {
      errors.groupeId = 'Group is required';
    }

    if (!formData.formateurId.trim()) {
      errors.formateurId = 'Trainer is required';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.endTime = 'End time must be after start time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionData: any = {
        title: formData.title.trim(),
        groupeId: parseInt(formData.groupeId),
        formateurId: parseInt(formData.formateurId),
        status: formData.status
      };
      
            if (formData.description?.trim()) {
        sessionData.description = formData.description.trim();
      }
      
      if (formData.date && formData.date.trim()) {
        sessionData.date = formData.date;
      }
      
      if (formData.startTime && formData.startTime.trim()) {
        sessionData.startTime = formData.startTime;
      }
      
      if (formData.endTime && formData.endTime.trim()) {
        sessionData.endTime = formData.endTime;
      }
      
      if (formData.days && formData.days.length > 0) {
        sessionData.days = formData.days;
        console.log('🗓️ Days being sent:', sessionData.days);
        console.log('🗓️ Days type:', typeof sessionData.days);
        console.log('🗓️ Days array check:', Array.isArray(sessionData.days));
      } else {
        console.log('⚠️ No days selected, omitting from request');
      }
      
      if (formData.location && formData.location.trim()) {
        sessionData.location = formData.location.trim();
      }
      
      if (formData.maxParticipants && formData.maxParticipants.trim()) {
        sessionData.maxParticipants = parseInt(formData.maxParticipants);
      }
      
      if (formData.notes && formData.notes.trim()) {
        sessionData.notes = formData.notes.trim();
      }

      console.log('Sending session data:', sessionData);
      console.log('Form validation passed with data:', {
        title: formData.title,
        groupeId: formData.groupeId,
        formateurId: formData.formateurId,
        hasDate: !!formData.date,
        hasStartTime: !!formData.startTime,
        hasEndTime: !!formData.endTime,
        dateValue: formData.date,
        startTimeValue: formData.startTime,
        endTimeValue: formData.endTime
      });

      if (modalMode === 'create') {
        
        await sessionAPI.create(sessionData);
        showToast('Session created successfully!', 'success');
      } else {
        
        await sessionAPI.update(selectedSession!.id.toString(), sessionData);
        showToast('Session updated successfully!', 'success');
        
      }

      setIsModalOpen(false);
      await loadSessions();
    } catch (err: any) {
      console.error(' Error saving session:', err);
      console.error(' Error message:', err.message);
      showToast(`Failed to ${modalMode === 'create' ? 'create' : 'update'} session. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof SessionFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'groupeId' && value) {
        const selectedGroup = groupes.find(g => g.id === parseInt(value));
        console.log('Selected group:', selectedGroup);
        
        if (selectedGroup && selectedGroup.trainerId) {
          newData.formateurId = selectedGroup.trainerId.toString();
          console.log(`Auto-selected trainer ${selectedGroup.trainerId} (${selectedGroup.trainerName}) for group "${selectedGroup.name}"`);
        } else {
          console.log(`Group "${selectedGroup?.name}" has no assigned trainer`);
          newData.formateurId = '';
        }
      }
      
      return newData;
    });
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const weekDays = [
    { value: 'monday', label: 'Monday', short: 'Mon' },
    { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { value: 'thursday', label: 'Thursday', short: 'Thu' },
    { value: 'friday', label: 'Friday', short: 'Fri' },
    { value: 'saturday', label: 'Saturday', short: 'Sat' },
    { value: 'sunday', label: 'Sunday', short: 'Sun' }
  ];

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm.trim()) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const title = session.title || '';
    const groupName = session.groupName || '';
    const trainerName = session.trainerName || '';
    const location = session.location || '';
    
    return title.toLowerCase().includes(searchLower) ||
           groupName.toLowerCase().includes(searchLower) ||
           trainerName.toLowerCase().includes(searchLower) ||
           location.toLowerCase().includes(searchLower);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <span className="mt-4 text-gray-600 font-medium">Loading sessions...</span>
        <span className="mt-1 text-sm text-gray-500">Please wait while we fetch your data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes slide-in-right {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .animate-slide-in-right {
            animation: slide-in-right 0.3s ease-out;
          }
        `}
      </style>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions Management</h1>
          <p className="text-gray-600 mt-2">Manage and organize your training sessions</p>
        </div>
        <Button 
          onClick={handleCreateSession} 
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Session
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-2">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-medium mb-1">Error Loading Sessions</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  loadSessions();
                }}
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search sessions by title, group, trainer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Total Sessions: {filteredSessions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Horizontal Layout */}
      <div className="flex flex-col space-y-2">
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 group">
            <div className="p-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Session Info */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {session.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(session.status)} shadow-sm`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Details in horizontal layout */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                      <Calendar className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-gray-700">{formatDate(session.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                      <Clock className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-gray-700">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                    </div>

                    {session.groupName && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">{session.groupName}</span>
                      </div>
                    )}

                    {session.trainerName && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-md">
                        <Users className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-800">{session.trainerName}</span>
                      </div>
                    )}

                    {session.location && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="text-xs font-medium text-red-700">{session.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Days and Description */}
                  <div className="flex flex-wrap gap-2 items-start">
                    {session.days && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-600">Days:</span>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(session.days) ? session.days : session.days.split(',')).map((day: string, index: number) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"
                            >
                              {weekDays.find(wd => wd.value === day.trim())?.short || day.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {session.description && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 italic line-clamp-1">
                          "{session.description}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 ml-4">
                  <Button
                    onClick={() => handleViewSession(session)}
                    variant="outline-primary"
                    size="sm"
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 rounded-md font-semibold whitespace-nowrap"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    onClick={() => handleEditSession(session)}
                    variant="outline-primary"
                    size="sm"
                    className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 rounded-md font-semibold whitespace-nowrap"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteSession(session)}
                    variant="danger"
                    size="sm"
                    className="text-xs px-2.5 py-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-400 transition-all duration-200 rounded-md font-semibold whitespace-nowrap"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSessions.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {searchTerm ? 'No sessions found' : 'No sessions yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search criteria to find what you\'re looking for'
              : 'Get started by creating your first training session to organize your curriculum'
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={handleCreateSession} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Create First Session
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Session' : 'Edit Session'}
      >
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-inner">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Session Information Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Session Information</h3>
              </div>
              
              <div className="space-y-6">
                {/* Session Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Session Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter session title"
                    error={formErrors.title}
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>

                {/* Status and Times Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-800 font-medium"
                    >
                      <option value="active"> Active</option>
                      <option value="pending"> Pending</option>
                      <option value="completed"> Completed</option>
                      <option value="cancelled"> Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      error={formErrors.startTime}
                      className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      error={formErrors.endTime}
                      className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Group *
                  </label>
                  <select
                    value={formData.groupeId}
                    onChange={(e) => handleInputChange('groupeId', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-800 font-medium ${
                      formErrors.groupeId ? 'border-red-300 focus:border-red-400' : 'border-gray-200'
                    }`}
                    disabled={loadingDropdowns}
                  >
                    <option value="">Select a group...</option>
                    {Array.isArray(groupes) && groupes.length > 0 ? (
                      groupes.map((groupe) => (
                        <option key={groupe.id} value={groupe.id}>
                          {groupe.name} - {groupe.formationTitle} ({groupe.learnerCount}/{groupe.capaciteMax})
                        </option>
                      ))
                    ) : (
                      <option disabled>No groups available</option>
                    )}
                  </select>
                  {formErrors.groupeId && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.groupeId}</p>
                  )}
                  {loadingDropdowns && (
                    <p className="mt-2 text-sm text-gray-500 font-medium">Loading groups...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Trainer *
                  </label>
                  <select
                    value={formData.formateurId}
                    onChange={(e) => handleInputChange('formateurId', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-100 border rounded-lg text-gray-600 font-medium cursor-not-allowed ${
                      formErrors.formateurId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={true}
                  >
                    <option value="">Select a trainer...</option>
                    {Array.isArray(formateurs) && formateurs.length > 0 ? (
                      formateurs.map((formateur) => (
                        <option key={formateur.id} value={formateur.id}>
                          {formateur.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No trainers available</option>
                    )}
                  </select>
                  {formErrors.formateurId && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.formateurId}</p>
                  )}
                  <p className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-md">
                    💡 Trainer is auto-selected when you choose a group
                  </p>
                </div>
              </div>
            </div>

            {/* Training Days Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Training Schedule</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">
                  Select Training Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weekDays.map((day) => (
                    <label 
                      key={day.value} 
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 min-h-[80px] ${
                        formData.days.includes(day.value)
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 text-blue-800 shadow-lg'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.days.includes(day.value)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...formData.days, day.value]
                            : formData.days.filter(d => d !== day.value);
                          setFormData(prev => ({ ...prev, days: newDays }));
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mb-2"
                      />
                      <span className="text-sm font-bold uppercase tracking-wide text-center">{day.short}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 font-medium">
                    📅 Select the days when this training session will be held during the week
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline-primary"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-3 font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  modalMode === 'create' ? '✨ Create Session' : '💾 Update Session'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Session Details"
      >
        {selectedSession && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedSession.title}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedSession.status)}`}>
                {selectedSession.status}
              </span>
            </div>

            {selectedSession.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedSession.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(selectedSession.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}</span>
                  </div>
                  {selectedSession.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedSession.location}</span>
                    </div>
                  )}
                  {selectedSession.days && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedSession.days) ? selectedSession.days : selectedSession.days.split(',')).map((day: string, index: number) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 shadow-sm"
                          >
                            {weekDays.find(wd => wd.value === day.trim())?.label || day.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Participants</h4>
                <div className="space-y-2">
                  {selectedSession.groupName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Group: {selectedSession.groupName}</span>
                    </div>
                  )}
                  {selectedSession.trainerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>Trainer: {selectedSession.trainerName}</span>
                    </div>
                  )}
                  {selectedSession.maxParticipants && (
                    <div className="text-sm">
                      <span className="text-gray-700">Capacity:</span> {selectedSession.currentParticipants || 0} / {selectedSession.maxParticipants}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedSession.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-gray-600">{selectedSession.notes}</p>
              </div>
            )}

            {(selectedSession.createdAt || selectedSession.updatedAt) && (
              <div className="pt-4 border-t text-xs text-gray-500">
                {selectedSession.createdAt && (
                  <p>Created: {new Date(selectedSession.createdAt).toLocaleString()}</p>
                )}
                {selectedSession.updatedAt && (
                  <p>Updated: {new Date(selectedSession.updatedAt).toLocaleString()}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditSession(selectedSession);
                }}
                variant="outline-primary"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Session
              </Button>
              <Button
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sessions;
