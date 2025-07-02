import { useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour rafraîchir périodiquement les notifications
 * afin de maintenir le compteur à jour dans le sidebar
 */
export const useNotificationRefresh = (
  loadNotifications: () => Promise<void>,
  intervalMs: number = 30000 // 30 secondes par défaut
) => {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Charger immédiatement
    // loadNotifications();

    // Puis rafraîchir périodiquement
    intervalRef.current = setInterval(() => {
      loadNotifications();
    }, intervalMs);

    // Nettoyer l'interval au démontage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadNotifications, intervalMs]);

  // Nettoyer l'interval si le composant est démonté
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
