/**
 * email.js — Nodemailer transporter and email helpers.
 *
 * Reads SMTP credentials from environment variables.
 * If EMAIL_HOST/USER/PASS are not configured, falls back to
 * logging the email to the console (safe for development).
 */
const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env

  const isConfigured =
    EMAIL_HOST && EMAIL_HOST !== 'smtp.gmail.com' || // custom host is always configured
    (EMAIL_HOST === 'smtp.gmail.com' &&
     EMAIL_USER && EMAIL_USER !== 'your_email@gmail.com' &&
     EMAIL_PASS && EMAIL_PASS !== 'your_app_password')

  if (!isConfigured) {
    // Dev fallback — log to console
    return null
  }

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || '587', 10),
    secure: parseInt(EMAIL_PORT || '587', 10) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })

  return _transporter
}

/**
 * sendEmail — send a transactional email.
 * In development (EMAIL not configured), logs to console instead.
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter()

  if (!transporter) {
    // Development mode — print to console so devs can see the link
    console.log('\n' + '─'.repeat(60))
    console.log('📧 [DEV EMAIL — not actually sent]')
    console.log(`TO: ${to}`)
    console.log(`SUBJECT: ${subject}`)
    console.log(text || html)
    console.log('─'.repeat(60) + '\n')
    return
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `ScrapBazaar <noreply@scrapbazaar.in>`,
    to,
    subject,
    html,
    text,
  })
}

/**
 * sendPasswordResetEmail — sends the reset link to the user.
 */
exports.sendPasswordResetEmail = async (email, resetUrl, name) => {
  await exports.sendEmail({
    to: email,
    subject: 'Reset your ScrapBazaar password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <div style="background:#1B6B3A;padding:16px 24px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:1.25rem">ScrapBazaar</h1>
        </div>
        <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin-top:0;color:#0f172a">Password Reset Request</h2>
          <p style="color:#475569">Hi ${name || 'there'},</p>
          <p style="color:#475569">
            We received a request to reset the password for your ScrapBazaar account.
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="background:#1B6B3A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Reset My Password
            </a>
          </div>
          <p style="color:#64748b;font-size:0.875rem">
            Or copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" style="color:#1B6B3A;word-break:break-all">${resetUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:0.8rem">
            If you did not request a password reset, you can safely ignore this email.
            Your password will not change.
          </p>
        </div>
      </div>
    `,
    text: `Reset your ScrapBazaar password\n\nHi ${name || 'there'},\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  })
}

/**
 * sendVerificationApprovedEmail — sent when admin approves KYC.
 */
exports.sendVerificationApprovedEmail = async (email, name, role) => {
  await exports.sendEmail({
    to: email,
    subject: 'Your ScrapBazaar business is verified ✅',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <div style="background:#1B6B3A;padding:16px 24px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:1.25rem">ScrapBazaar</h1>
        </div>
        <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="color:#1B6B3A;margin-top:0">🎉 Business Verified!</h2>
          <p style="color:#475569">Hi ${name},</p>
          <p style="color:#475569">
            Congratulations! Your business has been verified and approved on ScrapBazaar.
            You can now access all marketplace features as a <strong>${role}</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/${role}/overview"
               style="background:#1B6B3A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nYour business has been verified on ScrapBazaar. You can now access all features as a ${role}.\n\nLogin at: ${process.env.FRONTEND_URL || 'http://localhost:5174'}/auth/login`,
  })
}
