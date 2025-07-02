// User types
export type UserRole = 'ADMIN' | 'TRAINER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

// Training types
export interface Training {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  status: 'active' | 'inactive' | 'upcoming';
}

// Group types
export interface Group {
  id: string;
  name: string;
  trainingId: string;
  trainingName: string;
  startDate: string;
  endDate: string;
  learnerCount: number;
  trainerId: string;
  trainerName: string;
  status: 'active' | 'completed' | 'pending';
}

// Learner types
export interface Learner {
  id: string;
  name: string;
  email: string;
  joinDate: Date;
  phone: string;
  address?: string;
  registrationDate: string;
  groupIds: string[];
  status: 'active' | 'inactive';
}

// Attendance types
export interface AttendanceRecord {
  id: string;
  learnerId: string;
  learnerName: string;
  groupId: string;
  groupName: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
}

export interface AttendanceSubmission {
  groupId: string;
  date: string;
  records: {
    learnerId: string;
    status: 'present' | 'absent' | 'excused';
    notes?: string;
  }[];
}

// Payment types
export interface Payment {
  id: string;
  learnerId: string;
  learnerName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial';
  notes?: string;
}

// Notification types - Interface pour les notifications du backend
export interface Notification {
  id: number;
  titre: string; // Titre de la notification
  message: string; // Contenu du message
  apprenantId: number; // ID de l'apprenant destinataire
  type: 'PAYMENT' | 'ATTENDANCE' | 'GENERAL' | 'REMINDER' | 'URGENT'; // Type de notification
  dateCreation: string; // Date de création (ISO string)
  dateEnvoi?: string; // Date d'envoi (optionnelle)
  lu: number; // Statut de lecture (1 = lue, 0 = non lue) - correspond à la DB
  urgente: boolean; // Notification urgente ou normale
  statut: 'ENVOYE' | 'EN_ATTENTE' | 'ECHEC'; // Statut d'envoi
}

// Interface pour l'affichage des notifications dans l'admin
export interface NotificationWithLearner {
  id: number;
  titre: string;
  message: string;
  apprenantId: number;
  apprenantNom?: string; // Nom de l'apprenant (si disponible)
  apprenantEmail?: string; // Email de l'apprenant (si disponible)
  type: string;
  dateCreation: string;
  dateEnvoi?: string;
  lu: boolean | number; // Accepte les deux formats: boolean (API) ou number (DB)
  urgente: boolean;
  statut: string;
}