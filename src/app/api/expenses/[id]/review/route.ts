import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, isResponse, notFound, ok, requirePermissionApi } from '@/lib/api';

const schema = z.object({
  action: z.enum(['approve', 'deny']),
  reason: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermissionApi('expense.approve');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) return notFound();
  if (expense.status !== 'pending') return badRequest('Expense is not pending');
  if (parsed.data.action === 'deny' && !parsed.data.reason) return badRequest('Denial reason required');

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      status: parsed.data.action === 'approve' ? 'approved' : 'denied',
      reviewedById: user.id,
      reviewedAt: new Date(),
      denialReason: parsed.data.action === 'deny' ? parsed.data.reason || null : null,
    },
  });
  await prisma.notification.create({
    data: {
      userId: expense.submittedById,
      type: parsed.data.action === 'approve' ? 'expense_approved' : 'expense_denied',
      title: parsed.data.action === 'approve' ? 'Expense approved' : 'Expense denied',
      message: `${expense.name}${parsed.data.action === 'deny' ? ` — ${parsed.data.reason}` : ''}`,
      link: '/expenses',
    },
  });
  return ok({ expense: updated });
}
