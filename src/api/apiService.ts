// src/services/apiService.ts
import { api } from '../contexts/AuthContext';

// Define TypeScript interfaces for better type safety
interface Formation {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  price?: number;
  status?: string;
  dateDebut?: string;
  dateFin?: string;
}

interface Groupe {
  id?: number;
  name: string;
  capaciteMax: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  formationId: number;
  formationTitle?: string;
  learnerCount?: number;
  formateurId?: number; // Added this field to track the trainer assigned to the group
}

interface AttendanceSummary {
  totalRecords: number;
  present: number;
  absent: number;
  presentRate: number;
}

// Session interface to match TrainerSessions.tsx
interface Session {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  formateurId: number;
  groupeId: number;
  attendanceRecorded?: boolean;
  status?: string;
}

// AttendanceRecord interface to match TrainerSessions.tsx
interface AttendanceRecord {
  id?: number;
  date: string;
  statut: string;
  apprenantId: number;
  apprenantNom?: string;
  sessionId?: number;
  groupeId?: number; // Added this field to track group for each attendance record
}

// Payment interface for better type safety
interface Payment {
  id?: number;
  apprenantId: number;
  formationId?: number;
  montant: number;
  datePaiement?: string;
  statut?: string;
  apprenant?: {
    id: number;
    nom: string;
    prenom: string;
  };
  formation?: {
    id: number;
    title: string;
  };
}

// User interface for better type safety
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
}

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  register: (userData: { 
    email: string; 
    password: string; 
    nom: string; 
    prenom: string; 
    role: string;
    telephone?: string;
  }) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => {
    localStorage.removeItem('tweadup_user');
    delete api.defaults.headers.common.Authorization;
    return Promise.resolve();
  },
};

// President API - Updated with direct access to admin and formateur endpoints
export const presidentAPI = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/president/login', credentials),
  
  // Get users (admins and trainers)
  getUsers: (role?: string) => {
    const endpoint = role && role !== 'ALL' 
      ? `/president/users?role=${role}` 
      : '/president/users';
    return api.get(endpoint);
  },
  
  // Create account (admin or trainer)
  createAccount: (userData: { 
    email: string; 
    motDePasse: string; 
    nom: string; 
    role: string;
  }) => {
    return api.post('/president/create-account', userData);
  },
  
  // Delete user account
  deleteUser: (userId: number) => {
    return api.delete(`/president/${userId}`);
  },
  
  // Update user status (if needed in the future)
  updateUserStatus: (userId: number, active: boolean) => {
    return api.put(`/president/users/${userId}/status`, { active });
  },
  
  // Reset password (if needed in the future)
  resetPassword: (userId: number) => {
    return api.post(`/president/users/${userId}/reset-password`);
  },
  
  logout: () => {
    localStorage.removeItem('tweadup_president');
    delete api.defaults.headers.common.Authorization;
    return Promise.resolve();
  },
};

// Admin API - Fixed paths by removing redundant /api prefix
export const adminAPI = {
  getAll: () => api.get('/admin'),
  getById: (id: string) => api.get(`/admin/${id}`),
  create: (data: any) => api.post('/admin', data),
  update: (id: string, data: any) => api.put(`/admin/${id}`, data),
  delete: (id: string) => api.delete(`/admin/${id}`),
};

// Trainer API - Fixed paths by removing redundant /api prefix
export const formateurAPI = {
  getAll: () => api.get('/formateurs'),
  getById: (id: string) => api.get(`/formateurs/${id}`),
  create: (data: any) => api.post('/formateurs', data),
  update: (id: string, data: any) => api.put(`/formateurs/${id}`, data),
  delete: (id: string) => api.delete(`/formateurs/${id}`),
};

// Formation API - Fixed paths by removing redundant /api prefix
export const formationAPI = {
  getAll: () => api.get('/formations'),
  getById: (id: string) => api.get(`/formations/${id}`),
  create: (data: Formation) => api.post('/formations', data),
  update: (id: string, data: Formation) => api.put(`/formations/${id}`, data),
  delete: (id: string) => api.delete(`/formations/${id}`),
};

