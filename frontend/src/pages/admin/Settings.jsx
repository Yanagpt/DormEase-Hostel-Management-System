import { useState } from 'react';
import { Lock, Eye, EyeOff, User, Mail, Phone, Save, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, FormField } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettings() {
  const { user, updateUser } = useAuth();

  /* ── Profile form ── */
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Password form ── */
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      updateUser({ name: profileForm.name, phone: profileForm.phone });
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New password and confirmation do not match.');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      return toast.error('New password must be different from current password.');
    }
    setSavingPw(true);
    try {
      const res = await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      // Backend returns a fresh token since the old sessions technically
      // remain valid (JWT isn't password-bound) — but we refresh it anyway
      // for the current tab to be safe.
      if (res.data.token) {
        sessionStorage.setItem('token', res.data.token);
      }
      toast.success('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <PageHeader title="Account Settings" subtitle="Manage your admin profile and security" />

      <div className="grid grid-cols-2 gap-6 max-w-4xl">

        {/* ── Profile Card ── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Profile Information</h3>
              <p className="text-xs text-gray-400">Update your name and contact details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <FormField label="Full Name">
              <input className="input" value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="Your full name" />
            </FormField>

            <FormField label="Email Address">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" value={user?.email || ''} disabled />
              </div>
            </FormField>

            <FormField label="Phone Number">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX" />
              </div>
            </FormField>

            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              <ShieldCheck size={14} className="flex-shrink-0" />
              <span>You are signed in as <strong className="capitalize">{user?.role}</strong>. Email cannot be changed.</span>
            </div>

            <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
              <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* ── Password Card ── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Change Password</h3>
              <p className="text-xs text-gray-400">Update your account login password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <FormField label="Current Password">
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="input pr-10"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                  placeholder="Enter current password" />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>

            <FormField label="New Password">
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input pr-10"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password">
              <input
                type="password"
                className="input"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
                placeholder="Re-enter new password" />
            </FormField>

            {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
              <p className="text-xs text-red-500 font-medium -mt-2">Passwords do not match</p>
            )}

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
              ⚠️ You'll need this new password the next time you log in. Make sure to remember it.
            </div>

            <button type="submit" disabled={savingPw}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">
              <Lock size={14} /> {savingPw ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}