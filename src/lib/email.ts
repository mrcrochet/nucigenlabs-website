/**
 * Email service using Resend API
 * Sends confirmation emails to early access users
 */

interface EmailData {
  to: string;
  name?: string;
  role?: string;
  company?: string;
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const RESEND_FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'Nucigen Labs <onboarding@resend.dev>';

export async function sendEarlyAccessConfirmationEmail(data: EmailData): Promise<boolean> {
  // If Resend is not configured, log and return success (for development)
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not configured. Email not sent.');
    return true; // Return true to not block the signup process
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: data.to,
        subject: 'Welcome to Nucigen Labs Early Access',
        html: generateEmailHTML(data),
        text: generateEmailText(data),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Don't block signup if email fails
  }
}

function generateEmailHTML(data: EmailData): string {
  const name = data.name || data.to.split('@')[0];
  const launchDate = 'January 30, 2026';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nucigen Labs Early Access</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1515; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #FFFFFF; letter-spacing: 0.5px;">NUCIGEN LABS</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #FFFFFF;">Welcome, ${name}!</h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #E5E5E5; font-weight: 300;">
                Thank you for joining Nucigen Labs Early Access. You're now part of an exclusive group that will have first access to our platform.
              </p>
              
              <div style="background-color: rgba(225, 70, 62, 0.1); border: 1px solid rgba(225, 70, 62, 0.3); border-radius: 8px; padding: 24px; margin: 30px 0;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #E1463E; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL LAUNCH</p>
                <p style="margin: 0; font-size: 20px; color: #FFFFFF; font-weight: 300;">${launchDate} at 15:00 UTC</p>
              </div>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #E5E5E5; font-weight: 300;">
                On launch day, you'll receive priority access to:
              </p>
              
              <ul style="margin: 20px 0; padding-left: 20px; color: #E5E5E5; font-size: 16px; line-height: 1.8; font-weight: 300;">
                <li style="margin-bottom: 10px;">Real-time predictive market intelligence</li>
                <li style="margin-bottom: 10px;">Four-level economic impact analysis</li>
                <li style="margin-bottom: 10px;">Early access pricing and special benefits</li>
                <li style="margin-bottom: 10px;">Direct input on platform features</li>
              </ul>
              
              <p style="margin: 30px 0 20px; font-size: 16px; line-height: 1.6; color: #E5E5E5; font-weight: 300;">
                We'll keep you updated as we approach launch. In the meantime, feel free to explore our website and learn more about what we're building.
              </p>
              
              <div style="margin: 40px 0 20px; text-align: center;">
                <a href="https://nucigenlabs.com" style="display: inline-block; padding: 14px 32px; background-color: #E1463E; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 400; letter-spacing: 0.5px;">Visit Our Website</a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #999999; font-weight: 300; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 30px;">
                If you have any questions, simply reply to this email. We're here to help.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); background-color: rgba(0, 0, 0, 0.2);">
              <p style="margin: 0 0 10px; font-size: 12px; color: #666666; font-weight: 300;">
                Nucigen Labs — Predictive Market Intelligence
              </p>
              <p style="margin: 0; font-size: 11px; color: #444444; font-weight: 300;">
                You're receiving this because you signed up for early access.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateEmailText(data: EmailData): string {
  const name = data.name || data.to.split('@')[0];
  const launchDate = 'January 30, 2026';
  
  return `
Welcome to Nucigen Labs Early Access!

Hi ${name},

Thank you for joining Nucigen Labs Early Access. You're now part of an exclusive group that will have first access to our platform.

OFFICIAL LAUNCH: ${launchDate} at 15:00 UTC

On launch day, you'll receive priority access to:
- Real-time predictive market intelligence
- Four-level economic impact analysis
- Early access pricing and special benefits
- Direct input on platform features

We'll keep you updated as we approach launch. In the meantime, feel free to explore our website at https://nucigenlabs.com

If you have any questions, simply reply to this email. We're here to help.

Best regards,
The Nucigen Labs Team

---
Nucigen Labs — Predictive Market Intelligence
You're receiving this because you signed up for early access.
  `;
}

