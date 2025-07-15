import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

const NotificationStatusDebug: React.FC = () => {
  const { showTestToast, showNotificationToast } = useToast();

  const handleTestToast = () => {
    showTestToast();
  };

  const handleCustomToast = () => {
    showNotificationToast(
      "Payment Reminder",
      "Your payment for the training course is due tomorrow. Please make sure to complete it on time."
    );
  };

  const handleUrgentToast = () => {
    showNotificationToast(
      "Urgent: Session Cancelled",
      "The training session scheduled for today has been cancelled due to technical issues."
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Toast Notification Debug</h3>
      <div className="space-y-3">
        <Button onClick={handleTestToast} variant="primary">
          Test Basic Toast
        </Button>
        <Button onClick={handleCustomToast} variant="secondary">
          Test Payment Reminder Toast
        </Button>
        <Button onClick={handleUrgentToast} variant="danger">
          Test Urgent Toast
        </Button>
      </div>
      <p className="text-sm text-gray-600 mt-4">
        These toasts will appear in the top-right corner and last for 10 seconds.
      </p>
    </div>
  );
};

export default NotificationStatusDebug;