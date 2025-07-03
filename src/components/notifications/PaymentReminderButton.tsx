import React, { useState } from 'react';
import Button from '../ui/Button';
import { Send, Loader2 } from 'lucide-react';
import { sendPaymentReminder } from '../../api/apiService';

interface PaymentReminderButtonProps {
  apprenantId: number;
  apprenantNom?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PaymentReminderButton: React.FC<PaymentReminderButtonProps> = ({
  apprenantId,
  onSuccess,
  onError
}) => {
  const [sending, setSending] = useState(false);

  const handleSendReminder = async () => {
    try {
      setSending(true);
      await sendPaymentReminder(apprenantId);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = `Error sending payment reminder`;
      console.error('Error sending payment reminder:', error);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleSendReminder}
      disabled={sending}
      className="whitespace-nowrap"
    >
      {sending ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="h-4 w-4 mr-1" />
          Payment Reminder
        </>
      )}
    </Button>
  );
};

export default PaymentReminderButton;
