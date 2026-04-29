import Link from 'next/link';

export const metadata = { title: 'Подтверждение email — LETget' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (params.error) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="font-display text-xl">Не получилось</h2>
        <p className="text-sm text-red-700">
          Ссылка истекла или некорректна. Зарегистрируйся заново.
        </p>
        <Link href="/sign-up" className="text-sm underline">
          К регистрации
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-xl">Email подтверждён</h2>
      <Link href="/" className="text-sm underline">
        Перейти в LETget
      </Link>
    </div>
  );
}
