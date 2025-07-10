// src/pages/Routes/AppRoutes.tsx
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SidebarProvider } from '../../contexts/SidebarContext';
import LoginPage from '../auth/LoginPage';
import Debug from '../Debug';
import PresidentLoginPage from '../auth/PresidentLoginPage';
import PresidentDashboard from '../President/PresidentDashboard';
import SignupPage from '../auth/Signup';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import PresidentRoute from '../../components/auth/PresidentRoute';

import MainLayout from '../../layouts/MainLayout';

// Admin pages
import AdminDashboard from '../admin/Dashboard';
import AdminTrainings from '../admin/Trainings';
import AdminGroups from '../admin/Groups';
import AdminLearners from '../admin/Learners';
import AdminAttendance from '../admin/Attendance';
import AdminPayments from '../admin/Payments';
import AdminNotifications from '../admin/Notifications';
import OverduePayments from '../admin/OverduePayments';

// Trainer pages
import TrainerDashboard from '../trainer/Dashboard';
import TrainerGroups from '../trainer/Groups';
import TrainerAttendance from '../trainer/Attendance';
import SessionPlanning from '../trainer/SessionPlanning';
import AttendanceHistory from '../trainer/AttendanceHistory';

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("Current route:", location.pathname);
  }, [location]);

  return (
    <Routes>
      {/* Debug route - accessible without auth */}
      <Route path="/debug" element={<Debug />} />

      {/* President routes */}
      <Route path="/president" element={<PresidentLoginPage />} />
      
      {/* President dashboard routes - now using PresidentRoute for all president paths */}
      <Route 
        path="/president/dashboard" 
        element={
          <PresidentRoute>
            <PresidentDashboard />
          </PresidentRoute>
        } 
      />
      
      <Route 
        path="/president/accounts" 
        element={
          <PresidentRoute>
            <PresidentDashboard />
          </PresidentRoute>
        } 
      />
      
      <Route 
        path="/president/sessions" 
        element={
          <PresidentRoute>
            <PresidentDashboard />
          </PresidentRoute>
        } 
      />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Default route redirects to president login */}
      <Route path="/" element={<Navigate to="/president" replace />} />

      {/* Admin routes with MainLayout wrapper */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <MainLayout userRole="ADMIN">
              <Outlet />
            </MainLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="trainings" element={<AdminTrainings />} />
        <Route path="groups" element={<AdminGroups />} />
        <Route path="learners" element={<AdminLearners />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="overdue-payments" element={<OverduePayments />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      {/* Trainer routes with MainLayout wrapper */}
      <Route
        path="/trainer"
        element={
          <ProtectedRoute allowedRole="TRAINER">
            <MainLayout userRole="TRAINER">
              <Outlet />
            </MainLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<TrainerDashboard />} />
        <Route path="groups" element={<TrainerGroups />} />
        <Route path="attendance" element={<TrainerAttendance />} />
        <Route path="attendancehistory" element={<AttendanceHistory />} />
        <Route path="sessions" element={<SessionPlanning />} />
      </Route>

      {/* Catch all other routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;