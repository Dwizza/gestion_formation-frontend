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
  joinDate: date;
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

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  type: 'payment' | 'attendance' | 'general';
  date: string;
  status: 'sent' | 'failed' | 'pending';
}