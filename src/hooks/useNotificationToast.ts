import { useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getAllNotifications } from '../api/apiService';

/**
 * Hook to monitor for new notifications and show toast alerts
 * Checks for new notifications every 30 seconds and shows a toast for each new one
 */
export const useNotificationToast = () => {
  const { showNotificationToast } = useToast();
  const lastCheckRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkForNewNotifications = async () => {
    try {
      const notifications = await getAllNotifications();
      const currentTime = new Date();
      
      // Filter notifications that were created after our last check
      const newNotifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.dateCreation);
        return notificationDate > lastCheckRef.current;
      });

      // Show toast for each new notification
      newNotifications.forEach(notification => {
        showNotificationToast(
          notification.titre,
          notification.message
        );
      });

      // Update last check time
      lastCheckRef.current = currentTime;
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  useEffect(() => {
    // Check immediately (but don't show toasts for existing notifications)
    lastCheckRef.current = new Date();
    
    // Start checking every 30 seconds
    intervalRef.current = setInterval(checkForNewNotifications, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { checkForNewNotifications };
};
