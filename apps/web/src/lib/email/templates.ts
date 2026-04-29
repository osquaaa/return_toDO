type Template = { subject: string; html: string; text: string };

const greet = (name: string | null) => (name ? `Привет, ${name}!` : 'Привет!');

export function verifyEmailTemplate(opts: { name: string | null; url: string }): Template {
  return {
    subject: 'LETget — подтвердите email',
    html: `
<!doctype html><meta charset="utf-8" />
<div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px">${greet(opts.name)}</h1>
  <p>Подтвердите свой email, чтобы активировать аккаунт LETget.</p>
  <p><a href="${opts.url}" style="display:inline-block;padding:12px 20px;background:#1a1410;color:#fcf8f1;text-decoration:none;border-radius:12px">Подтвердить email</a></p>
  <p style="color:#7a7066;font-size:13px">Если кнопка не работает: ${opts.url}</p>
  <p style="color:#7a7066;font-size:13px">Срок действия — 24 часа.</p>
</div>`.trim(),
    text: `${greet(opts.name)}\n\nПодтвердите email: ${opts.url}\n\nСссылка действует 24 часа.`,
  };
}

export function resetPasswordTemplate(opts: { name: string | null; url: string }): Template {
  return {
    subject: 'LETget — сброс пароля',
    html: `
<!doctype html><meta charset="utf-8" />
<div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px">${greet(opts.name)}</h1>
  <p>Кто-то запросил сброс пароля для вашего аккаунта.</p>
  <p><a href="${opts.url}" style="display:inline-block;padding:12px 20px;background:#1a1410;color:#fcf8f1;text-decoration:none;border-radius:12px">Сбросить пароль</a></p>
  <p style="color:#7a7066;font-size:13px">Ссылка действует 15 минут. Если это были не вы — просто проигнорируйте письмо.</p>
</div>`.trim(),
    text: `${greet(opts.name)}\n\nСброс пароля: ${opts.url}\n\nСсылка действует 15 минут.`,
  };
}
