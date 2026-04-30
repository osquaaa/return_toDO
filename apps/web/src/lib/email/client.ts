import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';

type SendArgs = { to: string; subject: string; html: string; text: string };

let resendInstance: Resend | null = null;
let smtpTransporter: Transporter | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) resendInstance = new Resend(key);
  return resendInstance;
}

function getSmtp(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (!smtpTransporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return smtpTransporter;
}

function getFromAddress(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_USER) return `LETget <${process.env.SMTP_USER}>`;
  return 'LETget <onboarding@resend.dev>';
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const from = getFromAddress();

  // Prefer SMTP if configured (Gmail / Workspace / any SMTP relay).
  const smtp = getSmtp();
  if (smtp) {
    try {
      await smtp.sendMail({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      return;
    } catch (err) {
      console.error('[email:smtp]', {
        to: args.to,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  }

  // Fallback to Resend.
  const resend = getResend();
  if (resend) {
    const result = await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (result.error) {
      console.error('[email:resend]', { to: args.to, error: result.error });
      throw new Error(`Resend error: ${result.error.message}`);
    }
    return;
  }

  // Dev-stub: print to logs (used when no provider configured).
  console.info('[email:dev-stub]', { to: args.to, subject: args.subject, text: args.text });
}
