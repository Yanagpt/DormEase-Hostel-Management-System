import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, BookOpen, Hash, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    rollNumber: '', course: '', department: '', year: 1,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
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

  // Success state
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={30} color="#34d399" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Registration Submitted!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.65, margin: '0 0 32px' }}>
            Your account request has been sent to the admin for review. You will be able to log in once your registration is approved.
          </p>
          <div style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 4px' }}>What happens next?</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
              1. Admin reviews your registration<br />
              2. You receive approval confirmation<br />
              3. Login with your credentials
            </p>
          </div>
          <button onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to Login
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

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>D</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>DormEase</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create an account</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>Register and wait for admin approval to access the portal</p>
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
              {/* Name */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconStyle} />
                  <input style={inputStyle} placeholder="Your full name" value={form.name} onChange={set('name')} required
                    onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconStyle} />
                  <input style={inputStyle} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')}
                    onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconStyle} />
                <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={set('email')} required
                  onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>

            {/* Student-specific fields */}
            {role === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Roll Number</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={14} style={iconStyle} />
                    <input style={inputStyle} placeholder="e.g. CS2024001" value={form.rollNumber} onChange={set('rollNumber')} required={role === 'student'}
                      onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Course</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={14} style={iconStyle} />
                    <input style={inputStyle} placeholder="e.g. B.Tech CSE" value={form.course} onChange={set('course')} required={role === 'student'}
                      onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingLeft: 14 }} placeholder="e.g. Computer Science" value={form.department} onChange={set('department')}
                      onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
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

            {/* Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconStyle} />
                  <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }} placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6}
                    onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconStyle} />
                  <input type="password" style={inputStyle} placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required
                    onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>
            </div>

            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <p style={{ color: '#fb923c', fontSize: '0.78rem', marginBottom: 14, marginTop: -10 }}>Passwords do not match</p>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? 'rgba(129,140,248,0.4)' : 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Submitting...' : <><span>Submit Registration</span> <ArrowRight size={16} /></>}
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