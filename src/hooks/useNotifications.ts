import { useState } from 'react';
import { 
  getAllNotifications, 
  getNotificationsByType, 
  getUrgentNotifications,
  getNotificationsByLearner,
  getUnreadNotificationsByLearner,
  getNotificationCountByLearner,
  sendPaymentReminder
} from '../api/apiService';
import type { NotificationWithLearner } from '../models/types';

// Fonction utilitaire pour vérifier si une notification est lue
// Gère les deux formats: boolean (true/false) et number (1/0)
const isNotificationRead = (luValue: boolean | number): boolean => {
  if (typeof luValue === 'boolean') {
    return luValue; // true = lue, false = non lue
  }
  return luValue === 1; // 1 = lue, 0 = non lue
};

// Hook personnalisé pour gérer les notifications
export const useNotifications = () => {
  const [allNotifications, setAllNotifications] = useState<NotificationWithLearner[]>([]);
  const [notifications, setNotifications] = useState<NotificationWithLearner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<{
    type?: string;
    urgent?: boolean;
    unread?: boolean;
  }>({});

  // Fonction utilitaire pour appliquer les filtres
  const applyFilters = (data: NotificationWithLearner[], filters = currentFilter) => {
    let filtered = [...data];

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.urgent) {
      filtered = filtered.filter(n => n.urgente);
    }

    if (filters.unread) {
      filtered = filtered.filter(n => !isNotificationRead(n.lu));
    }

    return filtered;
  };

  // Fonction pour charger toutes les notifications
  const loadAllNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllNotifications();
      setAllNotifications(data);
      // Réinitialiser les filtres et afficher toutes les notifications
      setCurrentFilter({});
      setNotifications(data);
    } catch (err) {
      setError('Erreur lors du chargement des notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour filtrer par type localement (sans reload)
  const filterByTypeLocally = (type: string | null) => {
    if (type === null) {
      // Réinitialiser le filtre de type
      const newFilter = { ...currentFilter };
      delete newFilter.type;
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    } else {
      const newFilter = { ...currentFilter, type };
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    }
  };

  // Fonction pour filtrer les notifications urgentes localement
  const filterUrgentLocally = (urgent: boolean) => {
    if (urgent) {
      const newFilter = { ...currentFilter, urgent: true };
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    } else {
      const newFilter = { ...currentFilter };
      delete newFilter.urgent;
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    }
  };

  // Fonction pour filtrer les notifications non lues localement
  const filterUnreadLocally = (unread: boolean) => {
    if (unread) {
      const newFilter = { ...currentFilter, unread: true };
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    } else {
      const newFilter = { ...currentFilter };
      delete newFilter.unread;
      setCurrentFilter(newFilter);
      const filtered = applyFilters(allNotifications, newFilter);
      setNotifications(filtered);
    }
  };

  // Fonction pour réinitialiser tous les filtres
  const clearFilters = () => {
    setCurrentFilter({});
    setNotifications(allNotifications);
  };

  // Fonction pour charger les notifications par type (garde l'ancienne méthode pour compatibilité)
  const loadNotificationsByType = async (type: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationsByType(type);
      setAllNotifications(data);
      setNotifications(data);
      setCurrentFilter({ type });
    } catch (err) {
      setError(`Erreur lors du chargement des notifications de type ${type}`);
      console.error('Error loading notifications by type:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les notifications urgentes
  const loadUrgentNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUrgentNotifications();
      setAllNotifications(data);
      setNotifications(data);
      setCurrentFilter({ urgent: true });
    } catch (err) {
      setError('Erreur lors du chargement des notifications urgentes');
      console.error('Error loading urgent notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les notifications d'un apprenant
  const loadNotificationsByLearner = async (apprenantId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationsByLearner(apprenantId);
      setAllNotifications(data);
      setNotifications(data);
      setCurrentFilter({});
    } catch (err) {
      setError(`Erreur lors du chargement des notifications de l'apprenant ${apprenantId}`);
      console.error('Error loading notifications by learner:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les notifications non lues d'un apprenant
  const loadUnreadNotificationsByLearner = async (apprenantId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUnreadNotificationsByLearner(apprenantId);
      setAllNotifications(data);
      setNotifications(data);
      setCurrentFilter({ unread: true });
    } catch (err) {
      setError(`Erreur lors du chargement des notifications non lues de l'apprenant ${apprenantId}`);
      console.error('Error loading unread notifications by learner:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compter les notifications d'un apprenant
  const getNotificationCount = async (apprenantId: number) => {
    try {
      setLoading(true);
      setError(null);
      const count = await getNotificationCountByLearner(apprenantId);
      return count;
    } catch (err) {
      setError(`Erreur lors du comptage des notifications de l'apprenant ${apprenantId}`);
      console.error('Error counting notifications by learner:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer un rappel de paiement
  const sendReminderToLearner = async (apprenantId: number) => {
    try {
      setLoading(true);
      setError(null);
      await sendPaymentReminder(apprenantId);
      return true;
    } catch (err) {
      setError(`Erreur lors de l'envoi du rappel à l'apprenant ${apprenantId}`);
      console.error('Error sending payment reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer une notification comme lue localement
  const markAsReadLocally = (id: number) => {
    // Mettre à jour allNotifications
    setAllNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, lu: true } : notif
      );
      return updated;
    });
    
    // Mettre à jour notifications avec les filtres appliqués
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, lu: true } : notif
      );
      // Si on a un filtre "unread", on doit re-appliquer les filtres
      if (currentFilter.unread) {
        return applyFilters(updated, currentFilter);
      }
      return updated;
    });
  };

  // Statistiques des notifications
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !isNotificationRead(n.lu)).length, // Utilise la fonction utilitaire
    urgent: notifications.filter(n => n.urgente).length,
    byType: notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: notifications.reduce((acc, notif) => {
      acc[notif.statut] = (acc[notif.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    notifications,
    loading,
    error,
    stats,
    currentFilter,
    loadAllNotifications,
    loadNotificationsByType,
    loadUrgentNotifications,
    loadNotificationsByLearner,
    loadUnreadNotificationsByLearner,
    getNotificationCount,
    sendReminderToLearner,
    markAsReadLocally,
    filterByTypeLocally,
    filterUrgentLocally,
    filterUnreadLocally,
    clearFilters,
    setNotifications,
    setError
  };
};
