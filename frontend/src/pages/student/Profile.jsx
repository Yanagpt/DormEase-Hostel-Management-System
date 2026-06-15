import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Building2, DollarSign, Edit2, Hash, Lock, Mail, Phone, Save, TrendingUp, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, Badge, FormField, StatCard } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

// Pull fresh student data and build a clean form snapshot
const buildForm = (data) => ({
  name:             data.user?.name        || '',
  phone:            data.user?.phone       || '',
  parentName:       data.parentName        || '',
  parentPhone:      data.parentPhone       || '',
  parentEmail:      data.parentEmail       || '',
  address: {
    street:  data.address?.street  || '',
    city:    data.address?.city    || '',
    state:   data.address?.state   || '',
    pincode: data.address?.pincode || '',
  },
  emergencyContact: {
    name:     data.emergencyContact?.name     || '',
    phone:    data.emergencyContact?.phone    || '',
    relation: data.emergencyContact?.relation || '',
  },
});

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [student, setStudent]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Per-tab edit state — completely independent
  const [infoEdit,    setInfoEdit]    = useState(false);
  const [contactEdit, setContactEdit] = useState(false);

  // Separate form states per tab so changes in one never bleed into another
  const [infoForm,    setInfoForm]    = useState({});
  const [contactForm, setContactForm] = useState({});

  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/users/me/student');
      const data = r.data.data;
      setStudent(data);
      const f = buildForm(data);
      // Seed both form states from fresh server data
      setInfoForm({
        name:        f.name,
        phone:       f.phone,
        parentName:  f.parentName,
        parentPhone: f.parentPhone,
        parentEmail: f.parentEmail,
      });
      setContactForm({
        address:          f.address,
        emergencyContact: f.emergencyContact,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudent(); }, [loadStudent]);

  // Reset info form to last saved values and exit edit mode
  const cancelInfo = () => {
    if (!student) return;
    const f = buildForm(student);
    setInfoForm({
      name: f.name, phone: f.phone,
      parentName: f.parentName, parentPhone: f.parentPhone, parentEmail: f.parentEmail,
    });
    setInfoEdit(false);
  };

  // Reset contact form to last saved values and exit edit mode
  const cancelContact = () => {
    if (!student) return;
    const f = buildForm(student);
    setContactForm({ address: f.address, emergencyContact: f.emergencyContact });
    setContactEdit(false);
  };

  // Save Personal Info tab
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', { name: infoForm.name, phone: infoForm.phone });
      await api.put(`/users/students/${student._id}`, {
        parentName:  infoForm.parentName,
        parentPhone: infoForm.parentPhone,
        parentEmail: infoForm.parentEmail,
      });
      updateUser({ name: infoForm.name, phone: infoForm.phone });
      toast.success('Personal info updated.');
      setInfoEdit(false);
      await loadStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save Emergency Contact tab
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/students/${student._id}`, {
        address:          contactForm.address,
        emergencyContact: contactForm.emergencyContact,
      });
      toast.success('Contact details updated.');
      setContactEdit(false);
      await loadStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast.error('Passwords do not match.');
    if (pwForm.newPassword.length < 6)
      return toast.error('New password must be at least 6 characters.');
    setSavingPw(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password updated successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect current password.');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <Spinner />;
  if (!student) return (
    <div className="text-center py-10 text-gray-400">Student profile not found.</div>
  );

  const room = student.room;

  // Shared edit/cancel button strip
  const EditStrip = ({ isEditing, onEdit, onCancel, editLabel = 'Edit', saving: isSaving }) => (
    <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
      {isEditing ? (
        <>
          <button type="submit" disabled={isSaving}
            className="btn-primary flex items-center gap-2">
            <Save size={14} />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline flex items-center gap-2">
            <X size={14} /> Cancel
          </button>
        </>
      ) : (
        <button type="button" onClick={onEdit}
          className="btn-outline flex items-center gap-2">
          <Edit2 size={14} /> {editLabel}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and manage your personal information" />

      <div className="grid grid-cols-3 gap-5">

        {/* ── Left sidebar card ──────────────────────── */}
        <div className="col-span-1 space-y-4">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white font-extrabold text-3xl mx-auto mb-4">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{user?.name}</h2>
            <p className="text-sm text-gray-500 mb-3 capitalize">{student.rollNumber}</p>
            <Badge label={student.status} variant={student.status} />

            <div className="mt-5 space-y-2.5 text-left">
              {[
                [Building2, 'Room',   room?.roomNumber || 'Unassigned'],
                [BookOpen,  'Course', student.course],
                [Hash,      'Dept',   student.department || '—'],
                [Phone,     'Phone',  user?.phone || '—'],
                [Mail,      'Email',  user?.email],
              ].map(([Icon, label, val]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 flex-shrink-0 w-12">{label}:</span>
                  <span className="font-semibold text-gray-800 truncate">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Quick Summary</h4>
            <div className="space-y-3">
              <StatCard
                label="Fee Status"
                value={student.feeStatus === 'paid' ? 'Paid' : 'Pending'}
                icon={DollarSign}
                color={student.feeStatus === 'paid' ? '#059669' : '#d97706'} />
              <StatCard
                label="Attendance"
                value={`${student.attendance}%`}
                icon={TrendingUp}
                color="#0d9488" />
            </div>
          </div>
        </div>

        {/* ── Right detail card ──────────────────────── */}
        <div className="col-span-2">
          <div className="card overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                ['info',     'Personal Info'],
                ['contact',  'Emergency & Address'],
                ['security', 'Security'],
              ].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`px-5 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap
                    ${activeTab === id
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* ── Personal Info tab ─────────────────── */}
              {activeTab === 'info' && (
                <form onSubmit={handleSaveInfo}>
                  <div className="grid grid-cols-2 gap-4">

                    <FormField label="Full Name">
                      <input
                        className="input"
                        value={infoForm.name || ''}
                        onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))}
                        disabled={!infoEdit}
                        placeholder="Your full name" />
                    </FormField>

                    <FormField label="Email (cannot change)">
                      <input className="input" value={user?.email || ''} disabled />
                    </FormField>

                    <FormField label="Phone Number">
                      <input
                        className="input"
                        value={infoForm.phone || ''}
                        onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))}
                        disabled={!infoEdit}
                        placeholder="+91 XXXXX XXXXX" />
                    </FormField>

                    <FormField label="Roll Number (fixed)">
                      <input className="input" value={student.rollNumber} disabled />
                    </FormField>

                    <FormField label="Course (fixed)">
                      <input className="input" value={student.course} disabled />
                    </FormField>

                    <FormField label="Department (fixed)">
                      <input className="input" value={student.department || '—'} disabled />
                    </FormField>

                    <FormField label="Parent / Guardian Name">
                      <input
                        className="input"
                        value={infoForm.parentName || ''}
                        onChange={e => setInfoForm(f => ({ ...f, parentName: e.target.value }))}
                        disabled={!infoEdit}
                        placeholder="Parent's full name" />
                    </FormField>

                    <FormField label="Parent Phone">
                      <input
                        className="input"
                        value={infoForm.parentPhone || ''}
                        onChange={e => setInfoForm(f => ({ ...f, parentPhone: e.target.value }))}
                        disabled={!infoEdit}
                        placeholder="+91 XXXXX XXXXX" />
                    </FormField>

                    <FormField label="Parent Email" >
                      <input
                        type="email"
                        className="input col-span-2"
                        value={infoForm.parentEmail || ''}
                        onChange={e => setInfoForm(f => ({ ...f, parentEmail: e.target.value }))}
                        disabled={!infoEdit}
                        placeholder="parent@example.com" />
                    </FormField>
                  </div>

                  <EditStrip
                    isEditing={infoEdit}
                    onEdit={() => setInfoEdit(true)}
                    onCancel={cancelInfo}
                    editLabel="Edit Personal Info"
                    saving={saving} />
                </form>
              )}

              {/* ── Emergency Contact & Address tab ───── */}
              {activeTab === 'contact' && (
                <form onSubmit={handleSaveContact}>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-4">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <FormField label="Contact Name">
                      <input
                        className="input"
                        value={contactForm.emergencyContact?.name || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="e.g. Father / Mother" />
                    </FormField>

                    <FormField label="Contact Phone">
                      <input
                        className="input"
                        value={contactForm.emergencyContact?.phone || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="+91 XXXXX XXXXX" />
                    </FormField>

                    <FormField label="Relation">
                      <input
                        className="input"
                        value={contactForm.emergencyContact?.relation || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, emergencyContact: { ...f.emergencyContact, relation: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="e.g. Father, Mother, Sibling" />
                    </FormField>
                  </div>

                  <p className="text-xs text-gray-400 font-semibold uppercase mb-4">Home Address</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Street / Area">
                      <input
                        className="input"
                        value={contactForm.address?.street || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, address: { ...f.address, street: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="Street, locality" />
                    </FormField>

                    <FormField label="City">
                      <input
                        className="input"
                        value={contactForm.address?.city || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, address: { ...f.address, city: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="City" />
                    </FormField>

                    <FormField label="State">
                      <input
                        className="input"
                        value={contactForm.address?.state || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, address: { ...f.address, state: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="State" />
                    </FormField>

                    <FormField label="PIN Code">
                      <input
                        className="input"
                        value={contactForm.address?.pincode || ''}
                        onChange={e => setContactForm(f => ({
                          ...f, address: { ...f.address, pincode: e.target.value },
                        }))}
                        disabled={!contactEdit}
                        placeholder="6-digit PIN" />
                    </FormField>
                  </div>

                  <EditStrip
                    isEditing={contactEdit}
                    onEdit={() => setContactEdit(true)}
                    onCancel={cancelContact}
                    editLabel="Edit Contact & Address"
                    saving={saving} />
                </form>
              )}

              {/* ── Security tab ───────────────────────── */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <p className="text-sm text-gray-500">
                    Change your login password. Must be at least 6 characters.
                  </p>

                  <FormField label="Current Password">
                    <input
                      type="password"
                      className="input"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                      required
                      placeholder="Your current password" />
                  </FormField>

                  <FormField label="New Password">
                    <input
                      type="password"
                      className="input"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      required
                      minLength={6}
                      placeholder="At least 6 characters" />
                  </FormField>

                  <FormField label="Confirm New Password">
                    <input
                      type="password"
                      className="input"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      required
                      placeholder="Repeat new password" />
                  </FormField>

                  {pwForm.newPassword && pwForm.confirmPassword &&
                    pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
                  )}

                  <button type="submit" disabled={savingPw}
                    className="btn-primary flex items-center gap-2">
                    <Lock size={14} />
                    {savingPw ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}