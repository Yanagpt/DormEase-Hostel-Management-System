import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, DollarSign, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: 'Admin',   email: 'admin@dormease.com',  color: '#818cf8', role: 'Full system access' },
  { label: 'Warden',  email: 'warden@dormease.com', color: '#34d399', role: 'Operations panel'   },
  { label: 'Student', email: 'rahul@student.com',   color: '#fb923c', role: 'Student portal'     },
];

const FEATURES = [
  { icon: Building2,  text: 'Real-time room allocation'       },
  { icon: DollarSign, text: 'Automated fee management'        },
  { icon: Shield,     text: 'Role-based secure access'        },
  { icon: Zap,        text: 'Instant complaint resolution'    },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  if (user) {
    const map = { admin: '/admin', warden: '/warden', student: '/student' };
    navigate(map[user.role] || '/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      toast.success(`Welcome back, ${userData.name}!`);
      const map = { admin: '/admin', warden: '/warden', student: '/student' };
      navigate(map[userData.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px 13px 44px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused === field ? 'rgba(129,140,248,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12,
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    boxShadow: focused === field ? '0 0 0 3px rgba(129,140,248,0.12)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#080b14', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e2e8f0' }}>

      {/* ── LEFT PANEL ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        className="login-left-panel">

        {/* Background glows */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 400, height: 400, background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Grid decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 72 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>D</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>DormEase</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', color: '#fff' }}>
              The smartest way<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #e94560)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                to run a hostel
              </span>
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '1rem', lineHeight: 1.65 }}>
              Everything from rooms and fees to complaints and leave requests — unified in one platform.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 64 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[['10K+', 'Students'], ['50+', 'Hostels'], ['99.9%', 'Uptime']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{val}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────── */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 48px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Welcome back</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={inputStyle('email')}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle('password'), paddingRight: 44 }}
                  required
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, lineHeight: 1 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? 'rgba(129,140,248,0.5)' : 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s', boxShadow: '0 0 32px rgba(129,140,248,0.2)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              {loading ? (
                <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Signing in...</>
              ) : (
                <> Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 600 }}>DEMO ACCOUNTS</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Demo account pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_ACCOUNTS.map(({ label, email, color, role }) => (
              <button key={label} type="button"
                onClick={() => setForm({ email, password: 'Password@123' })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.border = `1px solid ${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}20`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                  {label[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
                </div>
                <span style={{ fontSize: '0.7rem', color, fontWeight: 600, background: `${color}15`, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>{role}</span>
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)' }}>
            Password for all demo accounts: <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Password@123</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .login-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}