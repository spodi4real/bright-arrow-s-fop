import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { ExpensesView } from './ExpensesView';
import { getCurrentExchangeRate } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const isReviewer = can(user, 'expense.approve');
  const rate = await getCurrentExchangeRate();

  const expenses = await prisma.expense.findMany({
    where: isReviewer ? {} : { submittedById: user.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      submittedBy: { select: { id: true, displayName: true } },
      reviewedBy: { select: { displayName: true } },
      files: { select: { id: true, originalName: true } },
    },
    take: 300,
  });

  let balance: number | null = null;
  if (can(user, 'expense.create')) {
    const [pmAgg, expAgg] = await Promise.all([
      prisma.pocketMoneyTransaction.aggregate({ where: { userId: user.id }, _sum: { amountUsd: true } }),
      prisma.expense.aggregate({ where: { submittedById: user.id, status: 'approved' }, _sum: { amountUsd: true } }),
    ]);
    balance = (pmAgg._sum.amountUsd || 0) - (expAgg._sum.amountUsd || 0);
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={isReviewer ? 'Review submissions and manage pocket money.' : 'Your submitted expenses.'}
        actions={
          <>
            {can(user, 'expense.create') && <Button asChild><Link href="/expenses/new">Add expense</Link></Button>}
            {can(user, 'pocketMoney.issue') && <Button asChild variant="outline"><Link href="/expenses/pocket-money">Pocket money</Link></Button>}
          </>
        }
      />
      <ExpensesView expenses={expenses as any} isReviewer={isReviewer} rate={rate} balance={balance} />
    </div>
  );
}
