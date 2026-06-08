import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Briefcase, Activity, Users as UsersIcon } from 'lucide-react';
import { startOfMonth } from 'date-fns';

export async function SupervisorDashboard({ userId }: { userId: string }) {
  const [active, completedThisMonth, totalUsers, recentMissions] = await Promise.all([
    prisma.mission.count({ where: { status: 'active' } }),
    prisma.mission.count({ where: { status: 'completed', endedAt: { gte: startOfMonth(new Date()) } } }),
    prisma.user.count({ where: { active: true } }),
    prisma.mission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { createdBy: { select: { displayName: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Team operations overview."
        actions={<Button asChild size="sm"><Link href="/missions/new">New Mission</Link></Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Briefcase className="h-4 w-4" />} label="Active missions" value={active} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Completed this month" value={completedThisMonth} />
        <StatCard icon={<UsersIcon className="h-4 w-4" />} label="Active users" value={totalUsers} />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent missions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentMissions.map((m) => (
            <Link key={m.id} href={`/missions/${m.id}`} className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-muted/40">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.type.replace(/_/g, ' ')} · {m.createdBy.displayName}</div>
              </div>
              <Badge variant={m.status === 'active' ? 'success' : m.status === 'completed' ? 'muted' : 'primary'}>
                {m.status}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-muted-foreground text-xs flex items-center gap-2 mb-1.5">{icon} {label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
