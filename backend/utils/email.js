/**
 * Email utility — sends transactional emails via Resend's HTTP API.
 *
 * Why Resend instead of SMTP/Gmail?
 * Render (and most PaaS free tiers) block outbound SMTP ports (25, 465, 587)
 * on free/starter plans, which causes Gmail SMTP to time out or get refused.
 * Resend sends mail over a normal HTTPS POST request, so it works
 * everywhere Render allows outbound HTTPS — no port issues at all.
 *
 * Setup:
 *   1. Sign up free at https://resend.com  (no card required)
 *   2. Verify your sending domain OR use their default
 *      "onboarding@resend.dev" sender for testing (no domain needed).
 *   3. Create an API key → copy it.
 *   4. Add to your .env:
 *        RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
 *        EMAIL_FROM=DormEase <onboarding@resend.dev>
 *
 * If RESEND_API_KEY is not set, emails are logged to console instead of
 * failing the request — keeps the app usable without setup.
 */
const { Resend } = require('resend');

let resendClient = null;

function getClient() {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) return null;
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Send an email. Falls back to console logging if Resend isn't configured,
 * so registration/approval flows never break in local dev or before setup.
 */
async function sendEmail({ to, subject, html }) {
  const client = getClient();

  if (!client) {
    console.log('\n📧 [EMAIL NOT SENT — RESEND_API_KEY not configured]');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   (Set RESEND_API_KEY and EMAIL_FROM in .env to enable real emails)\n');
    return { sent: false, reason: 'Resend not configured' };
  }

  try {
    const result = await client.emails.send({
      from: process.env.EMAIL_FROM || 'DormEase <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error.message);
      return { sent: false, reason: result.error.message };
    }

    return { sent: true, id: result.data?.id };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

/* ── Email templates (unchanged from before) ────────────────────── */

const wrapTemplate = (title, bodyHtml) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 32px 24px;">
  <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #eaecf4;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <div style="width: 32px; height: 32px; border-radius: 9px; background: #e94560; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 14px;">D</div>
      <span style="font-weight: 700; font-size: 16px; color: #0f0f23;">DormEase</span>
    </div>
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f0f23;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top: 28px; font-size: 12px; color: #9ca3af;">This is an automated message from DormEase Hostel Management System.</p>
  </div>
</div>
`;

const templates = {
  registrationReceived: (name, role) => wrapTemplate(
    'Registration Received',
    `<p style="color:#374151;font-size:14px;line-height:1.6;">Hi ${name},</p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">
       Thank you for registering as a <strong>${role}</strong> on DormEase. Your request has been submitted and is now pending review by the hostel admin.
     </p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">You'll receive another email once your account is approved and ready to use.</p>`
  ),

  approved: (name, email) => wrapTemplate(
    'Your Account Has Been Approved! 🎉',
    `<p style="color:#374151;font-size:14px;line-height:1.6;">Hi ${name},</p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">
       Great news — your DormEase account has been <strong style="color:#059669;">approved</strong> by the admin. You can now log in using your registered email and password.
     </p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin:16px 0;">
       <p style="margin:0;font-size:13px;color:#166534;"><strong>Login Email:</strong> ${email}</p>
     </div>`
  ),

  rejected: (name, reason) => wrapTemplate(
    'Update on Your DormEase Registration',
    `<p style="color:#374151;font-size:14px;line-height:1.6;">Hi ${name},</p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">
       We're sorry to inform you that your registration request was <strong style="color:#dc2626;">not approved</strong>.
     </p>
     ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
     <p style="color:#374151;font-size:14px;line-height:1.6;">If you believe this is a mistake, please contact the hostel administration.</p>`
  ),

  passwordReset: (name, email, newPassword) => wrapTemplate(
    'Your Password Has Been Reset',
    `<p style="color:#374151;font-size:14px;line-height:1.6;">Hi ${name},</p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">
       Your DormEase account password has been reset by the administrator. Use the credentials below to log in:
     </p>
     <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin:16px 0;">
       <p style="margin:0 0 4px;font-size:13px;color:#1e40af;"><strong>Email:</strong> ${email}</p>
       <p style="margin:0;font-size:13px;color:#1e40af;"><strong>New Password:</strong> ${newPassword}</p>
     </div>
     <p style="color:#9ca3af;font-size:12px;line-height:1.6;">For security, please change your password after logging in.</p>`
  ),

  paymentReceipt: (name, receipt) => wrapTemplate(
    'Payment Receipt — ' + receipt.receiptNumber,
    `<p style="color:#374151;font-size:14px;line-height:1.6;">Hi ${name},</p>
     <p style="color:#374151;font-size:14px;line-height:1.6;">Your payment has been received. Here are the details:</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Receipt No.</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px;">${receipt.receiptNumber}</td></tr>
       <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:14px;color:#059669;">₹${receipt.amount.toLocaleString()}</td></tr>
       <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Fee Type</td><td style="padding:6px 0;text-align:right;font-size:13px;text-transform:capitalize;">${receipt.feeType.replace(/-/g,' ')}</td></tr>
       <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Payment Method</td><td style="padding:6px 0;text-align:right;font-size:13px;text-transform:capitalize;">${(receipt.paymentMethod||'—').replace(/-/g,' ')}</td></tr>
       <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Paid On</td><td style="padding:6px 0;text-align:right;font-size:13px;">${new Date(receipt.paidDate).toLocaleDateString('en-IN')}</td></tr>
     </table>
     <p style="color:#374151;font-size:14px;line-height:1.6;">You can view and download the full receipt anytime from your DormEase fee history.</p>`
  ),
};

module.exports = { sendEmail, templates };