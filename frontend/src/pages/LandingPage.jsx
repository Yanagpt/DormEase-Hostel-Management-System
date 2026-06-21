import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Building2, DollarSign, AlertCircle, Users, CalendarDays,
  BarChart3, ArrowRight, CheckCircle2, Shield, Zap, Star,
  Menu, X,
} from 'lucide-react';

const FEATURES = [
  { icon: Building2,    title: 'Room Allocation',     desc: 'Real-time occupancy tracking with floor-wise views and instant assignment.',  color: '#818cf8', glow: 'rgba(129,140,248,0.15)' },
  { icon: DollarSign,   title: 'Fee Management',       desc: 'Automated billing, payment tracking, receipts and overdue alerts.',           color: '#34d399', glow: 'rgba(52,211,153,0.15)'  },
  { icon: AlertCircle,  title: 'Complaint Resolution', desc: 'Priority-based tickets with full timeline, assignment and resolution notes.', color: '#fb923c', glow: 'rgba(251,146,60,0.15)'  },
  { icon: Users,        title: 'Student Management',   desc: 'Centralised profiles with academic, personal and emergency contact data.',    color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  { icon: CalendarDays, title: 'Leave Workflow',        desc: 'Digital applications flow through warden approval with instant updates.',     color: '#22d3ee', glow: 'rgba(34,211,238,0.15)'  },
  { icon: BarChart3,    title: 'Analytics',             desc: 'Live dashboards for occupancy, revenue and complaint resolution rates.',      color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
];

const ROLES = [
  { role: 'Admin',   color: '#818cf8', desc: 'Full system control',      perks: ['Manage wardens & students', 'Room allocation & fees', 'System-wide analytics', 'Post notices & reports'] },
  { role: 'Warden',  color: '#34d399', desc: 'Day-to-day operations',    perks: ['View assigned students', 'Approve leave requests', 'Resolve complaints', 'Post floor notices'] },
  { role: 'Student', color: '#fb923c', desc: 'Personal portal',          perks: ['View room & roommates', 'Track fee payments', 'Submit complaints', 'Apply for leave'] },
];

const TESTIMONIALS = [
  { stars: 5, text: 'DormEase transformed how we manage our 500+ student hostel. The automation saves 15+ hours every week.', name: 'Dr. Rajesh Kumar', role: 'Hostel Warden, IIT Delhi',  init: 'R', color: '#818cf8' },
  { stars: 5, text: 'Finally a modern way to manage hostel life. From fee payments to complaints — everything is one click.',  name: 'Priya Sharma',    role: 'Student, NIT Trichy',       init: 'P', color: '#34d399' },
  { stars: 5, text: 'The analytics gave us unprecedented visibility into hostel operations. Adoption was instant.',           name: 'Amit Patel',      role: 'Admin, VIT Vellore',         init: 'A', color: '#fb923c' },
];

const STATS = [
  { value: '10K+', label: 'Students' },
  { value: '50+',  label: 'Hostels'  },
  { value: '99.9%',label: 'Uptime'   },
  { value: '24/7', label: 'Support'  },
];

const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);

  const goLogin = () => navigate('/login');

  return (
    <div style={{ background: '#080b14', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      <style>{`
        * { box-sizing: border-box; }

        /* ── Fluid container ── */
        .de-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 5vw, 40px); }

        /* ── Nav ── */
        .de-nav-links { display: flex; gap: 28px; align-items: center; }
        .de-nav-link  { color: rgba(255,255,255,0.5); font-size: 0.875rem; font-weight: 500; text-decoration: none; transition: color 0.15s; }
        .de-nav-link:hover { color: #fff; }
        .de-hamburger { display: none; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 4px; }

        /* ── Mobile menu ── */
        .de-mobile-menu {
          display: none; flex-direction: column; gap: 4px;
          position: absolute; top: 65px; left: 0; right: 0;
          background: rgba(8,11,20,0.97); border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 12px clamp(16px,5vw,40px) 20px; z-index: 49;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .de-mobile-menu.open { display: flex; }
        .de-mobile-link {
          color: rgba(255,255,255,0.6); text-decoration: none; font-size: 1rem;
          font-weight: 500; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: color 0.15s;
        }
        .de-mobile-link:hover { color: #fff; }

        /* ── Grids ── */
        .de-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .de-roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .de-testi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .de-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .de-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
        }

        /* ── Hero CTA row ── */
        .de-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px; }
        .de-hero-btn-primary {
          background: linear-gradient(135deg,#818cf8,#e94560);
          border: none; cursor: pointer; color: #fff; font-weight: 700;
          font-size: clamp(0.9rem, 2.5vw, 1rem); padding: clamp(12px,2vw,14px) clamp(22px,4vw,32px);
          border-radius: 12px; display: flex; align-items: center; gap: 8px;
          transition: transform 0.15s, opacity 0.15s;
          box-shadow: 0 0 40px rgba(129,140,248,0.3); font-family: inherit; white-space: nowrap;
        }
        .de-hero-btn-primary:hover { transform: translateY(-2px); opacity: 0.9; }
        .de-hero-btn-secondary {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer; color: #fff; font-weight: 600;
          font-size: clamp(0.9rem, 2.5vw, 1rem); padding: clamp(12px,2vw,14px) clamp(22px,4vw,32px);
          border-radius: 12px; display: flex; align-items: center; gap: 8px;
          transition: background 0.15s; font-family: inherit; white-space: nowrap;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .de-hero-btn-secondary:hover { background: rgba(255,255,255,0.09); }

        /* ── Tablet breakpoint ── */
        @media (max-width: 900px) {
          .de-features-grid { grid-template-columns: repeat(2, 1fr); }
          .de-roles-grid    { grid-template-columns: repeat(2, 1fr); }
          .de-testi-grid    { grid-template-columns: repeat(2, 1fr); }
          .de-footer-grid   { grid-template-columns: 1fr 1fr; gap: 28px; }
          .de-stats-grid    { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile breakpoint ── */
        @media (max-width: 600px) {
          .de-nav-links  { display: none; }
          .de-hamburger  { display: flex; }
          .de-features-grid { grid-template-columns: 1fr; }
          .de-roles-grid    { grid-template-columns: 1fr; }
          .de-testi-grid    { grid-template-columns: 1fr; }
          .de-footer-grid   { grid-template-columns: 1fr; gap: 24px; }
          .de-stats-grid    { grid-template-columns: repeat(2, 1fr); }
          .de-footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }

        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,11,20,0.85)' }}>
        <div className="de-container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15, flexShrink: 0 }}>D</div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>DormEase</span>
          </div>

          {/* Desktop nav */}
          <nav className="de-nav-links">
            {['Features', 'Roles', 'Testimonials'].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`} className="de-nav-link">{n}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={goLogin} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.875rem', padding: '8px 10px', borderRadius: 8, transition: 'color 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              className="de-nav-links" /* hide on mobile via .de-nav-links display:none */
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>Sign In</button>
            <button onClick={goLogin} style={{ background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.875rem', padding: '9px 18px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Get Started <ArrowRight size={13} />
            </button>
            {/* Hamburger */}
            <button className="de-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`de-mobile-menu${menuOpen ? ' open' : ''}`}>
          {['Features', 'Roles', 'Testimonials'].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="de-mobile-link" onClick={() => setMenuOpen(false)}>{n}</a>
          ))}
          <button onClick={() => { setMenuOpen(false); goLogin(); }}
            style={{ marginTop: 12, background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.95rem', padding: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign In / Get Started
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: 'clamp(64px,10vw,120px) 0 clamp(56px,8vw,100px)', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 'min(600px, 100vw)', height: 'min(600px, 100vw)', background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 80, left: '5%', width: 260, height: 260, background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 60, right: '4%', width: 220, height: 220, background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="de-container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...glass, borderRadius: 100, padding: '6px 16px', marginBottom: 28, color: '#818cf8', fontSize: '0.78rem', fontWeight: 600 }}>
              <Zap size={12} fill="#818cf8" /> Trusted by 50+ institutions across India
            </div>

            <h1 style={{ margin: '0 0 18px', fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', color: '#fff' }}>
              Smart Hostel Management<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #e94560 60%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Made Effortless
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
              One intelligent platform for admins, wardens and students to manage rooms, fees, complaints and leave — seamlessly.
            </p>

            <div className="de-cta-row">
              <button onClick={goLogin} className="de-hero-btn-primary">Get Started Free <ArrowRight size={15} /></button>
              <button onClick={goLogin} className="de-hero-btn-secondary">View Live Demo</button>
            </div>

            {/* Stats */}
            <div className="de-stats-grid" style={{ ...glass, borderRadius: 16, overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
              {STATS.map(({ value, label }, i) => (
                <div key={label} style={{ padding: 'clamp(16px,3vw,24px) 12px', textAlign: 'center', borderRight: i % 2 === 0 && i !== STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 'clamp(1.4rem,3vw,1.75rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) 0' }}>
        <div className="de-container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <p style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Features</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem,3.5vw,2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Everything you need to run a hostel</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 10, fontSize: 'clamp(0.875rem,2vw,1rem)', maxWidth: 500, margin: '10px auto 0' }}>Powerful tools for every role — no spreadsheets, no manual work.</p>
          </div>

          <div className="de-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
              <div key={title}
                style={{ ...glass, borderRadius: 20, padding: 'clamp(20px,3vw,28px)', cursor: 'default', transition: 'all 0.2s', ...(hoveredFeature === title ? { background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}40`, boxShadow: `0 0 40px ${glow}` } : {}) }}
                onMouseEnter={() => setHoveredFeature(title)}
                onMouseLeave={() => setHoveredFeature(null)}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color, border: `1px solid ${color}30`, flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 'clamp(0.9rem,1.5vw,1rem)', fontWeight: 700, color: '#fff' }}>{title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(0.8rem,1.5vw,0.875rem)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" style={{ padding: 'clamp(60px,8vw,100px) 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="de-container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <p style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Who it's for</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem,3.5vw,2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Three roles, one platform</h2>
          </div>

          <div className="de-roles-grid">
            {ROLES.map(({ role, color, desc, perks }) => (
              <div key={role}
                style={{ ...glass, borderRadius: 20, padding: 'clamp(22px,3vw,32px)', transition: 'all 0.2s', ...(hoveredRole === role ? { background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}50`, transform: 'translateY(-4px)' } : {}) }}
                onMouseEnter={() => setHoveredRole(role)}
                onMouseLeave={() => setHoveredRole(null)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '0.9rem', fontWeight: 800, border: `1px solid ${color}30`, flexShrink: 0 }}>
                    {role[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{role}</p>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {perks.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(0.8rem,1.5vw,0.875rem)', color: 'rgba(255,255,255,0.6)' }}>
                      <CheckCircle2 size={14} style={{ color, flexShrink: 0 }} /> {p}
                    </li>
                  ))}
                </ul>
                <button onClick={goLogin} style={{ marginTop: 22, width: '100%', padding: '10px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, color, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${color}25`}
                  onMouseLeave={e => e.currentTarget.style.background = `${color}15`}>
                  Sign in as {role} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: 'clamp(60px,8vw,100px) 0' }}>
        <div className="de-container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <p style={{ color: '#fb923c', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Testimonials</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem,3.5vw,2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Loved by thousands</h2>
          </div>

          <div className="de-testi-grid">
            {TESTIMONIALS.map(({ stars, text, name, role, init, color }) => (
              <div key={name} style={{ ...glass, borderRadius: 20, padding: 'clamp(20px,3vw,28px)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.82rem,1.5vw,0.9rem)', lineHeight: 1.75 }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}25`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{init}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{name}</p>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: 'clamp(56px,7vw,80px) 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(233,69,96,0.08) 50%, rgba(52,211,153,0.06) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div className="de-container" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.5rem,3.5vw,2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Ready to transform your hostel?</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontSize: 'clamp(0.875rem,2vw,1rem)', lineHeight: 1.65 }}>Join thousands of students and administrators already using DormEase.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={goLogin} className="de-hero-btn-primary" style={{ boxShadow: '0 0 40px rgba(129,140,248,0.25)' }}>Get Started Today <ArrowRight size={15} /></button>
              <button onClick={goLogin} className="de-hero-btn-secondary">Sign In</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(36px,5vw,48px) 0 clamp(24px,3vw,32px)' }}>
        <div className="de-container">
          <div className="de-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>D</div>
                <span style={{ fontWeight: 700, color: '#fff' }}>DormEase</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>Smart hostel management for modern educational institutions.</p>
            </div>
            {[
              ['Product', ['Features', 'Pricing', 'Demo', 'Changelog']],
              ['Company', ['About Us', 'Blog', 'Careers']],
              ['Support', ['Help Center', 'Contact', 'Privacy']],
            ].map(([heading, links]) => (
              <div key={heading}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{heading}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(l => (
                    <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="de-footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>© 2026 DormEase. All rights reserved.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
              <Shield size={11} /> Secure · Reliable · Fast
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}