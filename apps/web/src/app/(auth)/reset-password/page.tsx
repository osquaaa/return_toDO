import { Suspense } from 'react';

import { ResetPasswordForm } from './reset-password-form';

export const metadata = { title: 'Новый пароль — LETget' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