// Group API with proper typing - Fixed paths by removing redundant /api prefix
export const groupeAPI = {
  getAll: () => api.get('/groupes'),
  getById: (id: string) => api.get(`/groupes/${id}`),
  create: (data: Groupe) => api.post('/groupes', data),
  update: (id: string, data: Groupe) => api.put(`/groupes/${id}`, data),
  delete: (id: string) => api.delete(`/groupes/${id}`),
  // Fix for getByFormateur - with proper error handling
  getByFormateur: async (formateurId: string) => {
    try {
      // Try the original endpoint first
      return await api.get(`/groupes/formateur/${formateurId}`);
    } catch (error) {
      console.log('Groups by formateur endpoint not available, using fallback');
      
      // Fallback: Get all groups and filter by formateur ID
      const response = await api.get('/groupes');
      let allGroups: Groupe[] = [];
      
      if (Array.isArray(response.data)) {
        allGroups = response.data;
      } else if (response.data && response.data._embedded && Array.isArray(response.data._embedded.groupes)) {
        allGroups = response.data._embedded.groupes;
      }
      
      // Filter groups that belong to this trainer
      const formateurGroups = allGroups.filter(group => 
        group.formateurId === Number(formateurId)
      );
      
      return {
        data: formateurGroups
      };
    }
  },
  getByFormation: (formationId: string) => api.get(`/groupes/formation/${formationId}`),
};

// Apprenant API - Fixed paths by removing redundant /api prefix
export const apprenantAPI = {
  getAll: () => api.get('/apprenants'),
  getById: (id: string) => api.get(`/apprenants/${id}`),
  create: (data: any) => api.post('/apprenants', data),
  update: (id: string, data: any) => api.put(`/apprenants/${id}`, data),
  delete: (id: string) => api.delete(`/apprenants/${id}`),
  getByGroupe: (groupeId: string) => api.get(`/apprenants/groupe/${groupeId}`),
};

