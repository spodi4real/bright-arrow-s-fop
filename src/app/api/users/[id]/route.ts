import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, isResponse, notFound, ok, requirePermissionApi } from '@/lib/api';
import { hashPassword } from '@/lib/auth';

const schema = z.object({
  username: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  role: z.enum(['admin', 'supervisor', 'iskra', 'accountant', 'engineer']).optional(),
  email: z.string().email().optional().nullable(),
  active: z.boolean().optional(),
  password: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermissionApi('user.manage');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();

  if (parsed.data.username) {
    const taken = await prisma.user.findUnique({ where: { username: parsed.data.username } });
    if (taken && taken.id !== params.id) return badRequest('Username already taken');
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.username) data.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) data.displayName = parsed.data.displayName;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);

  const updated = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, username: true, displayName: true, role: true, email: true, active: true } });
  return ok({ user: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermissionApi('user.manage');
  if (isResponse(user)) return user;
  if (user.id === params.id) return badRequest('Cannot delete yourself');
  await prisma.user.update({ where: { id: params.id }, data: { active: false } });
  return ok({ ok: true });
}
