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
  const [notifications, setNotifications] = useState<NotificationWithLearner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger toutes les notifications
  const loadAllNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllNotifications();
      setNotifications(data);
    } catch (err) {
      setError('Erreur lors du chargement des notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les notifications par type
  const loadNotificationsByType = async (type: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationsByType(type);
      setNotifications(data);
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
      setNotifications(data);
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
      setNotifications(data);
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
      setNotifications(data);
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
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, lu: true } : notif // Utilise true car l'API renvoie des booleans
    ));
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
    loadAllNotifications,
    loadNotificationsByType,
    loadUrgentNotifications,
    loadNotificationsByLearner,
    loadUnreadNotificationsByLearner,
    getNotificationCount,
    sendReminderToLearner,
    markAsReadLocally,
    setNotifications,
    setError
  };
};