// Session API - Fixed paths by removing redundant /api prefix
export const sessionAPI = {
  create: (session: Session) => api.post('/sessions', session),
  
  // Fix for getAll - use POST if GET is not allowed
  getAll: async () => {
    try {
      // Try GET first
      return await api.get('/sessions');
    } catch (error: any) {
      // If Method Not Allowed (405), try POST
      if (error.response && error.response.status === 405) {
        console.log('GET not allowed for /sessions, trying POST');
        return await api.post('/sessions/search', {});
      }
      throw error;
    }
  },
  
  getById: (id: string) => api.get(`/sessions/${id}`),
  
  // Fix for getByFormateur with fallback and better error handling
  getByFormateur: async (formateurId: string) => {
    try {
      // Try the original GET endpoint first
      return await api.get(`/sessions/formateur/${formateurId}`);
    } catch (error: any) {
      // If endpoint not found, try alternative endpoints
      if (error.response && error.response.status === 404) {
        try {
          // Try a POST search endpoint if available
          console.log('Sessions by formateur GET endpoint not found, trying POST search');
          return await api.post('/sessions/search', { formateurId: Number(formateurId) });
        } catch (searchError) {
          console.log('POST search endpoint not available, fetching from all sessions');
          
          // Get all sessions as fallback and filter
          const allSessions = await sessionAPI.getAll();
          
          // Filter sessions for this formateur
          const formateurSessions = allSessions.data.filter((session: Session) => 
            session.formateurId === Number(formateurId)
          );
          
          return {
            data: formateurSessions
          };
        }
      } else {
        // For other types of errors, just get all sessions and filter
        console.log('Error accessing formateur sessions, fetching all sessions instead');
        
        const allSessions = await sessionAPI.getAll();
        
        // Filter sessions for this formateur
        const formateurSessions = allSessions.data.filter((session: Session) => 
          session.formateurId === Number(formateurId)
        );
        
        return {
          data: formateurSessions
        };
      }
    }
  },
  
  filter: async ({ formateurId, startDate, endDate }: { formateurId: number, startDate: string, endDate: string }) => {
    try {
      return await api.get(`/sessions/formateur/${formateurId}/dateRange`, {
        params: { startDate, endDate },
      });
    } catch (error) {
      console.log('Sessions date range endpoint not available, fetching from all sessions');
      
      // Fallback: Get all sessions and filter manually
      const response = await sessionAPI.getAll();
      
      // Filter sessions by formateur ID and date range
      const filteredSessions = response.data.filter((session: Session) => {
        const sessionDate = new Date(session.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return (
          session.formateurId === formateurId &&
          sessionDate >= start &&
          sessionDate <= end
        );
      });
      
      return {
        data: filteredSessions
      };
    }
  },
  
  // Fix for getAttendance with fallback mechanism and additional endpoints to try
  getAttendance: async (sessionId: string) => {
    try {
      // Try the original endpoint first
      return await api.get(`/presences/filter`, {
        params: { sessionId },
      });
    } catch (error) {
      // Try alternative endpoints
      try {
        console.log('First attendance endpoint failed, trying /sessions/{id}/presences');
        return await api.get(`/sessions/${sessionId}/presences`);
      } catch (error2) {
        console.log('Session specific attendance endpoints not available, fetching from all attendance records');
        
        // If all direct endpoints fail, create our own filtered list from all attendance records
        const response = await presenceAPI.getAll();
        
        // Filter attendance records for this session
        const sessionAttendance = response.data.filter((record: AttendanceRecord) => 
          record.sessionId === Number(sessionId)
        );
        
        return {
          data: sessionAttendance
        };
      }
    }
  }
};

// Attendance API - Fixed paths by removing redundant /api prefix
export const presenceAPI = {
  getAll: () => api.get('/presences'),
  getById: (id: string) => api.get(`/presences/${id}`),
  getByGroupe: (groupeId: string, date: string) => 
    api.get(`/presences/groupe/${groupeId}?date=${date}`),
  getByApprenant: (apprenantId: string) => 
    api.get(`/presences/apprenant/${apprenantId}`),
  getSummary: () => api.get('/presences/summary'),
  
  // New method to get attendance by formateur
  getByFormateur: async (formateurId: string) => {
    try {
      // Try direct endpoint first
      return await api.get(`/presences/formateur/${formateurId}`);
    } catch (error) {
      console.log('Attendance by formateur endpoint not available, building from sessions and groups');
      
      try {
        // Get trainer's groups
        const groupsResponse = await groupeAPI.getByFormateur(formateurId);
        const trainerGroups = groupsResponse.data;
        
        if (!trainerGroups || trainerGroups.length === 0) {
          return { data: [] };
        }
        
        // Get all attendance records
        const allPresenceResponse = await presenceAPI.getAll();
        let allPresence = [];
        
        if (Array.isArray(allPresenceResponse.data)) {
          allPresence = allPresenceResponse.data;
        } else if (allPresenceResponse.data && allPresenceResponse.data._embedded && 
          Array.isArray(allPresenceResponse.data._embedded.presences)) {
          allPresence = allPresenceResponse.data._embedded.presences;
        }
        
        // Filter attendance for groups that belong to this trainer
        const trainerGroupIds = trainerGroups.map(group => group.id);
        const trainerAttendance = allPresence.filter((record: AttendanceRecord) => 
          record.groupeId && trainerGroupIds.includes(record.groupeId)
        );
        
        return {
          data: trainerAttendance
        };
      } catch (error) {
        console.error('Error building attendance by formateur:', error);
        return { data: [] };
      }
    }
  },
  
  filter: (date?: string, apprenantId?: number, groupeId?: number) => {
    let url = '/presences/filter?';
    const params = [];
    
    // Ensure date is in the format YYYY-MM-DD if it's provided
    if (date) {
      // Check if the date is just year-month format
      if (date.match(/^\d{4}-\d{2}$/)) {
        // Add day component to make it a full date
        date = `${date}-01`;
      }
      params.push(`date=${date}`);
    }
    
    if (apprenantId) params.push(`apprenantId=${apprenantId}`);
    if (groupeId) params.push(`groupeId=${groupeId}`);
    
    // Handle the case when no params are provided
    if (params.length === 0) {
      return api.get('/presences');
    }
    
    return api.get(url + params.join('&'));
  },
  create: (data: any) => api.post('/presences', data),
  update: (id: string, data: any) => api.put(`/presences/${id}`, data),
  bulkCreate: (presences: AttendanceRecord[]) => api.post('/presences/bulk', presences),
};

// Payment API - Fixed paths by removing redundant /api prefix
export const paiementAPI = {
  getAll: () => api.get('/paiements'),
  getById: (id: string) => api.get(`/paiements/${id}`),
  create: (data: Payment) => api.post('/paiements', data),
  update: (id: string, data: Payment) => api.put(`/paiements/${id}`, data),
  getByApprenant: (apprenantId: string) => api.get(`/paiements/apprenant/${apprenantId}`),
  
  // Add fallback mechanism for getNonPayes
  getNonPayes: async () => {
    try {
      // Try the original endpoint first
      return await api.get('/paiements/non-payes');
    } catch (error) {
      console.log('Non-payes endpoint not available, filtering from all payments');
      
      // If it fails, create our own filtered list from all payments
      const response = await api.get('/paiements');
      
      // Filter unpaid payments (status not 'PAID' or no payment date)
      const unpaidPayments = response.data.filter((payment: Payment) => 
        !payment.datePaiement || payment.statut === 'PENDING' || payment.statut === 'UNPAID'
      );
      
      return {
        data: unpaidPayments
      };
    }
  }
};

// Notification API - Fixed paths by removing redundant /api prefix
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getById: (id: string) => api.get(`/notifications/${id}`),
  create: (data: any) => api.post('/notifications', data),
  markAsRead: (id: string) => api.put(`/notifications/${id}/vue`, {}),
  sendPaymentReminders: () => api.post('/notifications/rappels-paiement', {}),
  getByDestinataire: (destinataireId: string) => 
    api.get(`/notifications/destinataire/${destinataireId}`),
};

