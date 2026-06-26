import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  Clock, XCircle, KeyRound, ShieldCheck,
  MessageSquare, AlertTriangle,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ─── tiny helpers ────────────────────────────────────────────────────────── */
const C = {
  // bg colors for status banners
  pending:     { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  text: '#fbbf24' },
  rejected:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
  notFound:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
  deactivated: { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
};

function StatusBanner({ type, message }) {
  const s = C[type] || C.rejected;
  const Icon = type === 'pending' ? Clock : AlertTriangle;
  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
      <Icon size={14} style={{ color: s.text, flexShrink: 0, marginTop: 2 }} />
      <p style={{ margin: 0, color: s.text, fontSize: '0.83rem', lineHeight: 1.55 }}>{message}</p>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />;
}

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function Steps({ step, isAdmin }) {
  const labels = isAdmin ? ['Email', 'Password'] : ['Email', 'OTP', 'Set Password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
      {labels.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, transition: 'all .3s',
              background: done ? 'rgba(52,211,153,.18)' : active ? 'rgba(129,140,248,.18)' : 'rgba(255,255,255,.05)',
              border: `1.5px solid ${done ? 'rgba(52,211,153,.5)' : active ? 'rgba(129,140,248,.55)' : 'rgba(255,255,255,.1)'}`,
              color: done ? '#34d399' : active ? '#818cf8' : 'rgba(255,255,255,.25)',
            }}>
              {done ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.7rem', color: active ? '#818cf8' : 'rgba(255,255,255,.28)', fontWeight: active ? 700 : 500 }}>{label}</span>
            {i < labels.length - 1 && (
              <div style={{ width: 18, height: 1, background: done ? 'rgba(52,211,153,.3)' : 'rgba(255,255,255,.1)', transition: 'background .3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  /*
   * Stages:
   *   'email'      → user types email, we check it
   *   'admin'      → admin password field
   *   'choice'     → returning user: "Password" or "OTP" buttons
   *   'password'   → returning user enters password
   *   'otp'        → user enters OTP
   *   'setpassword'→ first-timer sets permanent password
   *   'blocked'    → pending / rejected / not-found (terminal inline message)
   */
  const [stage, setStage]             = useState('email');
  const [email, setEmail]             = useState('');
  const [userName, setUserName]       = useState('');
  const [isAdmin, setIsAdmin]         = useState(false);
  const [blockInfo, setBlockInfo]     = useState(null); // { type, message }
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showCPw, setShowCPw]         = useState(false);
  const [otp, setOtp]                 = useState('');
  const [setupToken, setSetupToken]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState(null);
  const [resendCd, setResendCd]       = useState(0);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const inp = (field) => ({
    width: '100%',
    padding: field === 'otp' ? '13px 16px' : '13px 16px 13px 44px',
    background: focused === field ? 'rgba(129,140,248,.07)' : 'rgba(255,255,255,.04)',
    border: `1px solid ${focused === field ? 'rgba(129,140,248,.6)' : 'rgba(255,255,255,.08)'}`,
    borderRadius: 12, color: '#fff', fontSize: field === 'otp' ? '1.25rem' : '0.9rem',
    outline: 'none', transition: 'all .2s', boxSizing: 'border-box', fontFamily: 'inherit',
    boxShadow: focused === field ? '0 0 0 3px rgba(129,140,248,.1)' : 'none',
    ...(field === 'otp' ? { textAlign: 'center', fontWeight: 700, letterSpacing: '0.2em' } : {}),
  });

  const label = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' };

  const btn = (disabled) => ({
    width: '100%', padding: '13px',
    background: disabled ? 'rgba(129,140,248,.3)' : 'linear-gradient(135deg,#818cf8,#a87bde 50%,#e94560)',
    border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(129,140,248,.2)',
    transition: 'opacity .15s',
  });

  const IconWrap = ({ children, color = '#818cf8' }) => (
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      {children}
    </div>
  );

  const backToEmail = () => {
    setStage('email');
    setPassword(''); setConfirmPw(''); setOtp('');
    setBlockInfo(null); setIsAdmin(false);
    setTimeout(() => emailRef.current?.focus(), 50);
  };

  const startResend = () => {
    setResendCd(60);
    const t = setInterval(() => setResendCd(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const finish = (data) => {
    const { token, user: u } = data;
    setSession(token, u);
    navigate({ admin: '/admin', warden: '/warden', student: '/student' }[u.role] || '/');
  };

  /* ── Step 0: check email ──────────────────────────────────────────────── */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setBlockInfo(null);
    try {
      const res = await api.post('/auth/check-email', { email });
      const { code, name, reason } = res.data;
      setUserName(name || '');

      if (code === 'ADMIN') {
        setIsAdmin(true);
        setStage('admin');
      } else if (code === 'FIRST_LOGIN') {
        // Send OTP immediately
        await api.post('/auth/send-otp', { email });
        toast.success('OTP sent to your inbox!');
        startResend();
        setStage('otp');
      } else if (code === 'RETURNING') {
        setStage('choice');
      } else if (code === 'PENDING') {
        setBlockInfo({ type: 'pending', message: 'Your account is awaiting admin approval. You\'ll receive an email once approved.' });
      } else if (code === 'REJECTED') {
        setBlockInfo({ type: 'rejected', message: 'Your registration was not approved.' + (reason ? ' Reason: ' + reason : ' Please contact the hostel admin.') });
      } else if (code === 'DEACTIVATED') {
        setBlockInfo({ type: 'deactivated', message: 'This account has been deactivated. Please contact the hostel admin.' });
      } else {
        // NOT_FOUND
        setBlockInfo({ type: 'notFound', message: 'No account found with this email. Please register first or check for typos.' });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Admin password login ────────────────────────────────────────────── */
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-login', { email, password });
      finish(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Returning user: password ────────────────────────────────────────── */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      finish(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Send OTP (returning user chose OTP) ─────────────────────────────── */
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('OTP sent!');
      startResend();
      setStage('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify OTP ──────────────────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otp.trim() });
      if (res.data.needsPasswordSetup) {
        setSetupToken(res.data.setupToken);
        setStage('setpassword');
        toast.success('OTP verified! Now set your password.');
      } else {
        finish(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Set password (first login) ──────────────────────────────────────── */
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (password !== confirmPw) return toast.error('Passwords don\'t match.');
    setLoading(true);
    try {
      const res = await api.post('/auth/set-password', { setupToken, password });
      toast.success('Welcome to DormEase! 🎉');
      finish(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ──────────────────────────────────────────────────────── */
  const handleResend = async () => {
    if (resendCd > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('New OTP sent!');
      startResend();
    } catch {
      toast.error('Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'fair' : 'strong';
  const strengthColor = { weak: '#ef4444', fair: '#fbbf24', strong: '#34d399' };

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .card { animation: fadeUp .4s ease both; }
      `}</style>

      {/* bg orbs */}
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(129,140,248,.12) 0%,transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-20%', right:'-8%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,69,96,.09) 0%,transparent 65%)', pointerEvents:'none' }} />
      {/* grid */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)' }} />

      <div className="card" style={{ position:'relative', width:'100%', maxWidth:420, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:24, padding:'40px 36px 36px', boxSizing:'border-box', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', boxShadow:'0 0 0 1px rgba(129,140,248,.05), 0 32px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.07)' }}>
        {/* top gradient line */}
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(129,140,248,.5),rgba(233,69,96,.35),transparent)', pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom: stage === 'email' ? 28 : 20 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#818cf8,#e94560)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:17, boxShadow:'0 4px 16px rgba(129,140,248,.35)' }}>D</div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.02em' }}>DormEase</span>
        </div>

        {/* step dots */}
        {stage !== 'email' && !['blocked'].includes(stage) && (
          <Steps
            isAdmin={isAdmin}
            step={
              isAdmin
                ? (stage === 'admin' ? 1 : 0)
                : stage === 'choice' || stage === 'password' ? 1
                : stage === 'otp' ? 1
                : stage === 'setpassword' ? 2
                : 0
            }
          />
        )}

        {/* ══ EMAIL STAGE ══════════════════════════════════════════════ */}
        {stage === 'email' && (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <h2 style={{ margin:'0 0 6px', fontSize:'1.7rem', fontWeight:800, color:'#fff', letterSpacing:'-0.04em' }}>Welcome back</h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.85rem' }}>Enter your registered email to continue</p>
            </div>

            <div style={{ height:1, background:'rgba(255,255,255,.06)', marginBottom:20 }} />

            {/* Inline status banner — shown instead of advancing */}
            {blockInfo && <StatusBanner type={blockInfo.type} message={blockInfo.message} />}

            <form onSubmit={handleCheckEmail}>
              <div style={{ marginBottom: 20 }}>
                <label style={label}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <Mail size={14} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused==='email' ? 'rgba(129,140,248,.7)' : 'rgba(255,255,255,.25)', pointerEvents:'none', transition:'color .2s' }} />
                  <input ref={emailRef} type="email" placeholder="you@example.com" value={email}
                    onChange={e => { setEmail(e.target.value); setBlockInfo(null); }}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    style={inp('email')} required />
                </div>
              </div>
              <button type="submit" disabled={loading || !email.trim()} style={btn(loading || !email.trim())}>
                {loading ? <><Spinner /><span>Checking…</span></> : <><span>Continue</span><ArrowRight size={14} /></>}
              </button>
            </form>

            <div style={{ height:1, background:'rgba(255,255,255,.06)', margin:'22px 0 18px' }} />
            <p style={{ textAlign:'center', margin:0, color:'rgba(255,255,255,.28)', fontSize:'0.84rem' }}>
              New to DormEase?{' '}
              <Link to="/register" style={{ color:'#818cf8', fontWeight:700, textDecoration:'none' }}>Create account</Link>
            </p>
          </>
        )}

        {/* ══ ADMIN — PASSWORD STAGE ═══════════════════════════════════ */}
        {stage === 'admin' && (
          <>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <IconWrap color="#e94560"><ShieldCheck size={22} color="#e94560" /></IconWrap>
              <h2 style={{ margin:'0 0 5px', fontSize:'1.45rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Admin Login</h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.82rem' }}>
                Signing in as <span style={{ color:'#818cf8', fontWeight:700 }}>{email}</span>
              </p>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom:20 }}>
                <label style={label}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused==='apw' ? 'rgba(129,140,248,.7)' : 'rgba(255,255,255,.25)', pointerEvents:'none' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('apw')} onBlur={() => setFocused(null)}
                    style={{ ...inp('apw'), paddingRight:44 }} autoFocus required />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:0 }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || !password} style={btn(loading || !password)}>
                {loading ? <><Spinner /><span>Signing in…</span></> : <><span>Sign In</span><ArrowRight size={14} /></>}
              </button>
            </form>
            <button onClick={backToEmail} style={{ marginTop:16, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', padding:0, margin:'16px auto 0' }}>
              <ArrowLeft size={12} /> Use a different email
            </button>
          </>
        )}

        {/* ══ RETURNING USER — CHOICE STAGE ═══════════════════════════ */}
        {stage === 'choice' && (
          <>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <h2 style={{ margin:'0 0 5px', fontSize:'1.45rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>
                Hi{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
              </h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.82rem' }}>
                <span style={{ color:'#818cf8', fontWeight:600 }}>{email}</span><br />
                How would you like to sign in?
              </p>
            </div>

            <div style={{ display:'grid', gap:12, marginBottom:20 }}>
              {/* Password option */}
              <button onClick={() => setStage('password')}
                style={{ padding:'16px 18px', borderRadius:14, cursor:'pointer', fontFamily:'inherit', background:'rgba(129,140,248,.07)', border:'1.5px solid rgba(129,140,248,.2)', color:'#fff', textAlign:'left', display:'flex', alignItems:'center', gap:14, transition:'border-color .2s', outline:'none' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,.5)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,.2)'}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(129,140,248,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Lock size={16} color="#818cf8" />
                </div>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'0.9rem', color:'#fff' }}>Enter Password</p>
                  <p style={{ margin:0, fontSize:'0.75rem', color:'rgba(255,255,255,.38)' }}>Use your account password</p>
                </div>
                <ArrowRight size={14} style={{ marginLeft:'auto', color:'rgba(255,255,255,.25)' }} />
              </button>

              {/* OTP option */}
              <button onClick={handleSendOtp} disabled={loading}
                style={{ padding:'16px 18px', borderRadius:14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', background:'rgba(233,69,96,.07)', border:'1.5px solid rgba(233,69,96,.2)', color:'#fff', textAlign:'left', display:'flex', alignItems:'center', gap:14, transition:'border-color .2s', outline:'none', opacity: loading ? 0.6 : 1 }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.borderColor = 'rgba(233,69,96,.5)'; }}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(233,69,96,.2)'}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(233,69,96,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {loading ? <Spinner /> : <MessageSquare size={16} color="#e94560" />}
                </div>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'0.9rem', color:'#fff' }}>Send OTP to Email</p>
                  <p style={{ margin:0, fontSize:'0.75rem', color:'rgba(255,255,255,.38)' }}>Get a one-time code instead</p>
                </div>
                <ArrowRight size={14} style={{ marginLeft:'auto', color:'rgba(255,255,255,.25)' }} />
              </button>
            </div>

            <button onClick={backToEmail} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.28)', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', padding:0, margin:'0 auto' }}>
              <ArrowLeft size={12} /> Use a different email
            </button>
          </>
        )}

        {/* ══ RETURNING USER — PASSWORD STAGE ═════════════════════════ */}
        {stage === 'password' && (
          <>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <IconWrap><Lock size={22} color="#818cf8" /></IconWrap>
              <h2 style={{ margin:'0 0 5px', fontSize:'1.45rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Enter password</h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.82rem' }}>{email}</p>
            </div>
            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom:20 }}>
                <label style={label}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused==='upw' ? 'rgba(129,140,248,.7)' : 'rgba(255,255,255,.25)', pointerEvents:'none' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('upw')} onBlur={() => setFocused(null)}
                    style={{ ...inp('upw'), paddingRight:44 }} autoFocus required />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:0 }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || !password} style={btn(loading || !password)}>
                {loading ? <><Spinner /><span>Signing in…</span></> : <><span>Sign In</span><ArrowRight size={14} /></>}
              </button>
            </form>
            <div style={{ marginTop:14, textAlign:'center' }}>
              <button onClick={() => setStage('choice')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.28)', fontSize:'0.78rem', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', padding:0 }}>
                <ArrowLeft size={12} /> Back to sign-in options
              </button>
            </div>
          </>
        )}

        {/* ══ OTP STAGE ════════════════════════════════════════════════ */}
        {stage === 'otp' && (
          <>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <IconWrap><ShieldCheck size={22} color="#818cf8" /></IconWrap>
              <h2 style={{ margin:'0 0 5px', fontSize:'1.45rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Check your inbox</h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.82rem', lineHeight:1.55 }}>
                6-digit OTP sent to<br /><span style={{ color:'#818cf8', fontWeight:700 }}>{email}</span>
              </p>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom:20 }}>
                <label style={{ ...label, textAlign:'center' }}>One-Time Password</label>
                <input
                  placeholder="• • • • • •" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  onFocus={() => setFocused('otp')} onBlur={() => setFocused(null)}
                  style={inp('otp')} inputMode="numeric" maxLength={6} autoFocus required />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} style={btn(loading || otp.length !== 6)}>
                {loading ? <><Spinner /><span>Verifying…</span></> : <><span>Verify OTP</span><ArrowRight size={14} /></>}
              </button>
            </form>
            <div style={{ marginTop:16, textAlign:'center' }}>
              <p style={{ margin:'0 0 8px', color:'rgba(255,255,255,.3)', fontSize:'0.8rem' }}>
                Didn't receive it?{' '}
                {resendCd > 0
                  ? <span style={{ color:'rgba(255,255,255,.22)' }}>Resend in {resendCd}s</span>
                  : <button onClick={handleResend} disabled={loading} style={{ background:'none', border:'none', cursor:'pointer', color:'#818cf8', fontWeight:700, fontSize:'0.8rem', padding:0, fontFamily:'inherit' }}>Resend OTP</button>
                }
              </p>
              <button onClick={backToEmail} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.25)', fontSize:'0.75rem', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', padding:0 }}>
                <ArrowLeft size={11} /> Use different email
              </button>
            </div>
          </>
        )}

        {/* ══ SET PASSWORD STAGE ═══════════════════════════════════════ */}
        {stage === 'setpassword' && (
          <>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <IconWrap color="#e94560"><KeyRound size={22} color="#e94560" /></IconWrap>
              <h2 style={{ margin:'0 0 5px', fontSize:'1.45rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>Set your password</h2>
              <p style={{ margin:0, color:'rgba(255,255,255,.35)', fontSize:'0.82rem', lineHeight:1.5 }}>
                Create a password for future logins.<br />You only need to do this once.
              </p>
            </div>
            <form onSubmit={handleSetPassword}>
              <div style={{ marginBottom:12 }}>
                <label style={label}>New Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.25)', pointerEvents:'none' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('npw')} onBlur={() => setFocused(null)}
                    style={{ ...inp('npw'), paddingRight:44 }} autoFocus required minLength={6} />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:0 }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {pwStrength && (
                  <div style={{ marginTop:6, display:'flex', gap:4 }}>
                    {['weak','fair','strong'].map((s,i) => (
                      <div key={s} style={{ flex:1, height:3, borderRadius:99, background: ['weak','fair','strong'].indexOf(pwStrength) >= i ? strengthColor[pwStrength] : 'rgba(255,255,255,.1)', transition:'background .3s' }} />
                    ))}
                    <span style={{ fontSize:'0.7rem', color: strengthColor[pwStrength], marginLeft:4, fontWeight:700, textTransform:'capitalize' }}>{pwStrength}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={label}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.25)', pointerEvents:'none' }} />
                  <input type={showCPw ? 'text' : 'password'} placeholder="Repeat password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    onFocus={() => setFocused('cpw')} onBlur={() => setFocused(null)}
                    style={{ ...inp('cpw'), paddingRight:44, borderColor: confirmPw && password !== confirmPw ? 'rgba(239,68,68,.5)' : undefined }} required />
                  <button type="button" onClick={() => setShowCPw(s => !s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:0 }}>
                    {showCPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {confirmPw && password !== confirmPw && (
                  <p style={{ margin:'4px 0 0', color:'#ef4444', fontSize:'0.75rem' }}>Passwords don't match</p>
                )}
              </div>

              <button type="submit" disabled={loading || password.length < 6 || password !== confirmPw} style={btn(loading || password.length < 6 || password !== confirmPw)}>
                {loading ? <><Spinner /><span>Setting up…</span></> : <><span>Set Password & Sign In</span><ArrowRight size={14} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
