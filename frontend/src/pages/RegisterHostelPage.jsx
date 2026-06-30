import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Mail, Phone, MapPin, ArrowRight, CheckCircle2, Hash, FileText } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterHostelPage() {
  const [form, setForm] = useState({
    name: '', type: 'co-ed',
    contactName: '', contactEmail: '', contactPhone: '',
    phone: '', email: '',
    city: '', state: '', pincode: '', street: '',
    description: '', establishedYear: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/hostels/register', {
        ...form,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px 11px 40px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const inpNoIcon = { ...inp, paddingLeft: 14 };
  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };
  const iconS = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' };
  const focus = (e) => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; };
  const blur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif", padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={34} color="#34d399" />
        </div>
        <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 12px' }}>Application Submitted!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 28px' }}>
          Your hostel registration has been sent to the DormEase super admin for review. You'll receive an email at <strong style={{ color: '#818cf8' }}>{form.contactEmail}</strong> once a decision is made.
        </p>
        <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 12, padding: '16px', marginBottom: 28, textAlign: 'left' }}>
          <p style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, margin: '0 0 10px' }}>What happens next?</p>
          {[
            'Super admin reviews your hostel details',
            'You receive an approval or feedback email',
            'On approval, an admin account is created for your hostel',
            'Students and wardens can register under your hostel',
          ].map((s, i) => (
            <p key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0 0 6px', lineHeight: 1.5 }}>
              {i + 1}. {s}
            </p>
          ))}
        </div>
        <Link to="/" style={{ display: 'block', padding: '12px', background: 'linear-gradient(135deg,#818cf8,#e94560)', borderRadius: 12, color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', fontFamily: "'DM Sans',system-ui,sans-serif", padding: '32px 24px' }}>
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#818cf8,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 17 }}>D</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>DormEase</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Register Your Hostel</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: 0 }}>Submit your hostel for review — our super admin will approve it within 1–2 business days</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Hostel Details */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, marginBottom: 16 }}>
            <h3 style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏨 Hostel Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Hostel Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={14} style={iconS} />
                  <input style={inp} placeholder="e.g. Sunrise Boys Hostel" value={form.name} onChange={set('name')} required onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={lbl}>Type</label>
                <select style={inpNoIcon} value={form.type} onChange={set('type')}>
                  <option value="boys" style={{ background: '#1a1a2e' }}>Boys</option>
                  <option value="girls" style={{ background: '#1a1a2e' }}>Girls</option>
                  <option value="co-ed" style={{ background: '#1a1a2e' }}>Co-Ed</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Established Year</label>
                <input style={inpNoIcon} type="number" placeholder="e.g. 2010" value={form.establishedYear} onChange={set('establishedYear')} min={1900} max={new Date().getFullYear()} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={lbl}>Hostel Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconS} />
                  <input style={inp} placeholder="Hostel contact number" value={form.phone} onChange={set('phone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={lbl}>Hostel Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iconS} />
                  <input type="email" style={inp} placeholder="hostel@email.com" value={form.email} onChange={set('email')} onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inpNoIcon, minHeight: 80, resize: 'vertical' }} placeholder="Brief description of your hostel…" value={form.description} onChange={set('description')} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, marginBottom: 16 }}>
            <h3 style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📍 Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Street Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={iconS} />
                  <input style={inp} placeholder="Street / Area" value={form.street} onChange={set('street')} onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={lbl}>City *</label>
                <input style={inpNoIcon} placeholder="City" value={form.city} onChange={set('city')} required onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={lbl}>State *</label>
                <input style={inpNoIcon} placeholder="State" value={form.state} onChange={set('state')} required onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={lbl}>Pincode</label>
                <input style={inpNoIcon} placeholder="Pincode" value={form.pincode} onChange={set('pincode')} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <h3 style={{ color: '#fb923c', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Contact Person</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconS} />
                  <input style={inp} placeholder="Your full name" value={form.contactName} onChange={set('contactName')} required onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={lbl}>Email * (notifications sent here)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iconS} />
                  <input type="email" style={inp} placeholder="your@email.com" value={form.contactEmail} onChange={set('contactEmail')} required onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconS} />
                  <input style={inp} placeholder="Your phone number" value={form.contactPhone} onChange={set('contactPhone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ margin: 0, color: 'rgba(129,140,248,0.9)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              📋 Your application will be reviewed by the DormEase super admin. Once approved, you'll receive a unique hostel code and an admin account will be set up for you.
            </p>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? 'rgba(129,140,248,0.35)' : 'linear-gradient(135deg,#818cf8,#e94560)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Submitting…' : <><span>Submit Hostel Registration</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          {' · '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Register as student</Link>
        </p>
      </div>
    </div>
  );
}
