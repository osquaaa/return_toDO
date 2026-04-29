export const metadata = { title: 'Проверьте почту — LETget' };

export default function VerifySentPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-semibold tracking-tight">Почти готово</h2>
      <p className="text-sm text-[var(--color-ink)]/70">
        Мы отправили письмо для подтверждения email. Проверь входящие и спам. Ссылка действует 24
        часа.
      </p>
      <p className="text-xs text-[var(--color-ink)]/50">
        Не пришло? Проверь, что email введён правильно. Можно зарегистрироваться ещё раз.
      </p>
    </div>
  );
}
