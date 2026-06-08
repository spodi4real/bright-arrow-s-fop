import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { PocketMoneyManager } from './PocketMoneyManager';

export const dynamic = 'force-dynamic';

export default async function PocketMoneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'pocketMoney.issue')) redirect('/expenses');

  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ['admin', 'supervisor', 'iskra', 'engineer'] } },
    select: { id: true, displayName: true, role: true, username: true },
    orderBy: { displayName: 'asc' },
  });

  const balances = await Promise.all(
    users.map(async (u) => {
      const [pm, exp] = await Promise.all([
        prisma.pocketMoneyTransaction.aggregate({ where: { userId: u.id }, _sum: { amountUsd: true } }),
        prisma.expense.aggregate({ where: { submittedById: u.id, status: 'approved' }, _sum: { amountUsd: true } }),
      ]);
      const issued = pm._sum.amountUsd || 0;
      const spent = exp._sum.amountUsd || 0;
      return { ...u, issued, spent, balance: issued - spent };
    })
  );

  return (
    <div>
      <PageHeader title="Pocket money" description="Issue advances and view balances." />
      <PocketMoneyManager users={balances} />
    </div>
  );
}
