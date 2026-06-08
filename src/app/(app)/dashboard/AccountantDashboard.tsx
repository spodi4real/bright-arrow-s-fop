import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Wallet } from 'lucide-react';
import { getCurrentExchangeRate } from '@/lib/currency';
import { formatCurrency } from '@/lib/utils';
import { startOfWeek, startOfMonth } from 'date-fns';

export async function AccountantDashboard({ userId }: { userId: string }) {
  const [pending, weeklyAgg, monthlyAgg, pocketTotal, rate] = await Promise.all([
    prisma.expense.count({ where: { status: 'pending' } }),
    prisma.expense.aggregate({
      where: { status: 'approved', createdAt: { gte: startOfWeek(new Date()) } },
      _sum: { amountUsd: true },
    }),
    prisma.expense.aggregate({
      where: { status: 'approved', createdAt: { gte: startOfMonth(new Date()) } },
      _sum: { amountUsd: true },
    }),
    prisma.pocketMoneyTransaction.aggregate({ _sum: { amountUsd: true } }),
    getCurrentExchangeRate(),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Financial overview." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending approvals" value={pending.toString()} />
        <StatCard label="Approved this week" value={formatCurrency(weeklyAgg._sum.amountUsd || 0, 'usd')} />
        <StatCard label="Approved this month" value={formatCurrency(monthlyAgg._sum.amountUsd || 0, 'usd')} />
        <StatCard label="Total pocket money issued" value={formatCurrency(pocketTotal._sum.amountUsd || 0, 'usd')} />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exchange rate</CardTitle>
            <Button asChild size="sm" variant="outline"><Link href="/settings">Edit</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{rate.toLocaleString()} <span className="text-muted-foreground text-base font-normal">IQD / 1 USD</span></div>
          <p className="text-xs text-muted-foreground mt-2">Historic expenses retain their original conversion rate.</p>
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2">
        <Button asChild><Link href="/expenses">Review pending</Link></Button>
        <Button asChild variant="outline"><Link href="/expenses/pocket-money">Pocket money</Link></Button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-muted-foreground text-xs mb-1.5 flex items-center gap-2"><Wallet className="h-3.5 w-3.5" />{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}
