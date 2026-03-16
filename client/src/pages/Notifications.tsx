import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, Send, Loader2, MessageSquare } from 'lucide-react';
import { notificationAPI } from '../services/api';

const Notifications: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [bulkChitId, setBulkChitId] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isBulkSending, setIsBulkSending] = useState(false);

  const sendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setIsSending(true);
      const response = await notificationAPI.test({ phone, message });
      if (response.data.success) {
        toast.success('Test notification sent');
        setPhone('');
        setMessage('');
      }
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const sendBulkNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkChitId || !bulkMessage) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setIsBulkSending(true);
      const response = await notificationAPI.sendBulk({
        chitGroupId: bulkChitId,
        message: bulkMessage,
        memberIds: [],
      });
      if (response.data.success) {
        toast.success('Bulk notification sent');
        setBulkChitId('');
        setBulkMessage('');
      }
    } catch (error) {
      toast.error('Failed to send bulk notification');
    } finally {
      setIsBulkSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Send SMS and WhatsApp notifications to members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Test Notification</h2>
          </div>
          <form onSubmit={sendTestNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                className="input-field"
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="input-field h-24 resize-none"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isSending} className="btn-primary flex items-center space-x-2">
              {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
              <span>Send Test</span>
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bulk Notification</h2>
          </div>
          <form onSubmit={sendBulkNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chit Group ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter chit group ID"
                value={bulkChitId}
                onChange={(e) => setBulkChitId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="input-field h-24 resize-none"
                placeholder="Enter message for all members..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isBulkSending} className="btn-primary flex items-center space-x-2">
              {isBulkSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
              <span>Send to All</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
