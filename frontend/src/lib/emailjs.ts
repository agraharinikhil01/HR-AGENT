import emailjs from '@emailjs/browser';
import { frontendEnv } from './env.js';

export interface EmailJsOtpParams {
  toEmail: string;
  otp: string;
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
}

export async function sendOtpViaEmailJS(params: EmailJsOtpParams): Promise<{ success: boolean; error?: string }> {
  const publicKey = params.publicKey || frontendEnv.VITE_EMAILJS_PUBLIC_KEY || '0_XS4ZUAWQwaGFz5B';
  const serviceId = params.serviceId || frontendEnv.VITE_EMAILJS_SERVICE_ID;
  const templateId = params.templateId || frontendEnv.VITE_EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    console.warn('[EmailJS Frontend] Service ID or Template ID not configured yet. Handled via backend multi-channel delivery.');
    return { success: false, error: 'EmailJS Service ID or Template ID not set' };
  }

  try {
    emailjs.init({ publicKey });

    const templateParams = {
      to_email: params.toEmail,
      email: params.toEmail,
      recipient_email: params.toEmail,
      otp: params.otp,
      passcode: params.otp,
      subject: `Your HireFlow AI Login Code: ${params.otp}`,
      company_name: 'HireFlow AI',
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('[EmailJS Frontend SUCCESS]', response.status, response.text);
    return { success: true };
  } catch (err: any) {
    console.warn('[EmailJS Frontend Error]', err?.text || err?.message || err);
    return { success: false, error: err?.text || err?.message || 'EmailJS dispatch failed' };
  }
}
