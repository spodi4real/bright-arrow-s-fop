import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, verifyPassword } from '@/lib/auth';
import { badRequest, ok, unauthorized } from '@/lib/api';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid input');

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.active) return unauthorized();
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return unauthorized();

  const ua = req.headers.get('user-agent') || undefined;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined;
  await createSession(user.id, ua, ip);

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'login', entity: 'session', ip },
  });

  return ok({ ok: true, user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName } });
}
