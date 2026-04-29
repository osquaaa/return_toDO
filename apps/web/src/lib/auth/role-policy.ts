export function resolveRoleForEmail(email: string): 'user' | 'admin' {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return 'user';
  return email.trim().toLowerCase() === adminEmail ? 'admin' : 'user';
}
