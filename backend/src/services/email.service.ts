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
}

export interface SendEmailResult {
  sent: boolean;
  provider: 'resend' | 'smtp' | 'simulated';
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const sender = options.from || env.EMAIL_FROM || 'HireFlow AI <onboarding@resend.dev>';

  // 1. Resend API Key priority (fastest, modern HTTP)
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
      } else {
        console.error('[EMAIL Resend Error]', data);
        return { sent: false, provider: 'resend', error: data.message || 'Resend API error' };
      }
    } catch (err: any) {
      console.error('[EMAIL Resend Network Error]', err);
      return { sent: false, provider: 'resend', error: err.message };
    }
  }

  // 2. SMTP Transporter (Nodemailer: Gmail, Brevo, SendGrid, etc.)
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

  // 3. Fallback: Simulated logging when no API key/SMTP is set yet
  console.log(`[SIMULATED EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  return { sent: true, provider: 'simulated' };
}
