import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Briefcase, Wallet } from 'lucide-react';
import { subDays } from 'date-fns';
import { getCurrentExchangeRate } from '@/lib/currency';
import { formatCurrency } from '@/lib/utils';

export async function EngineerDashboard({ userId }: { userId: string }) {
  const oneWeekAgo = subDays(new Date(), 7);

  const [active, gatewaysThisWeek, metersThisWeek, recentMissions, expenses, pocketIssued, expenseApproved, invitations] = await Promise.all([
    prisma.mission.count({ where: { status: 'active', OR: [{ createdById: userId }, { members: { some: { userId } } }] } }),
    prisma.gateway.count({ where: { registeredById: userId, registeredAt: { gte: oneWeekAgo } } }),
    prisma.maintenanceMeter.count({ where: { registeredById: userId, registeredAt: { gte: oneWeekAgo } } }),
    prisma.mission.findMany({
      where: { OR: [{ createdById: userId }, { members: { some: { userId } } }] },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.expense.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.pocketMoneyTransaction.aggregate({
      where: { userId },
      _sum: { amountUsd: true },
    }),
    prisma.expense.aggregate({
      where: { submittedById: userId, status: 'approved' },
      _sum: { amountUsd: true },
    }),
    prisma.missionInvitation.findMany({
      where: { userId, status: 'pending' },
      include: { mission: { select: { id: true, name: true } }, invitedBy: { select: { displayName: true } } },
      take: 5,
    }),
  ]);

  const balance = (pocketIssued._sum.amountUsd || 0) - (expenseApproved._sum.amountUsd || 0);
  await getCurrentExchangeRate();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your work and personal finances."
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href="/missions/new">New Mission</Link></Button>
            <Button asChild size="sm"><Link href="/expenses/new">Add Expense</Link></Button>
          </>
        }
      />

      {invitations.length > 0 && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader><CardTitle>Pending invitations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <Link key={inv.id} href={`/missions/${inv.mission.id}`} className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-muted/40">
                <div className="text-sm">
                  <span className="font-medium">{inv.invitedBy.displayName}</span> invited you to <span className="text-primary">{inv.mission.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">Open →</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Briefcase className="h-4 w-4" />} label="Active missions" value={active} />
        <StatCard label="Gateways (7d)" value={gatewaysThisWeek} />
        <StatCard label="Meters (7d)" value={metersThisWeek} />
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs flex items-center gap-2 mb-1.5"><Wallet className="h-4 w-4" /> Pocket money</div>
            <div className={`text-2xl font-semibold ${balance < 0 ? 'text-warning' : ''}`}>
              {formatCurrency(balance, 'usd')}
            </div>
            {balance < 0 && <div className="text-xs text-muted-foreground mt-1">Company owes you this amount.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>My missions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentMissions.length === 0 && <p className="text-sm text-muted-foreground">No missions yet.</p>}
            {recentMissions.map((m) => (
              <Link key={m.id} href={`/missions/${m.id}`} className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-muted/40">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.type.replace(/_/g, ' ')}</div>
                </div>
                <Badge variant={m.status === 'active' ? 'success' : m.status === 'completed' ? 'muted' : 'primary'}>{m.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent expenses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {expenses.length === 0 && <p className="text-sm text-muted-foreground">No expenses yet.</p>}
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(e.amount, e.currency)}</div>
                </div>
                <Badge variant={e.status === 'approved' ? 'success' : e.status === 'denied' ? 'danger' : 'warning'}>{e.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-muted-foreground text-xs mb-1.5 flex items-center gap-2">{icon}{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}
