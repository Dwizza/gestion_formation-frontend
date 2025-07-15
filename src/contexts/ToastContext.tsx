import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastProps } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  showNotificationToast: (title: string, message: string) => void;
  showTestToast: () => void; // For testing purposes
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id,
      onClose: removeToast
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showNotificationToast = (title: string, message: string) => {
    showToast({
      title,
      message,
      type: 'info',
      duration: 10000 // 10 seconds as requested
    });
  };

  const showTestToast = () => {
    showToast({
      title: "Test Notification",
      message: "Notification wslatni! This is a test notification that lasts 10 seconds.",
      type: 'info',
      duration: 10000
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showNotificationToast, showTestToast }}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
