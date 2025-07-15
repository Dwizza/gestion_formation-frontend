import React, { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle } from 'lucide-react';

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 10000, // 10 seconds
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto hide after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for exit animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className={`
        rounded-lg border shadow-lg p-4
        ${getColorClasses()}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
            <p className="mt-1 text-sm opacity-90">
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-white bg-opacity-30 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all ease-linear
              ${type === 'success' ? 'bg-green-600' : 
                type === 'warning' ? 'bg-yellow-600' : 
                type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
            `}
            style={{
              width: '100%',
              transform: isVisible ? 'scaleX(0)' : 'scaleX(1)',
              transformOrigin: 'left',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
