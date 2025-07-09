import React from 'react';
import Button from '../ui/Button';
import { AlertTriangle, Eye, Calendar, User } from 'lucide-react';
import type { NotificationWithLearner } from '../../models/types';

interface NotificationItemProps {
  notification: NotificationWithLearner;
  onMarkAsRead: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  // Fonction utilitaire pour vérifier si une notification est lue
  // Gère les deux formats: boolean (true/false) et number (1/0)
  const isNotificationRead = (luValue: boolean | number): boolean => {
    if (typeof luValue === 'boolean') {
      return luValue; // true = lue, false = non lue
    }
    return luValue === 1; // 1 = lue, 0 = non lue
  };

  // Fonction pour obtenir la couleur du badge selon le type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bg-green-100 text-green-800';
      case 'ATTENDANCE': return 'bg-blue-100 text-blue-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'REMINDER': return 'bg-yellow-100 text-yellow-800';
      case 'GENERAL': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case 'ENVOYE': return 'bg-green-100 text-green-800';
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      case 'ECHEC': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir le texte du type en français
  const getTypeText = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'Payment';
      case 'ATTENDANCE': return 'Attendance';
      case 'URGENT': return 'Urgent';
      case 'REMINDER': return 'Reminder';
      case 'GENERAL': return 'General';
      default: return type;
    }
  };

  // Fonction pour obtenir le texte du statut en français
  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'ENVOYE': return 'Sent';
      case 'EN_ATTENTE': return 'Pending';
      case 'ECHEC': return 'Failed';
      default: return statut;
    }
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-4 border rounded-lg ${
      !isNotificationRead(notification.lu) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    } ${notification.urgente ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* En-tête de la notification */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-semibold ${
              !isNotificationRead(notification.lu) ? 'text-blue-600' : 'text-gray-800'
            }`}>
              {notification.titre}
            </h3>
            {notification.urgente && (
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            {!isNotificationRead(notification.lu) && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" 
                   title="Non lue"></div>
            )}
          </div>

          {/* Message */}
          <p className="text-gray-700 mb-3 leading-relaxed">
            {notification.message}
          </p>

          {/* Badges et métadonnées */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              getTypeBadgeColor(notification.type)
            }`}>
              {getTypeText(notification.type)}
            </span>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              getStatusBadgeColor(notification.statut)
            }`}>
              {getStatusText(notification.statut)}
            </span>

            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(notification.dateCreation)}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-500">
              <User className="h-3 w-3" />
              <span>{notification.apprenantNom}</span>
            </div>

            {notification.dateEnvoi && (
              <div className="flex items-center gap-1 text-gray-500">
                <span>Sent: {formatDate(notification.dateEnvoi)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4 flex-shrink-0">
          {!isNotificationRead(notification.lu) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="whitespace-nowrap"
            >
              <Eye className="h-4 w-4 mr-1" />
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
