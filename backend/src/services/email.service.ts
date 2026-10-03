import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: any = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  otp?: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: 'emailjs' | 'resend' | 'smtp' | 'simulated';
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const sender = options.from || env.EMAIL_FROM || 'HireFlow AI <onboarding@resend.dev>';

  // 1. EmailJS REST API Priority (when service_id is configured or provided)
  if (env.EMAILJS_PUBLIC_KEY && (env.EMAILJS_SERVICE_ID || env.EMAILJS_TEMPLATE_ID)) {
    try {
      const emailJsPayload = {
        service_id: env.EMAILJS_SERVICE_ID || 'service_hireflow',
        template_id: env.EMAILJS_TEMPLATE_ID || 'template_otp',
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: options.to,
          email: options.to,
          recipient_email: options.to,
          otp: options.otp || '',
          passcode: options.otp || '',
          subject: options.subject,
          message: options.text,
          company_name: 'HireFlow AI',
        },
      };

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': env.CLIENT_URL || 'https://hr-agent-steel.vercel.app',
        },
        body: JSON.stringify(emailJsPayload),
      });

      if (res.ok) {
        console.log(`[EMAIL DISPATCHED via EmailJS] To: ${options.to}`);
        return { sent: true, provider: 'emailjs' };
      } else {
        const errText = await res.text();
        console.warn(`[EmailJS Non-Fatal Warning]: Status ${res.status} - ${errText}. Falling back to secondary providers.`);
      }
    } catch (err: any) {
      console.warn(`[EmailJS Request Error]: ${err.message}. Falling back.`);
    }
  }

  // 2. Resend API Key priority (fastest, modern HTTP)
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender.includes('<') ? sender : `HireFlow AI <${sender}>`,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });

      const data = (await res.json()) as any;
      if (res.ok) {
        console.log(`[EMAIL DISPATCHED via Resend] To: ${options.to} | Id: ${data.id}`);
        return { sent: true, provider: 'resend' };
      } else if (
        data?.name === 'validation_error' &&
        data?.message?.includes('only send testing emails')
      ) {
        // Resend sandbox testing fallback: deliver to verified account owner
        console.warn(`[Resend Sandbox] Redirecting test email to account owner agraharinikhil999@gmail.com`);
        const fallbackRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender.includes('<') ? sender : `HireFlow AI <${sender}>`,
            to: ['agraharinikhil999@gmail.com'],
            subject: `[Sandbox Preview for ${options.to}] ${options.subject}`,
            text: options.text,
            html:
              `<div style="background: #edf7d2; border: 1px solid #84b81b; color: #567715; padding: 12px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; font-weight: bold;">
                🔔 Resend Testing Sandbox: Delivered to account owner (agraharinikhil999@gmail.com). Intended candidate recipient: ${options.to}
              </div>` + (options.html || options.text),
          }),
        });

        const fallbackData = (await fallbackRes.json()) as any;
        if (fallbackRes.ok) {
          console.log(`[EMAIL DISPATCHED via Resend Sandbox Fallback] Delivered to agraharinikhil999@gmail.com | Id: ${fallbackData.id}`);
          return { sent: true, provider: 'resend' };
        }
        return { sent: false, provider: 'resend', error: fallbackData.message };
      } else {
        console.error('[EMAIL Resend Error]', data);
        return { sent: false, provider: 'resend', error: data.message || 'Resend API error' };
      }
    } catch (err: any) {
      console.error('[EMAIL Resend Network Error]', err);
      return { sent: false, provider: 'resend', error: err.message };
    }
  }

  // 3. SMTP Transporter (Nodemailer: Gmail, Brevo, SendGrid, etc.)
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: sender,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`[EMAIL DISPATCHED via SMTP] To: ${options.to} | MessageId: ${info.messageId}`);
      return { sent: true, provider: 'smtp' };
    } catch (err: any) {
      console.error('[EMAIL SMTP Error]', err);
      return { sent: false, provider: 'smtp', error: err.message };
    }
  }

  // 4. Fallback: Simulated logging when no API key/SMTP is set yet
  console.log(`[SIMULATED EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  return { sent: true, provider: 'simulated' };
}
