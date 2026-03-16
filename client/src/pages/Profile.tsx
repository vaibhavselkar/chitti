import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Shield, MessageCircle, CheckCircle2, XCircle, ExternalLink, Eye, EyeOff, Trash2, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // WhatsApp
  const [waStatus, setWaStatus] = useState<{ enabled: boolean; fromNumber: string | null; hasCredentials: boolean } | null>(null);
  const [waForm, setWaForm] = useState({ phoneNumberId: '', accessToken: '', fromNumber: '' });
  const [showToken, setShowToken] = useState(false);
  const [isSavingWA, setIsSavingWA] = useState(false);
  const [isTestingWA, setIsTestingWA] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchWAStatus();
  }, []);

  const fetchWAStatus = async () => {
    try {
      const res = await authAPI.getWhatsAppStatus();
      if (res.data.success && res.data.data) setWaStatus(res.data.data);
    } catch {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) { toast.error('Please fill in all fields'); return; }
    try {
      setIsSaving(true);
      const res = await authAPI.updateProfile(name, email);
      if (res.data.success) toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { toast.error('Please fill in all fields'); return; }
    try {
      setIsChangingPassword(true);
      const res = await authAPI.changePassword(currentPassword, newPassword);
      if (res.data.success) {
        toast.success('Password changed');
        setCurrentPassword(''); setNewPassword('');
      }
    } catch { toast.error('Failed to change password'); }
    finally { setIsChangingPassword(false); }
  };

  const handleSaveWA = async (e: React.FormEvent) => {
    e.preventDefault();
    const { phoneNumberId, accessToken, fromNumber } = waForm;
    if (!phoneNumberId || !accessToken || !fromNumber) {
      toast.error('Please fill in all WhatsApp fields'); return;
    }
    try {
      setIsSavingWA(true);
      const res = await authAPI.saveWhatsAppCredentials({
        whatsappPhoneNumberId: phoneNumberId,
        whatsappAccessToken: accessToken,
        whatsappFromNumber: fromNumber.replace(/[\s\-+]/g, '').replace(/^0/, '91'),
      });
      if (res.data.success) {
        toast.success('WhatsApp connected!');
        setWaForm({ phoneNumberId: '', accessToken: '', fromNumber: '' });
        fetchWAStatus();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save credentials');
    } finally { setIsSavingWA(false); }
  };

  const handleTestWA = async () => {
    if (!testPhone) { toast.error('Enter a phone number to test'); return; }
    try {
      setIsTestingWA(true);
      const res = await authAPI.testWhatsApp(testPhone);
      if ((res.data as any).success) toast.success('Test message sent! Check WhatsApp.');
      else toast.error('Test failed — check your credentials');
    } catch { toast.error('Test failed'); }
    finally { setIsTestingWA(false); }
  };

  const handleDisconnectWA = async () => {
    if (!confirm('Disconnect WhatsApp? Reminders will stop sending.')) return;
    try {
      setIsDisconnecting(true);
      await authAPI.disconnectWhatsApp();
      toast.success('WhatsApp disconnected');
      setWaStatus(null);
    } catch { toast.error('Failed to disconnect'); }
    finally { setIsDisconnecting(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your account and WhatsApp integration.</p>
      </div>

      {/* Profile info */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Update Profile</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" className="input-field pl-9" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="email" className="input-field pl-9" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="btn-primary flex items-center space-x-2">
            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
            <span>Save Changes</span>
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Change Password</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="password" className="input-field pl-9" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="password" className="input-field pl-9" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={isChangingPassword} className="btn-primary flex items-center space-x-2">
            {isChangingPassword && <Loader2 className="animate-spin h-4 w-4" />}
            <span>Change Password</span>
          </button>
        </form>
      </div>

      {/* WhatsApp Integration */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">WhatsApp Integration</h2>
              <p className="text-xs text-gray-400">Meta WhatsApp Business API — 1,000 free messages/month</p>
            </div>
          </div>
          {waStatus?.enabled ? (
            <span className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
              <XCircle className="w-3.5 h-3.5" />
              <span>Not connected</span>
            </span>
          )}
        </div>

        {waStatus?.enabled ? (
          /* Connected state */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
              <p className="font-medium text-green-800 mb-1">✅ WhatsApp is active</p>
              <p className="text-green-600 text-xs">Sending from: <span className="font-mono font-semibold">+{waStatus.fromNumber}</span></p>
              <p className="text-green-600 text-xs mt-0.5">Reminders are being sent automatically from your number.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send a test message to</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="91XXXXXXXXXX"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                />
                <button onClick={handleTestWA} disabled={isTestingWA} className="btn-secondary flex items-center space-x-1 whitespace-nowrap">
                  {isTestingWA ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                  <span>Test</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter with country code, e.g. 919876543210</p>
            </div>

            <button onClick={handleDisconnectWA} disabled={isDisconnecting} className="btn-danger flex items-center space-x-2 text-sm">
              {isDisconnecting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              <span>Disconnect WhatsApp</span>
            </button>
          </div>
        ) : (
          /* Setup form */
          <div className="space-y-4">
            {/* Step guide */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-blue-800">How to get your credentials (free):</p>
              <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline font-medium inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="w-3 h-3" /></a></li>
                <li>Create an App → Add <strong>WhatsApp</strong> product</li>
                <li>Go to <strong>WhatsApp → API Setup</strong></li>
                <li>Copy the <strong>Phone Number ID</strong> and <strong>Temporary Access Token</strong></li>
                <li>Add your phone number and verify it</li>
                <li>For permanent token: create a System User in Business Settings</li>
              </ol>
            </div>

            <form onSubmit={handleSaveWA} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                <input
                  type="text"
                  className="input-field font-mono text-sm"
                  placeholder="1234567890123456"
                  value={waForm.phoneNumberId}
                  onChange={e => setWaForm(p => ({ ...p, phoneNumberId: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">Found in WhatsApp → API Setup on Meta Developer Portal</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="input-field font-mono text-sm pr-10"
                    placeholder="EAAxxxxxxxxxxxxxxx..."
                    value={waForm.accessToken}
                    onChange={e => setWaForm(p => ({ ...p, accessToken: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Temporary (24h) or permanent System User token</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your WhatsApp Business Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="919876543210"
                  value={waForm.fromNumber}
                  onChange={e => setWaForm(p => ({ ...p, fromNumber: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">With country code, no + or spaces. India: 91XXXXXXXXXX</p>
              </div>

              <button type="submit" disabled={isSavingWA} className="btn-primary flex items-center space-x-2 w-full justify-center">
                {isSavingWA ? <Loader2 className="animate-spin h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                <span>{isSavingWA ? 'Connecting...' : 'Connect WhatsApp'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
