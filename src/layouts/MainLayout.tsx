// src/layouts/MainLayout.tsx
import React, { ReactNode } from 'react';
import { SidebarProvider } from '../contexts/SidebarContext';
import Sidebar from '../components/ui/Sidebar';
import { useNotificationToast } from '../hooks/useNotificationToast';

interface MainLayoutProps {
  userRole: 'ADMIN' | 'TRAINER';
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ userRole, children }) => {
  // Initialize notification toast monitoring
  useNotificationToast();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Use your new Sidebar component */}
        <Sidebar userRole={userRole} />
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;