/**
 * Email Service
 * 
 * Handles all email notifications:
 * - Welcome emails
 * - Alert notifications
 * - Weekly summaries
 * - Onboarding reminders
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Nucigen Labs <onboarding@resend.dev>';
const RESEND_BASE_URL = 'https://api.resend.com';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface AlertEmailData {
  email: string;
  alertTitle: string;
  alertDescription: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  signalId?: string;
  eventIds?: string[];
  unsubscribeUrl?: string;
}

export interface WeeklySummaryData {
  email: string;
  name: string;
  signalsCount: number;
  criticalSignalsCount: number;
  topSignals: Array<{
    title: string;
    impact: number;
    confidence: number;
    signalId: string;
  }>;
  unsubscribeUrl?: string;
}

/**
 * Send email via Resend API
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[EmailService] Resend API key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[EmailService] Resend API error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const name = data.name || data.email.split('@')[0];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nucigen Labs</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0A0A0A; padding: 40px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #E1463E; margin: 0 0 20px 0; font-size: 28px; font-weight: 300;">Welcome to Nucigen Labs</h1>
    <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 300;">Hi ${name},</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="margin: 0 0 20px 0; color: #333;">Thank you for joining Nucigen Labs. We're excited to help you stay ahead of market-moving events.</p>
    
    <h2 style="color: #0A0A0A; margin: 30px 0 15px 0; font-size: 20px; font-weight: 400;">Get Started</h2>
    <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #333;">
      <li style="margin-bottom: 10px;">Complete your onboarding to personalize your feed</li>
      <li style="margin-bottom: 10px;">Explore the Intelligence feed for high-level signals</li>
      <li style="margin-bottom: 10px;">Set up alerts for critical events</li>
    </ol>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://nucigenlabs.com'}/onboarding" 
         style="display: inline-block; padding: 12px 24px; background-color: #E1463E; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Complete Your Profile
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>Nucigen Labs - Market Intelligence Platform</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate alert email HTML
 */
function generateAlertEmailHTML(data: AlertEmailData): string {
  const severityColors = {
    critical: '#E1463E',
    high: '#FF6B35',
    moderate: '#FFA500',
    low: '#4A90E2',
  };
  
  const severityLabels = {
    critical: 'Critical',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
  };
  
  const color = severityColors[data.severity];
  const label = severityLabels[data.severity];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert: ${data.alertTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0A0A0A; padding: 30px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${color};">
    <div style="display: inline-block; padding: 4px 12px; background-color: ${color}; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 15px;">
      ${label} Alert
    </div>
    <h1 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px; font-weight: 300;">${data.alertTitle}</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">${data.alertDescription}</p>
    
    ${data.signalId ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://nucigenlabs.com'}/signals/${data.signalId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #E1463E; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Signal Details
      </a>
    </div>
    ` : ''}
  </div>
  
  ${data.unsubscribeUrl ? `
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p><a href="${data.unsubscribeUrl}" style="color: #999;">Unsubscribe from alerts</a></p>
  </div>
  ` : ''}
  
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>Nucigen Labs - Market Intelligence Platform</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate weekly summary email HTML
 */
function generateWeeklySummaryHTML(data: WeeklySummaryData): string {
  const name = data.name || data.email.split('@')[0];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Intelligence Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0A0A0A; padding: 40px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #E1463E; margin: 0 0 10px 0; font-size: 28px; font-weight: 300;">Weekly Intelligence Summary</h1>
    <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 300;">Hi ${name},</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; text-align: center;">
        <div style="font-size: 32px; font-weight: 600; color: #E1463E; margin-bottom: 5px;">${data.signalsCount}</div>
        <div style="font-size: 14px; color: #666;">Total Signals</div>
      </div>
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; text-align: center;">
        <div style="font-size: 32px; font-weight: 600; color: #E1463E; margin-bottom: 5px;">${data.criticalSignalsCount}</div>
        <div style="font-size: 14px; color: #666;">Critical Signals</div>
      </div>
    </div>
    
    ${data.topSignals.length > 0 ? `
    <h2 style="color: #0A0A0A; margin: 30px 0 15px 0; font-size: 20px; font-weight: 400;">Top Signals This Week</h2>
    <div style="margin-bottom: 30px;">
      ${data.topSignals.map((signal, index) => `
        <div style="padding: 15px; background-color: #f8f9fa; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #E1463E;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 500; color: #0A0A0A;">${signal.title}</h3>
          <div style="display: flex; gap: 15px; font-size: 14px; color: #666;">
            <span>Impact: ${signal.impact}%</span>
            <span>Confidence: ${signal.confidence}%</span>
          </div>
          <a href="${process.env.VITE_APP_URL || 'https://nucigenlabs.com'}/signals/${signal.signalId}" 
             style="display: inline-block; margin-top: 10px; color: #E1463E; text-decoration: none; font-size: 14px;">
            View Details →
          </a>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://nucigenlabs.com'}/intelligence" 
         style="display: inline-block; padding: 12px 24px; background-color: #E1463E; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View All Signals
      </a>
    </div>
  </div>
  
  ${data.unsubscribeUrl ? `
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p><a href="${data.unsubscribeUrl}" style="color: #999;">Unsubscribe from weekly summaries</a></p>
  </div>
  ` : ''}
  
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>Nucigen Labs - Market Intelligence Platform</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const html = generateWelcomeEmailHTML(data);
  
  return sendEmail({
    to: data.email,
    subject: 'Welcome to Nucigen Labs',
    html,
  });
}

/**
 * Send alert notification email
 */
export async function sendAlertEmail(data: AlertEmailData): Promise<{ success: boolean; error?: string }> {
  const html = generateAlertEmailHTML(data);
  
  const severitySubjects = {
    critical: '🚨 Critical Alert',
    high: '⚠️ High Priority Alert',
    moderate: '📊 Alert',
    low: 'ℹ️ Alert',
  };
  
  return sendEmail({
    to: data.email,
    subject: `${severitySubjects[data.severity]}: ${data.alertTitle}`,
    html,
  });
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummary(data: WeeklySummaryData): Promise<{ success: boolean; error?: string }> {
  const html = generateWeeklySummaryHTML(data);
  
  return sendEmail({
    to: data.email,
    subject: `Your Weekly Intelligence Summary - ${data.signalsCount} Signals`,
    html,
  });
}

/**
 * Send onboarding reminder email
 */
export async function sendOnboardingReminder(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Profile</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0A0A0A; padding: 40px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #E1463E; margin: 0 0 20px 0; font-size: 28px; font-weight: 300;">Complete Your Profile</h1>
    <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 300;">Hi ${name || email.split('@')[0]},</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="margin: 0 0 20px 0; color: #333;">You're just one step away from getting personalized intelligence signals tailored to your interests.</p>
    
    <p style="margin: 0 0 20px 0; color: #333;">Complete your profile to:</p>
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #333;">
      <li style="margin-bottom: 10px;">Receive signals relevant to your sectors and regions</li>
      <li style="margin-bottom: 10px;">Get alerts for events that matter to you</li>
      <li style="margin-bottom: 10px;">Enable personalized content collection</li>
    </ul>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://nucigenlabs.com'}/onboarding" 
         style="display: inline-block; padding: 12px 24px; background-color: #E1463E; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Complete Your Profile
      </a>
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>Nucigen Labs - Market Intelligence Platform</p>
  </div>
</body>
</html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Complete Your Profile - Nucigen Labs',
    html,
  });
}
