/**
 * DormEase Email Utility — all emails via Google Apps Script webhook.
 * Set APPS_SCRIPT_URL and FRONTEND_URL in backend/.env
 */

async function sendViaAppsScript({ to, subject, html }) {
  const url = process.env.APPS_SCRIPT_URL;

  if (!url) {
    console.log('\n📧 [EMAIL — set APPS_SCRIPT_URL in .env to send]');
    console.log('   To:', to, '| Subject:', subject, '\n');
    return { sent: false, reason: 'APPS_SCRIPT_URL not set' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    const text = await res.text();

    if (text.trim().startsWith('<')) {
      console.error('❌ Apps Script returned HTML — check /exec URL and "Anyone" access setting.');
      return { sent: false, reason: 'Apps Script misconfigured' };
    }

    const json = JSON.parse(text);
    if (json.success) {
      console.log(`✅ Email sent → ${to}`);
      return { sent: true };
    }

    console.error('❌ Apps Script error:', json.error || 'Unknown error');
    return { sent: false, reason: json.error || 'Unknown error' };

  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendEmail({ to, subject, html }) {
  return sendViaAppsScript({ to, subject, html });
}

async function sendOtpEmail({ to, name, otp, purpose = 'login' }) {
  const subject = purpose === 'login'
    ? 'DormEase — Your Login OTP'
    : 'DormEase — Verify Your Email';

  const result = await sendViaAppsScript({ to, subject, html: templates.otp(name, otp, purpose) });

  if (!result.sent) {
    console.log(`\n🔐 [OTP for ${to}]: ${otp}  (expires 10 min)\n`);
  }

  return result;
}

// ── Shared layout ─────────────────────────────────────────────────────────────

const FRONTEND = () => process.env.FRONTEND_URL || 'https://dorm-ease-hostel-management-system.vercel.app';

const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DormEase</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <div style="display:inline-block;width:48px;height:48px;background:#e94560;border-radius:14px;line-height:48px;text-align:center;font-size:22px;font-weight:900;color:#fff;letter-spacing:-1px;">D</div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">DormEase</span>
              <span style="display:block;font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;font-weight:500;letter-spacing:0.05em;">HOSTEL MANAGEMENT SYSTEM</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">This is an automated email from DormEase. Please do not reply.</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} DormEase · Hostel Management System</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

// ── Reusable blocks ───────────────────────────────────────────────────────────

const greeting = (name) =>
  `<p style="margin:0 0 8px;font-size:15px;color:#1e293b;font-weight:700;">Hi ${name} 👋</p>`;

const para = (text) =>
  `<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">${text}</p>`;

const divider = () =>
  `<div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>`;

const infoBox = ({ bg, border, rows }) => {
  const rowsHtml = rows.map(([label, value, valueColor]) =>
    `<tr>
      <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%;">${label}</td>
      <td style="padding:8px 0;font-size:13px;color:${valueColor || '#1e293b'};font-weight:700;text-align:right;">${value}</td>
    </tr>`
  ).join('<tr><td colspan="2"><div style="height:1px;background:' + border + ';opacity:0.4;"></div></td></tr>');

  return `
  <div style="background:${bg};border:1.5px solid ${border};border-radius:12px;padding:4px 20px;margin:20px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rowsHtml}
    </table>
  </div>`;
};

const ctaButton = (text, url, color = '#4f46e5') =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.01em;">
        ${text}
      </a>
    </td></tr>
  </table>
  <p style="text-align:center;margin:8px 0 0;font-size:11px;color:#94a3b8;">Or copy this link: <a href="${url}" style="color:#6366f1;word-break:break-all;">${url}</a></p>`;

const statusBadge = (label, color, bg) =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:${color};background:${bg};letter-spacing:0.04em;">${label}</span>`;

// ── Templates ─────────────────────────────────────────────────────────────────

const templates = {

  registrationReceived: (name, role) => layout(
    greeting(name) +
    para(`Thank you for registering as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong> on DormEase. Your request has been received and is currently under review by the hostel admin.`) +
    infoBox({
      bg: '#fefce8', border: '#fde68a',
      rows: [
        ['Status', statusBadge('Pending Review', '#92400e', '#fef3c7'), ''],
        ['Role', role.charAt(0).toUpperCase() + role.slice(1), '#1e293b'],
        ['Name', name, '#1e293b'],
      ]
    }) +
    para("We'll notify you by email as soon as the admin reviews your request. This usually takes 1–2 business days.") +
    divider() +
    para(`<span style="font-size:12px;color:#94a3b8;">Questions? Contact the hostel administration directly.</span>`)
  ),

  approved: (name, email, role = 'user') => layout(
    `<div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#dcfce7;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">✅</div>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e293b;">You're Approved!</h2>
      <p style="margin:0;font-size:14px;color:#64748b;">Your DormEase account is ready</p>
    </div>` +
    greeting(name) +
    para(`Congratulations! Your ${role} account on DormEase has been <strong style="color:#16a34a;">approved</strong> by the hostel administrator. You can now log in and get started.`) +
    infoBox({
      bg: '#f0fdf4', border: '#86efac',
      rows: [
        ['Account Status', statusBadge('Approved', '#166534', '#dcfce7'), ''],
        ['Login Email', email, '#1e293b'],
        ['Role', role.charAt(0).toUpperCase() + role.slice(1), '#1e293b'],
      ]
    }) +
    para('Click the button below to open DormEase. Enter your email, verify with a one-time OTP, and set your password — takes less than a minute!') +
    ctaButton('🚀 Open DormEase & Login', `${FRONTEND()}/login`, 'linear-gradient(135deg,#4f46e5,#7c3aed)') +
    divider() +
    para(`<span style="font-size:12px;color:#94a3b8;"><strong>First time logging in?</strong> Enter your email → receive OTP → verify → set your password. Simple!</span>`)
  ),

  rejected: (name, reason) => layout(
    `<div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#fee2e2;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">❌</div>
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1e293b;">Registration Update</h2>
    </div>` +
    greeting(name) +
    para('We regret to inform you that your DormEase registration request was <strong style="color:#dc2626;">not approved</strong> at this time.') +
    (reason ? infoBox({
      bg: '#fef2f2', border: '#fca5a5',
      rows: [['Reason', reason, '#991b1b']]
    }) : '') +
    para('If you believe this is a mistake or would like to appeal this decision, please contact the hostel administration directly.') +
    divider() +
    para(`<span style="font-size:12px;color:#94a3b8;">You may re-register with corrected information if applicable.</span>`)
  ),

  otp: (name, otp, purpose) => layout(
    `<div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#eff6ff;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">🔐</div>
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1e293b;">${purpose === 'login' ? 'Your Login OTP' : 'Verify Your Email'}</h2>
    </div>` +
    greeting(name) +
    para(purpose === 'login'
      ? 'Use the one-time password below to complete your login. It expires in <strong>10 minutes</strong>.'
      : 'Use the code below to verify your email address.') +
    `<div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:28px 20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">One-Time Password</p>
      <p style="margin:0;font-size:44px;font-weight:900;color:#1e40af;letter-spacing:0.25em;font-family:'Courier New',monospace;">${otp}</p>
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">⏱ Valid for <strong>10 minutes</strong> only</p>
    </div>` +
    infoBox({
      bg: '#fff7ed', border: '#fed7aa',
      rows: [['⚠️ Security', 'Never share this OTP with anyone. DormEase will never ask for it.', '#92400e']]
    })
  ),

  passwordReset: (name, email, newPassword) => layout(
    greeting(name) +
    para('Your DormEase account password has been <strong>reset</strong> by the administrator. Use the credentials below to log in.') +
    infoBox({
      bg: '#eff6ff', border: '#bfdbfe',
      rows: [
        ['Email', email, '#1e40af'],
        ['New Password', newPassword, '#1e40af'],
      ]
    }) +
    ctaButton('Login to DormEase', `${FRONTEND()}/login`, 'linear-gradient(135deg,#4f46e5,#7c3aed)') +
    para('<span style="font-size:12px;color:#94a3b8;">For your security, please change this password immediately after logging in.</span>')
  ),

  billPaid: (name, receipt) => layout(
    `<div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#dcfce7;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">💳</div>
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1e293b;">Payment Confirmed</h2>
    </div>` +
    greeting(name) +
    para(`Your fee payment of <strong style="color:#16a34a;font-size:16px;">₹${receipt.amount?.toLocaleString()}</strong> has been successfully recorded.`) +
    infoBox({
      bg: '#f0fdf4', border: '#86efac',
      rows: [
        ['Status', statusBadge('Paid', '#166534', '#dcfce7'), ''],
        ['Receipt No.', receipt.receiptNumber, '#1e293b'],
        ['Amount', '₹' + receipt.amount?.toLocaleString(), '#16a34a'],
        ['Date', new Date(receipt.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), '#1e293b'],
      ]
    }) +
    ctaButton('View Receipt in DormEase', `${FRONTEND()}/student`, '#16a34a')
  ),

  hostelRegistrationReceived: (contactName, hostelName) => layout(
    greeting(contactName) +
    para(`Thank you for registering <strong>${hostelName}</strong> on DormEase. Your application has been submitted and is under review by our super admin.`) +
    infoBox({
      bg: '#fefce8', border: '#fde68a',
      rows: [
        ['Status', statusBadge('Pending Review', '#92400e', '#fef3c7'), ''],
        ['Hostel', hostelName, '#1e293b'],
      ]
    }) +
    para("We'll notify you by email once your hostel is reviewed. This usually takes 1–2 business days.") +
    divider() +
    para('<span style="font-size:12px;color:#94a3b8;">Questions? Contact DormEase support.</span>')
  ),

  hostelApproved: (contactName, hostelName, code) => layout(
  `<div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:64px;height:64px;background:#dcfce7;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">🏨</div>
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e293b;">Hostel Approved!</h2>
    <p style="margin:0;font-size:14px;color:#64748b;">${hostelName} is now live on DormEase</p>
  </div>` +
  greeting(contactName) +
  para(`Great news! <strong>${hostelName}</strong> has been <strong style="color:#16a34a;">approved</strong> and is now active on DormEase.`) +
  infoBox({
    bg: '#f0fdf4',
    border: '#86efac',
    rows: [
      ['Status', statusBadge('Approved', '#166534', '#dcfce7'), ''],
      ['Hostel Name', hostelName, '#1e293b'],
      ['Hostel Code', code, '#4f46e5'],
    ]
  }) +
  para('An admin account will be created for your hostel shortly. You will receive another email with your login credentials.') +
  ctaButton('Visit DormEase', FRONTEND(), 'linear-gradient(135deg,#4f46e5,#7c3aed)')
),

  hostelRejected: (contactName, hostelName, reason) => layout(
  `<div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:64px;height:64px;background:#fee2e2;border-radius:50%;line-height:64px;font-size:28px;margin-bottom:12px;">❌</div>
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1e293b;">Application Not Approved</h2>
  </div>` +
  greeting(contactName) +
  para(`We're sorry to inform you that the registration for <strong>${hostelName}</strong> was not approved at this time.`) +
  (reason ? infoBox({
    bg: '#fef2f2',
    border: '#fca5a5',
    rows: [['Reason', reason, '#991b1b']]
  }) : '') +
  para('If you believe this is a mistake, please contact DormEase support.') +
  divider() +
  para('<span style="font-size:12px;color:#94a3b8;">You may reapply with updated information if applicable.</span>')
),

  adminAssigned: (name, email, password, hostelName) => layout(
    greeting(name) +
    para(`You have been assigned as the <strong>Administrator</strong> for <strong>${hostelName}</strong> on DormEase.`) +
    infoBox({
      bg: '#eff6ff', border: '#bfdbfe',
      rows: [
        ['Hostel', hostelName, '#1e40af'],
        ['Email', email, '#1e40af'],
        ['Password', password, '#1e40af'],
      ]
    }) +
    ctaButton('Login to DormEase Admin Portal', `${FRONTEND()}/login`, 'linear-gradient(135deg,#4f46e5,#7c3aed)') +
    para('<span style="font-size:12px;color:#94a3b8;">Please change your password after your first login.</span>')
  ),

  paymentReceipt: (name, receipt) => layout(
    greeting(name) +
    para('Your payment has been received and processed. Here is your receipt:') +
    infoBox({
      bg: '#f8fafc', border: '#cbd5e1',
      rows: [
        ['Receipt No.', receipt.receiptNumber, '#1e293b'],
        ['Amount', '₹' + receipt.amount?.toLocaleString(), '#16a34a'],
        ['Fee Type', (receipt.feeType || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), '#1e293b'],
        ['Method', (receipt.paymentMethod || '—').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), '#1e293b'],
        ['Paid On', new Date(receipt.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), '#1e293b'],
      ]
    }) +
    ctaButton('View Full Receipt', `${FRONTEND()}/student`, '#4f46e5')
  ),
};

module.exports = { sendEmail, sendOtpEmail, templates };
