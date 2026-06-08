import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, isResponse, notFound, ok, requirePermissionApi } from '@/lib/api';

const schema = z.object({
  metricLabel: z.string().optional(),
  amount: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  visibleToUser: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermissionApi('target.manage');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const existing = await prisma.target.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  const t = await prisma.target.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.metricLabel !== undefined && { metricLabel: parsed.data.metricLabel }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.startDate !== undefined && { startDate: new Date(parsed.data.startDate) }),
      ...(parsed.data.endDate !== undefined && { endDate: new Date(parsed.data.endDate) }),
      ...(parsed.data.visibleToUser !== undefined && { visibleToUser: parsed.data.visibleToUser }),
    },
  });
  return ok({ target: t });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermissionApi('target.manage');
  if (isResponse(user)) return user;
  await prisma.target.delete({ where: { id: params.id } });
  return ok({ ok: true });
}
