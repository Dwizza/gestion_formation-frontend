import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { getNotificationCountByLearner, getUnreadNotificationsByLearner } from '../../api/apiService';

interface NotificationCounterProps {
  apprenantId: number;
  showUnreadOnly?: boolean;
  className?: string;
}

const NotificationCounter: React.FC<NotificationCounterProps> = ({
  apprenantId,
  showUnreadOnly = false,
  className = ''
}) => {
  const [count, setCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCounts();
  }, [apprenantId]);

  const loadCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (showUnreadOnly) {
        // Charger seulement les notifications non lues
        const unreadNotifications = await getUnreadNotificationsByLearner(apprenantId);
        setUnreadCount(unreadNotifications.length);
      } else {
        // Charger le total et les non lues
        const [totalCount, unreadNotifications] = await Promise.all([
          getNotificationCountByLearner(apprenantId),
          getUnreadNotificationsByLearner(apprenantId)
        ]);
        
        setCount(totalCount);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (err) {
      setError('Erreur lors du chargement du compteur');
      console.error('Error loading notification counts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Bell className="h-4 w-4 animate-pulse text-gray-400" />
        <span className="text-sm text-gray-400">...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-500">Erreur</span>
      </div>
    );
  }

  const displayCount = showUnreadOnly ? unreadCount : count;
  const hasUnread = unreadCount > 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Bell className={`h-4 w-4 ${hasUnread ? 'text-blue-600' : 'text-gray-500'}`} />
      <span className={`text-sm font-medium ${hasUnread ? 'text-blue-600' : 'text-gray-600'}`}>
        {displayCount}
      </span>
      {!showUnreadOnly && hasUnread && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
          {unreadCount} non lues
        </span>
      )}
    </div>
  );
};

export default NotificationCounter;
