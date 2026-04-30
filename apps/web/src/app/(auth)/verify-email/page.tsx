import { VerifyEmailView } from './verify-email-view';

export const metadata = { title: 'Подтверждение email — LETget' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <VerifyEmailView hasError={Boolean(params.error)} />;
}
