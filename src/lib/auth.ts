import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { User } from '@prisma/client';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'brightarrow_session';
const SESSION_DAYS = 30;

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const jwt = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  await prisma.session.create({
    data: { userId, token: jwt, userAgent, ip, expiresAt: expires },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.BASE_URL || '').startsWith('https'),
    path: '/',
    expires,
  });

  return jwt;
}

export async function destroySession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const uid = payload.uid as string | undefined;
    if (!uid) return null;
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    if (!session.user.active) return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError('Unauthorized');
  return u;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
