import { Resend } from 'resend';

type SendArgs = { to: string; subject: string; html: string; text: string };

let resendInstance: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) resendInstance = new Resend(key);
  return resendInstance;
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const client = getClient();
  if (!client) {
    console.info('[email:dev-stub]', { to: args.to, subject: args.subject, text: args.text });
    return;
  }
  await client.emails.send({
    from: 'LETget <noreply@letget.spassonic.ru>',
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
