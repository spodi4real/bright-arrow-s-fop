import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Briefcase } from 'lucide-react';
import { subDays } from 'date-fns';

export async function IskraDashboard({ userId }: { userId: string }) {
  const oneWeekAgo = subDays(new Date(), 7);
  const [active, gatewaysThisWeek, metersThisWeek, recentMissions] = await Promise.all([
    prisma.mission.count({ where: { status: 'active', OR: [{ createdById: userId }, { members: { some: { userId } } }] } }),
    prisma.gateway.count({ where: { registeredById: userId, registeredAt: { gte: oneWeekAgo } } }),
    prisma.maintenanceMeter.count({ where: { registeredById: userId, registeredAt: { gte: oneWeekAgo } } }),
    prisma.mission.findMany({
      where: { OR: [{ createdById: userId }, { members: { some: { userId } } }] },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your missions and recent work."
        actions={<Button asChild size="sm"><Link href="/missions/new">New Mission</Link></Button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="My active missions" value={active} />
        <StatCard label="Gateways this week" value={gatewaysThisWeek} />
        <StatCard label="Meters this week" value={metersThisWeek} />
      </div>
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-muted-foreground text-xs mb-1.5 flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}
