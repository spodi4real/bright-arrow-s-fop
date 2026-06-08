import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, isResponse, ok, requirePermissionApi } from '@/lib/api';

const schema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['approve', 'deny']),
  reason: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('expense.approve');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  if (parsed.data.action === 'deny' && !parsed.data.reason) return badRequest('Denial reason required');

  await prisma.expense.updateMany({
    where: { id: { in: parsed.data.ids }, status: 'pending' },
    data: {
      status: parsed.data.action === 'approve' ? 'approved' : 'denied',
      reviewedById: user.id,
      reviewedAt: new Date(),
      denialReason: parsed.data.action === 'deny' ? parsed.data.reason || null : null,
    },
  });
  return ok({ ok: true });
}
