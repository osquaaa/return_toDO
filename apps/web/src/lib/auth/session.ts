import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export type UserWithRole = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean | Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: 'user' | 'admin';
};

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as Record<string, unknown>;
  return {
    id: String(u.id),
    email: String(u.email),
    name: (u.name as string | null) ?? null,
    image: (u.image as string | null) ?? null,
    emailVerified: (u.emailVerified as Date | boolean | null) ?? null,
    createdAt: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt as string),
    updatedAt: u.updatedAt instanceof Date ? u.updatedAt : new Date(u.updatedAt as string),
    role: (u.role as 'user' | 'admin') ?? 'user',
  };
}

export async function requireUser(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  return user;
}

export async function requireAdmin(): Promise<UserWithRole> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}
