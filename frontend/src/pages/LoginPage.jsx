import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Clock, XCircle, Building2, DollarSign, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Building2,  text: 'Real-time room allocation'    },
  { icon: DollarSign, text: 'Automated fee management'     },
  { icon: Shield,     text: 'Role-based secure access'     },
  { icon: Zap,        text: 'Instant complaint resolution' },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  if (user) {
    const map = { admin: '/admin', warden: '/warden', student: '/student' };
    navigate(map[user.role] || '/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      toast.success('Welcome back, ' + userData.name + '!');
      const map = { admin: '/admin', warden: '/warden', student: '/student' };
      navigate(map[userData.role] || '/');
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;
      if (code === 'PENDING_APPROVAL') {
        setStatusMsg({ type: 'pending', message });
      } else if (code === 'REJECTED') {
        setStatusMsg({ type: 'rejected', message });
      } else {
        toast.error(message || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '13px 16px 13px 44px',
    background: focused === field ? 'rgba(129,140,248,0.07)' : 'rgba(255,255,255,0.04)',
    border: '1px solid ' + (focused === field ? 'rgba(129,140,248,0.6)' : 'rgba(255,255,255,0.08)'),
    borderRadius: 12, color: '#fff', fontSize: '0.9rem', outline: 'none',
    transition: 'all 0.2s ease', boxSizing: 'border-box', fontFamily: 'inherit',
    boxShadow: focused === field ? '0 0 0 3px rgba(129,140,248,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080b14', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e2e8f0',
      position: 'relative', overflow: 'hidden',
    }}>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.08); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.05); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 20px) scale(1.06); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .login-card { animation: fadeSlideUp 0.5s ease both; }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(129,140,248,0.35) !important;
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn { transition: transform 0.15s ease, box-shadow 0.15s ease !important; }
        .feature-chip:hover {
          background: rgba(129,140,248,0.14) !important;
          border-color: rgba(129,140,248,0.3) !important;
          transform: translateY(-1px);
        }
        .feature-chip { transition: all 0.18s ease; }
        .register-link:hover { color: #a5b4fc !important; }
        .eye-btn:hover { color: rgba(255,255,255,0.7) !important; }
        @media (prefers-reduced-motion: reduce) {
          .login-card, .orb1, .orb2, .orb3 { animation: none !important; }
        }
      `}</style>

      {/* Animated background orbs */}
      <div className="orb1" style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.13) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'float1 12s ease-in-out infinite',
      }} />
      <div className="orb2" style={{
        position: 'absolute', bottom: '-20%', right: '-8%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,69,96,0.1) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'float2 15s ease-in-out infinite',
      }} />
      <div className="orb3" style={{
        position: 'absolute', top: '40%', right: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'float3 10s ease-in-out infinite',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Card */}
      <div className="login-card" style={{
        position: 'relative', width: '100%', maxWidth: 420,
        margin: '0 auto', padding: '40px 40px 36px',
        boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 0 1px rgba(129,140,248,0.06), 0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>

        {/* Subtle top glow line on card */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5), rgba(233,69,96,0.4), transparent)',
          borderRadius: '0 0 4px 4px', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#818cf8,#e94560)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: 18,
            boxShadow: '0 4px 16px rgba(129,140,248,0.4)',
          }}>D</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>DormEase</span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h2 style={{
            margin: '0 0 6px', fontSize: '1.7rem', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1,
          }}>Welcome back</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>
            Sign in to manage your hostel
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24, borderRadius: 1 }} />

        {/* Status messages */}
        {statusMsg && (
          <div style={{
            marginBottom: 20, padding: '14px 16px', borderRadius: 12,
            background: statusMsg.type === 'pending' ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
            border: '1px solid ' + (statusMsg.type === 'pending' ? 'rgba(251,191,36,0.25)' : 'rgba(239,68,68,0.25)'),
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            {statusMsg.type === 'pending'
              ? <Clock size={15} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
              : <XCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />}
            <p style={{ margin: 0, color: statusMsg.type === 'pending' ? '#fbbf24' : '#ef4444', fontSize: '0.83rem', lineHeight: 1.55 }}>
              {statusMsg.message}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? 'rgba(129,140,248,0.7)' : 'rgba(255,255,255,0.25)', pointerEvents: 'none', transition: 'color 0.2s' }} />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                style={inputStyle('email')} required />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? 'rgba(129,140,248,0.7)' : 'rgba(255,255,255,0.25)', pointerEvents: 'none', transition: 'color 0.2s' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                style={{ ...inputStyle('password'), paddingRight: 44 }} required />
              <button type="button" className="eye-btn" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0, transition: 'color 0.2s', display: 'flex' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-btn"
            style={{
              width: '100%', padding: '14px',
              background: loading
                ? 'rgba(129,140,248,0.4)'
                : 'linear-gradient(135deg, #818cf8 0%, #a87bde 50%, #e94560 100%)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 24px rgba(129,140,248,0.25)',
              letterSpacing: '-0.01em',
            }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><span>Signing in…</span></>
              : <><span>Sign In</span><ArrowRight size={15} /></>
            }
          </button>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0 20px', borderRadius: 1 }} />

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
          {FEATURES.map(f => (
            <div key={f.text} className="feature-chip" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 20,
              background: 'rgba(129,140,248,0.07)',
              border: '1px solid rgba(129,140,248,0.13)',
              cursor: 'default',
            }}>
              <f.icon size={11} style={{ color: '#818cf8', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Register link */}
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.28)', fontSize: '0.845rem' }}>
            New to DormEase?{' '}
            <Link to="/register" className="register-link" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', transition: 'color 0.15s' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}