// Dashboard API - Fixed paths by removing redundant /api prefix
export const dashboardAPI = {
  getAdminStats: async () => {
    try {
      // Try the original endpoint first
      return await api.get('/dashboard/admin');
    } catch (error) {
      // If it fails, create our own stats from other endpoints
      console.log('Dashboard endpoint not available, building stats from other endpoints');
      
      // Get data from various endpoints
      const [learnersResponse, trainingsResponse, groupsResponse, paymentsResponse] = await Promise.all([
        apprenantAPI.getAll(),
        formationAPI.getAll(),
        groupeAPI.getAll(),
        paiementAPI.getAll()
      ]);
      
      // Calculate derived statistics
      const activeTrainings = trainingsResponse.data.filter((t: any) => t.status === 'ACTIVE').length;
      const activeGroups = groupsResponse.data.filter((g: any) => g.status === 'ACTIVE').length;
      
      // Simulate unpaid payments
      const unpaidPayments = paymentsResponse.data.filter((p: any) => 
        !p.datePaiement || p.statut === 'PENDING' || p.statut === 'UNPAID'
      ).length;
      
      return {
        data: {
          totalLearners: learnersResponse.data.length,
          activeTrainings,
          activeGroups,
          unpaidPayments,
          // Add other stats as needed
        }
      };
    }
  },
  getFormateurStats: async (formateurId: string) => {
    try {
      return await api.get(`/dashboard/formateur/${formateurId}`);
    } catch (error) {
      // Implement fallback logic similar to getAdminStats if needed
      console.log('Formateur dashboard endpoint not available');
      throw error;
    }
  }
};

// Define and export list view rendering function needed by TrainerSessions.tsx
export const renderAttendanceList = () => {
  // This is a placeholder function that should be implemented in the component
  // It's referenced in TrainerSessions.tsx but never defined
  return null;
};

// Export interfaces for use in components
export type { 
  Formation, 
  Groupe, 
  AttendanceSummary, 
  Payment, 
  User, 
  Session, 
  AttendanceRecord 
};