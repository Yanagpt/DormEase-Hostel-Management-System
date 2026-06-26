import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, Phone, BookOpen, Hash, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    rollNumber: '', course: '', department: '', year: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={30} color="#34d399" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Registration Submitted!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.65, margin: '0 0 32px' }}>
            Your account request has been sent to the admin for review. You'll get an email once approved — no password needed at sign-up!
          </p>
          <div style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 6px' }}>What happens next?</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: 0, lineHeight: 1.7 }}>
              1. Admin reviews and approves your request<br />
              2. You receive an approval email<br />
              3. Enter your email on the login page<br />
              4. Verify with a one-time OTP<br />
              5. Set your password &amp; you're in!
            </p>
          </div>
          <button onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 40px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const iconStyle = { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' };
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const focus = (e) => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; };
  const blur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>D</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>DormEase</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create an account</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>No password needed at sign-up — you'll set it on first login</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px' }}>
          {/* Role selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>I am registering as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'student', label: 'Student', color: '#fb923c' },
                { value: 'warden', label: 'Warden', color: '#34d399' },
              ].map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  style={{
                    padding: '12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700,
                    fontSize: '0.875rem', transition: 'all 0.15s', fontFamily: 'inherit',
                    background: role === r.value ? r.color + '20' : 'rgba(255,255,255,0.03)',
                    border: role === r.value ? `2px solid ${r.color}60` : '2px solid rgba(255,255,255,0.08)',
                    color: role === r.value ? r.color : 'rgba(255,255,255,0.45)',
                  }}>
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
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingLeft: 14 }} placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <select style={{ ...inputStyle, paddingLeft: 14 }} value={form.year} onChange={set('year')}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y} style={{ background: '#1a1a2e' }}>Year {y}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Info notice */}
            <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ margin: 0, color: 'rgba(129,140,248,0.9)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                🔐 No password required at this step. After admin approval, you'll verify your email with an OTP and set your password on first login.
              </p>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? 'rgba(129,140,248,0.4)' : 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Submitting…' : <><span>Submit Registration</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
