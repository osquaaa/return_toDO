import { Resend } from 'resend';

type SendArgs = { to: string; subject: string; html: string; text: string };

let resendInstance: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) resendInstance = new Resend(key);
  return resendInstance;
}

// EMAIL_FROM may be overridden via env once a domain is verified at Resend.
// Default falls back to Resend's onboarding sandbox address — works without
// domain verification, but Resend only delivers to the account owner's email.
function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'LETget <onboarding@resend.dev>';
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const client = getClient();
  if (!client) {
    console.info('[email:dev-stub]', { to: args.to, subject: args.subject, text: args.text });
    return;
  }
  const result = await client.emails.send({
    from: getFromAddress(),
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (result.error) {
    console.error('[email:resend]', { to: args.to, error: result.error });
    throw new Error(`Resend error: ${result.error.message}`);
  }
}
