import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi, requirePermissionApi } from '@/lib/api';
import { can } from '@/lib/permissions';

const schema = z.object({
  userId: z.string(),
  amountUsd: z.number(),
  reason: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (userId && userId !== user.id && !can(user, 'pocketMoney.viewAll')) {
    return badRequest('Cannot view other users\' pocket money');
  }
  const targetId = userId || user.id;

  const [issuances, expensesAgg] = await Promise.all([
    prisma.pocketMoneyTransaction.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' },
      include: { issuedBy: { select: { displayName: true } } },
    }),
    prisma.expense.aggregate({
      where: { submittedById: targetId, status: 'approved' },
      _sum: { amountUsd: true },
    }),
  ]);
  const totalIssued = issuances.reduce((s, t) => s + t.amountUsd, 0);
  const totalSpent = expensesAgg._sum.amountUsd || 0;
  return ok({ issuances, totalIssued, totalSpent, balance: totalIssued - totalSpent });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('pocketMoney.issue');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const t = await prisma.pocketMoneyTransaction.create({
    data: {
      userId: parsed.data.userId,
      issuedById: user.id,
      amountUsd: parsed.data.amountUsd,
      reason: parsed.data.reason,
    },
  });
  return created({ transaction: t });
}
