import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi, requirePermissionApi } from '@/lib/api';
import { hashPassword } from '@/lib/auth';

const createSchema = z.object({
  username: z.string().min(2).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(['admin', 'supervisor', 'iskra', 'accountant', 'engineer']),
  email: z.string().email().optional().nullable(),
});

export async function GET() {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const allowed = user.role === 'admin' || user.role === 'supervisor';
  if (!allowed) {
    // Mission creators need a list for invites — return minimal info
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, username: true, displayName: true, role: true },
      orderBy: { displayName: 'asc' },
    });
    return ok({ users });
  }
  const users = await prisma.user.findMany({
    orderBy: { displayName: 'asc' },
    select: { id: true, username: true, displayName: true, role: true, email: true, active: true, createdAt: true },
  });
  return ok({ users });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('user.manage');
  if (isResponse(user)) return user;
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input', { issues: parsed.error.flatten() });

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return badRequest('Username is taken');

  const hash = await hashPassword(parsed.data.password);
  const created_ = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: hash,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      email: parsed.data.email,
    },
    select: { id: true, username: true, displayName: true, role: true, email: true, active: true, createdAt: true },
  });
  return created({ user: created_ });
}
