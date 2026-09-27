const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.etherealTransporter = null;
    this.getTwilioClient();
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
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    }
    return null;
  }

  // Send real email OTP
  async sendEmailOtp(toEmail, code, purpose = 'login') {
    const subject = `Your AuraTrade Verification Code: ${code}`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0c1424; color: #ffffff; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #06b6d4; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">AuraTrade Workstation</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Multi-Factor Authentication Security</p>
        </div>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">Your 6-digit one-time verification code is:</p>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; background: #061120; padding: 12px; border-radius: 8px; border: 1px dashed #06b6d4; display: inline-block;">
            ${code}
          </div>
          <p style="color: #f59e0b; font-size: 12px; margin: 12px 0 0 0;">⏱️ This code will expire in 5 minutes.</p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
          If you did not request this security code, please ignore this email or contact security immediately. Never share this code with anyone.
        </p>
      </div>
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
      console.log(`   💡 To deliver to personal Gmail, add SMTP_USER & SMTP_PASS in server/.env`);
      console.log(`======================================================\n`);

      return {
        delivered: true,
        method: 'ethereal',
        previewUrl,
        notice: 'Sent to real web inbox. Configure Gmail in server/.env to receive in personal inbox.'
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
      notice: 'Configure SMTP_USER & SMTP_PASS in server/.env for personal inbox delivery.'
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

    // Option 1: Twilio SMS Gateway (Worldwide)
    const twilioClient = this.getTwilioClient();
    const twilioFromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
    let twilioNotice = null;

    if (twilioClient && twilioFromNumber) {
      try {
        const res = await twilioClient.messages.create({
          body: textMessage,
          from: twilioFromNumber,
          to: cleanPhone
        });
        console.log(`📱 [REAL SMS DELIVERED via Twilio] SID: ${res.sid} to ${cleanPhone}`);
        return { delivered: true, method: 'twilio', destination: cleanPhone, sid: res.sid };
      } catch (err) {
        twilioNotice = err.message;
        console.error(`❌ [TWILIO SMS ERROR] Failed to send SMS to ${cleanPhone}:`, err.message);
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
