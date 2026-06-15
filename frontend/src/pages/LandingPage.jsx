import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Building2, DollarSign, AlertCircle, Users, CalendarDays,
  BarChart3, ArrowRight, CheckCircle2, Shield, Zap, Star,
  Menu, X, Wifi, Clock, Bell,
} from 'lucide-react';

const FEATURES = [
  { icon: Building2,   title: 'Room Allocation',      desc: 'Real-time occupancy tracking with floor-wise views and instant assignment.',  color: '#818cf8', glow: 'rgba(129,140,248,0.15)' },
  { icon: DollarSign,  title: 'Fee Management',        desc: 'Automated billing, payment tracking, receipts and overdue alerts.',           color: '#34d399', glow: 'rgba(52,211,153,0.15)'  },
  { icon: AlertCircle, title: 'Complaint Resolution',  desc: 'Priority-based tickets with full timeline, assignment and resolution notes.', color: '#fb923c', glow: 'rgba(251,146,60,0.15)'  },
  { icon: Users,       title: 'Student Management',    desc: 'Centralised profiles with academic, personal and emergency contact data.',    color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  { icon: CalendarDays,title: 'Leave Workflow',        desc: 'Digital applications flow through warden approval with instant updates.',     color: '#22d3ee', glow: 'rgba(34,211,238,0.15)'  },
  { icon: BarChart3,   title: 'Analytics',             desc: 'Live dashboards for occupancy, revenue and complaint resolution rates.',      color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
];

const ROLES = [
  {
    role: 'Admin',
    color: '#818cf8',
    desc: 'Full system control',
    perks: ['Manage wardens & students', 'Room allocation & fees', 'System-wide analytics', 'Post notices & reports'],
  },
  {
    role: 'Warden',
    color: '#34d399',
    desc: 'Day-to-day operations',
    perks: ['View assigned students', 'Approve leave requests', 'Resolve complaints', 'Post floor notices'],
  },
  {
    role: 'Student',
    color: '#fb923c',
    desc: 'Personal portal',
    perks: ['View room & roommates', 'Track fee payments', 'Submit complaints', 'Apply for leave'],
  },
];

const TESTIMONIALS = [
  { stars: 5, text: 'DormEase transformed how we manage our 500+ student hostel. The automation saves 15+ hours every week.', name: 'Dr. Rajesh Kumar', role: 'Hostel Warden, IIT Delhi', init: 'R', color: '#818cf8' },
  { stars: 5, text: 'Finally a modern way to manage hostel life. From fee payments to complaints — everything is one click.', name: 'Priya Sharma', role: 'Student, NIT Trichy', init: 'P', color: '#34d399' },
  { stars: 5, text: 'The analytics gave us unprecedented visibility into hostel operations. Adoption was instant.', name: 'Amit Patel', role: 'Admin, VIT Vellore', init: 'A', color: '#fb923c' },
];

const STATS = [
  { value: '10K+', label: 'Students' },
  { value: '50+',  label: 'Hostels'  },
  { value: '99.9%',label: 'Uptime'   },
  { value: '24/7', label: 'Support'  },
];

/* ─── tiny inline style helpers ─────────────────────────────────── */
const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const glassHover = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.14)',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);

  const goLogin = () => navigate('/login');

  return (
    <div style={{ background: '#080b14', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,11,20,0.8)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15 }}>D</div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>DormEase</span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden-mobile">
            {['Features', 'Roles', 'Testimonials'].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>{n}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={goLogin} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.875rem', padding: '8px 12px', borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>Sign In</button>
            <button onClick={goLogin} style={{ background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.875rem', padding: '9px 20px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '120px 24px 100px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 80, left: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 60, right: '8%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...glass, borderRadius: 100, padding: '6px 16px', marginBottom: 32, color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
            <Zap size={13} fill="#818cf8" /> Trusted by 50+ institutions across India
          </div>

          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(2.6rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.04em', color: '#fff' }}>
            Smart Hostel Management<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #e94560 60%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Made Effortless
            </span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', marginBottom: 44, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 44px' }}>
            One intelligent platform for admins, wardens and students to manage rooms, fees, complaints and leave requests — seamlessly.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
            <button onClick={goLogin} style={{ background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '14px 32px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, opacity 0.15s', boxShadow: '0 0 40px rgba(129,140,248,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1'; }}>
              Get Started Free <ArrowRight size={16} />
            </button>
            <button onClick={goLogin} style={{ ...glass, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '1rem', padding: '14px 32px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
              View Live Demo
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, ...glass, borderRadius: 16, overflow: 'hidden', maxWidth: 680, margin: '0 auto' }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ padding: '24px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Features</p>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Everything you need to run a hostel</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 12, fontSize: '1rem', maxWidth: 520, margin: '12px auto 0' }}>Powerful tools designed for every role — no spreadsheets, no manual work.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
            <div key={title}
              style={{ ...glass, borderRadius: 20, padding: '28px', cursor: 'default', transition: 'all 0.2s', ...(hoveredFeature === title ? { background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}40`, boxShadow: `0 0 40px ${glow}` } : {}) }}
              onMouseEnter={() => setHoveredFeature(title)}
              onMouseLeave={() => setHoveredFeature(null)}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color, border: `1px solid ${color}30` }}>
                <Icon size={22} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{title}</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────── */}
      <section id="roles" style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Who it's for</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Three roles, one platform</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {ROLES.map(({ role, color, desc, perks }) => (
              <div key={role}
                style={{ ...glass, borderRadius: 20, padding: '32px', transition: 'all 0.2s', ...(hoveredRole === role ? { background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}50`, transform: 'translateY(-4px)' } : {}) }}
                onMouseEnter={() => setHoveredRole(role)}
                onMouseLeave={() => setHoveredRole(null)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '0.9rem', fontWeight: 800, border: `1px solid ${color}30` }}>
                    {role[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{role}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {perks.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      <CheckCircle2 size={15} style={{ color, flexShrink: 0 }} /> {p}
                    </li>
                  ))}
                </ul>
                <button onClick={goLogin} style={{ marginTop: 24, width: '100%', padding: '10px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, color, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${color}25`}
                  onMouseLeave={e => e.currentTarget.style.background = `${color}15`}>
                  Sign in as {role} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Loved by thousands</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(({ stars, text, name, role, init, color }) => (
              <div key={name} style={{ ...glass, borderRadius: 20, padding: '28px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.75 }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}25`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{init}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>{name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(233,69,96,0.08) 50%, rgba(52,211,153,0.06) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Ready to transform your hostel?</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 40, fontSize: '1rem', lineHeight: 1.65 }}>Join thousands of students and administrators already using DormEase.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goLogin} style={{ background: 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '14px 36px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.15s', boxShadow: '0 0 40px rgba(129,140,248,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Get Started Today <ArrowRight size={16} />
            </button>
            <button onClick={goLogin} style={{ ...glass, cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '1rem', padding: '14px 32px', borderRadius: 12, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>D</div>
                <span style={{ fontWeight: 700, color: '#fff' }}>DormEase</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>Smart hostel management for modern educational institutions.</p>
            </div>
            {[
              ['Product',  ['Features', 'Pricing', 'Demo', 'Changelog']],
              ['Company',  ['About Us', 'Blog', 'Careers']],
              ['Support',  ['Help Center', 'Contact', 'Privacy']],
            ].map(([heading, links]) => (
              <div key={heading}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{heading}</h4>
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
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>© 2026 DormEase. All rights reserved.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
              <Shield size={12} /> Secure · Reliable · Fast
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}