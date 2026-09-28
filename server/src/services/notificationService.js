const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.etherealTransporter = null;
  }

  getTwilioClient() {
    require('dotenv').config();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    if (twilioSid && twilioAuth) {
      try {
        const twilio = require('twilio');
        return twilio(twilioSid.trim(), twilioAuth.trim());
      } catch (err) {
        console.error('[NotificationService] Failed to initialize Twilio:', err.message);
      }
    }
    return null;
  }

  getEmailTransporter() {
    require('dotenv').config();
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    if (smtpUser && smtpPass) {
      const cleanUser = smtpUser.trim();
      const cleanPass = smtpPass.replace(/\s+/g, '');
      if (cleanUser.includes('@gmail.com') || smtpHost.includes('gmail')) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: cleanUser,
            pass: cleanPass
          }
        });
      }
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: cleanUser,
          pass: cleanPass
        }
      });
    }
    return null;
  }

  // Send real email OTP (for registration and MFA login)
  async sendEmailOtp(toEmail, code, purpose = 'register') {
    const isRegister = purpose === 'register';
    const subject = isRegister
      ? `${code} is your AuraTrade registration verification code`
      : `${code} is your AuraTrade verification code`;
    const actionText = isRegister
      ? 'To complete your AuraTrade account registration, please enter the one-time verification code below:'
      : 'A sign-in request was received for your AuraTrade account. Use this one-time code to authenticate:';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #050b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 520px; margin: 0 auto; background: #0c1424; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          <div style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #6366f1 100%); height: 4px;"></div>
          <div style="padding: 30px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #06b6d4; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">AuraTrade</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Institutional Trading Workstation</p>
            </div>

            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 22px;">
              <p style="color: #e2e8f0; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
                ${actionText}
              </p>
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; background: #061120; padding: 14px 20px; border-radius: 10px; border: 1px dashed #06b6d4; display: inline-block;">
                ${code}
              </div>
              <p style="color: #f59e0b; font-size: 12px; margin: 16px 0 0 0; font-weight: 500;">
                ⏱️ This code will expire in 10 minutes.
              </p>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
              If you didn't request this code, you can safely ignore this email. Never share this security code with anyone.
            </p>
          </div>
          <div style="background: #080e1a; padding: 14px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
            <p style="color: #475569; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} AuraTrade. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. If real SMTP (Gmail, Outlook, etc.) is configured in .env
    const transporter = this.getEmailTransporter();
    if (transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"AuraTrade Security" <${process.env.SMTP_USER}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          html: htmlContent
        });
        console.log(`✉️ [REAL EMAIL DELIVERED via Gmail] Verification code sent to ${toEmail}`);
        return { delivered: true, method: 'smtp', destination: toEmail };
      } catch (err) {
        console.error(`❌ [EMAIL DELIVERY ERROR] Failed to send email to ${toEmail}:`, err.message);
      }
    }

    // 2. Zero-config fallback: Send through real hosted Ethereal Mail inbox
    try {
      if (!this.etherealTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        this.etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      const info = await this.etherealTransporter.sendMail({
        from: '"AuraTrade Security" <security@auratrade.io>',
        to: toEmail,
        subject,
        html: htmlContent
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n======================================================`);
      console.log(`✉️ [REAL EMAIL SENT via Ethereal Inbox]`);
      console.log(`   To: ${toEmail}`);
      console.log(`   Verification Code: >>> [ ${code} ] <<<`);
      console.log(`   🔗 View Delivered Email: ${previewUrl}`);
      console.log(`   💡 Configure SMTP_USER & SMTP_PASS in Vercel for personal inbox delivery`);
      console.log(`======================================================\n`);

      return {
        delivered: true,
        method: 'ethereal',
        previewUrl,
        notice: 'Sent to virtual test inbox. Add SMTP_USER & SMTP_PASS to Vercel for personal Gmail delivery.'
      };
    } catch (err) {
      console.error('[NotificationService] Ethereal fallback failed:', err.message);
    }

    // Terminal fallback
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL GATEWAY] OTP for ${toEmail}`);
    console.log(`   Verification Code: >>> [ ${code} ] <<<`);
    console.log(`======================================================\n`);
    return {
      delivered: false,
      method: 'terminal-fallback',
      notice: 'Configure SMTP_USER & SMTP_PASS in Vercel for personal Gmail delivery.'
    };
  }

  // Send real Password Reset Email with clickable link & backup code
  async sendPasswordResetEmail(toEmail, resetToken, resetCode) {
    const baseUrl = process.env.APP_URL || process.env.CLIENT_URL || 'https://auratrade.in';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/?action=reset-password&token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;
    const subject = `Reset Your AuraTrade Password`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #050b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 520px; margin: 0 auto; background: #0c1424; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          <div style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #6366f1 100%); height: 4px;"></div>
          <div style="padding: 30px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #06b6d4; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">AuraTrade</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Institutional Security & Account Recovery</p>
            </div>

            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 22px;">
              <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 12px 0;">Reset Your Password</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0 0 22px 0;">
                We received a request to reset the password for <strong>${toEmail}</strong>. Click the button below to choose a new password:
              </p>

              <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4); margin-bottom: 20px;">
                Reset My Password ↗
              </a>

              <div style="border-top: 1px dashed rgba(255, 255, 255, 0.12); margin: 18px 0; padding-top: 16px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">Or enter this 6-digit security code:</p>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #06b6d4; background: #061120; padding: 8px 18px; border-radius: 8px; display: inline-block;">
                  ${resetCode}
                </div>
              </div>

              <p style="color: #f59e0b; font-size: 12px; margin: 14px 0 0 0; font-weight: 500;">
                ⏱️ This reset link & code expire in 15 minutes.
              </p>
            </div>

            <p style="color: #64748b; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
              Button not working? Copy and paste this URL into your browser:<br/>
              <a href="${resetUrl}" style="color: #06b6d4; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #475569; font-size: 11px; line-height: 1.5; margin: 14px 0 0 0; text-align: center;">
              If you didn't request a password reset, please ignore this email. Your account is completely secure.
            </p>
          </div>
          <div style="background: #080e1a; padding: 14px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
            <p style="color: #475569; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} AuraTrade. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = this.getEmailTransporter();
    if (transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"AuraTrade Security" <${process.env.SMTP_USER}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          html: htmlContent
        });
        console.log(`✉️ [REAL PASSWORD RESET EMAIL DELIVERED via Gmail] Sent to ${toEmail}`);
        return { delivered: true, method: 'smtp', destination: toEmail, resetUrl };
      } catch (err) {
        console.error(`❌ [EMAIL DELIVERY ERROR] Failed to send reset email to ${toEmail}:`, err.message);
      }
    }

    // Ethereal Fallback
    try {
      if (!this.etherealTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        this.etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      const info = await this.etherealTransporter.sendMail({
        from: '"AuraTrade Security" <security@auratrade.io>',
        to: toEmail,
        subject,
        html: htmlContent
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n======================================================`);
      console.log(`✉️ [PASSWORD RESET SENT via Ethereal Inbox]`);
      console.log(`   To: ${toEmail}`);
      console.log(`   🔗 Direct Reset URL: ${resetUrl}`);
      console.log(`   Verification Code: >>> [ ${resetCode} ] <<<`);
      console.log(`   🔗 View Delivered Email: ${previewUrl}`);
      console.log(`======================================================\n`);

      return {
        delivered: true,
        method: 'ethereal',
        previewUrl,
        resetUrl,
        notice: 'Sent to virtual test inbox. Add SMTP_USER & SMTP_PASS to Vercel for personal Gmail delivery.'
      };
    } catch (err) {
      console.error('[NotificationService] Ethereal reset email fallback failed:', err.message);
    }

    return {
      delivered: false,
      method: 'terminal-fallback',
      resetUrl,
      notice: 'Configure SMTP_USER & SMTP_PASS in Vercel for personal Gmail delivery.'
    };
  }

  // Send real SMS OTP
  async sendSmsOtp(toPhone, code, purpose = 'login') {
    require('dotenv').config();
    const textMessage = `AuraTrade Security Code: ${code}. Valid for 5 minutes. Do not share with anyone.`;
    
    // Normalize to clean E.164 format (e.g. +919791359491)
    let cleanPhone = toPhone.replace(/[\s\(\)\-]/g, '').trim();
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    // Option 1: Twilio SMS Gateway (Worldwide via official REST API)
    const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const twilioAuth = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const twilioFromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
    let twilioNotice = null;

    if (twilioSid && twilioAuth && twilioFromNumber) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', cleanPhone);
        params.append('From', twilioFromNumber);
        params.append('Body', textMessage);

        const res = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          params.toString(),
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        console.log(`📱 [REAL SMS DELIVERED via Twilio] SID: ${res.data?.sid} to ${cleanPhone}`);
        return { delivered: true, method: 'twilio', destination: cleanPhone, sid: res.data?.sid };
      } catch (err) {
        twilioNotice = err.response?.data?.message || err.message;
        console.error(`❌ [TWILIO SMS ERROR] Failed to send SMS to ${cleanPhone}:`, twilioNotice);
      }
    }

    // Option 2: Fast2SMS Gateway (Popular for direct Indian mobile numbers)
    let fast2smsNotice = null;
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const normalizedDigits = cleanPhone.replace(/\D/g, '').slice(-10);
        const res = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            route: 'otp',
            variables_values: code,
            numbers: normalizedDigits
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY.trim(),
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.data && res.data.return) {
          console.log(`📱 [REAL SMS DELIVERED via Fast2SMS] To: ${normalizedDigits}`);
          return { delivered: true, method: 'fast2sms', destination: normalizedDigits };
        } else if (res.data && res.data.message) {
          fast2smsNotice = Array.isArray(res.data.message) ? res.data.message.join(', ') : res.data.message;
          console.warn(`⚠️ [FAST2SMS GATEWAY NOTICE] ${fast2smsNotice}`);
        }
      } catch (err) {
        fast2smsNotice = err.response?.data?.message || err.message;
        console.error(`❌ [FAST2SMS ERROR] Failed to send SMS to ${cleanPhone}:`, fast2smsNotice);
      }
    }

    // If SMS gateway not yet configured or returned warning, log to server terminal
    console.log(`\n======================================================`);
    console.log(`📱 [SMS GATEWAY] Mobile OTP for ${cleanPhone}`);
    console.log(`   Verification Code: >>> [ ${code} ] <<<`);
    if (twilioNotice) {
      console.log(`   ⚠️ Twilio Status: ${twilioNotice}`);
    }
    if (fast2smsNotice) {
      console.log(`   ⚠️ Fast2SMS Status: ${fast2smsNotice}`);
    }
    console.log(`======================================================\n`);

    return {
      delivered: false,
      method: 'terminal-fallback',
      requiresSetup: !process.env.FAST2SMS_API_KEY && !process.env.TWILIO_ACCOUNT_SID,
      notice: twilioNotice ? `Twilio: ${twilioNotice}` : (fast2smsNotice ? `Fast2SMS: ${fast2smsNotice}` : 'Carrier SMS gateway not configured.')
    };
  }
}

module.exports = new NotificationService();
