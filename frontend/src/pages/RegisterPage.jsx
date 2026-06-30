import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, Phone, BookOpen, Hash, ArrowRight, CheckCircle2, Building2, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', phone: '', rollNumber: '', course: '', department: '', year: 1, hostelId: '' });
  const [hostels, setHostels] = useState([]);
  const [hostelsLoading, setHostelsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);

  useEffect(() => {
    api.get('/hostels/public').then(r => {
      setHostels(r.data.data);
      setHostelsLoading(false);
    }).catch(() => setHostelsLoading(false));
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleHostelChange = (e) => {
    const id = e.target.value;
    setForm(f => ({ ...f, hostelId: id }));
    setSelectedHostel(hostels.find(h => h._id === id) || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hostelId) { toast.error('Please select a hostel.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 40px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const iconStyle = { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' };
  const focus = (e) => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; };
  const blur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={30} color="#34d399" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Registration Submitted!</h2>
          {selectedHostel && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
              <Building2 size={12} color="#818cf8" />
              <span style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 700 }}>{selectedHostel.name}</span>
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 28px' }}>
            Your application has been sent to the hostel admin for review. You'll receive an email once approved.
          </p>
          <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, margin: '0 0 8px' }}>What happens next?</p>
            {['Admin reviews & approves your request', 'You receive an approval email with login link', 'Enter your email → OTP verification → Set password', "You're in your hostel dashboard!"].map((s, i) => (
              <p key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0 0 4px', lineHeight: 1.5 }}>
                {i + 1}. {s}
              </p>
            ))}
          </div>
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>D</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>DormEase</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create an account</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>Select your hostel and register — no password needed at sign-up</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>

          {/* Hostel selector — FIRST */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Select Your Hostel *</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={14} style={iconStyle} />
              <select
                value={form.hostelId}
                onChange={handleHostelChange}
                required
                style={{ ...inputStyle, paddingLeft: 40, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}
                onFocus={focus} onBlur={blur}
              >
                <option value="" style={{ background: '#1a1a2e' }}>
                  {hostelsLoading ? 'Loading hostels…' : '— Choose your hostel —'}
                </option>
                {hostels.map(h => (
                  <option key={h._id} value={h._id} style={{ background: '#1a1a2e' }}>
                    {h.name} ({h.code}) {h.address?.city ? `· ${h.address.city}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            </div>
            {selectedHostel && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>
                <CheckCircle2 size={12} />
                {selectedHostel.name} · {selectedHostel.type}
              </div>
            )}
            {!hostelsLoading && hostels.length === 0 && (
              <p style={{ marginTop: 8, color: '#f87171', fontSize: '0.78rem' }}>No active hostels found. Please contact the administrator.</p>
            )}
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>I am registering as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ value: 'student', label: '🎓 Student', color: '#fb923c' }, { value: 'warden', label: '🏠 Warden', color: '#34d399' }].map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  style={{ padding: '12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s', fontFamily: 'inherit', background: role === r.value ? r.color + '20' : 'rgba(255,255,255,0.03)', border: role === r.value ? `2px solid ${r.color}60` : '2px solid rgba(255,255,255,0.08)', color: role === r.value ? r.color : 'rgba(255,255,255,0.45)' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconStyle} />
                  <input style={inputStyle} placeholder="Your full name" value={form.name} onChange={set('name')} required onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconStyle} />
                  <input style={inputStyle} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconStyle} />
                <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={set('email')} required onFocus={focus} onBlur={blur} />
              </div>
            </div>

            {role === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Roll Number</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={14} style={iconStyle} />
                    <input style={inputStyle} placeholder="e.g. CS2024001" value={form.rollNumber} onChange={set('rollNumber')} required onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Course</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={14} style={iconStyle} />
                    <input style={inputStyle} placeholder="e.g. B.Tech CSE" value={form.course} onChange={set('course')} required onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input style={{ ...inputStyle, paddingLeft: 14 }} placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <select style={{ ...inputStyle, paddingLeft: 14 }} value={form.year} onChange={set('year')}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y} style={{ background: '#1a1a2e' }}>Year {y}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ margin: 0, color: 'rgba(129,140,248,0.9)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                🔐 No password needed now. After the hostel admin approves you, verify your email with an OTP and set your password.
              </p>
            </div>

            <button type="submit" disabled={loading || !form.hostelId}
              style={{ width: '100%', padding: '13px', background: loading || !form.hostelId ? 'rgba(129,140,248,0.35)' : 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading || !form.hostelId ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Submitting…' : <><span>Submit Registration</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, color: 'rgba(255,255,255,0.22)', fontSize: '0.78rem' }}>
          Run a hostel? <Link to="/register-hostel" style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, textDecoration: 'none' }}>Register it here</Link>
        </p>
      </div>
    </div>
  );
}
