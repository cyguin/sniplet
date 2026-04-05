import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'alerts@crisptrader.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'CrispTrader';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is not set. ' +
      'Add it to your .env.local file. Get your key at https://resend.com'
    );
  }
  return new Resend(apiKey);
}

export async function sendAlertEmail(
  alert: {
    id: string;
    userId: string;
    metal: string;
    threshold: string | number;
    direction: 'above' | 'below';
  },
  currentPrice: number,
  direction: 'above' | 'below'
): Promise<void> {
  const resend = getResendClient();

  const metalName = alert.metal.charAt(0).toUpperCase() + alert.metal.slice(1);
  const threshold = Number(alert.threshold);
  const thresholdFormatted = threshold.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  const currentFormatted = currentPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  const directionText = direction === 'above' ? 'risen above' : 'dropped below';
  const subject = `${metalName} ${direction === 'above' ? '▲' : '▼'} ${thresholdFormatted} — Alert Triggered`;

  const text = `${metalName} has ${directionText} ${thresholdFormatted}! Your alert triggered. Current price: ${currentFormatted}`;

  const { data, error } = await resend.emails.send({
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: alert.userId,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }

  console.log(`Alert email sent for alert ${alert.id}, message ID: ${data?.id}`);
}
