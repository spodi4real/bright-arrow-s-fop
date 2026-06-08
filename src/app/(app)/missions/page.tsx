import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { missionWhereForUser } from '@/lib/missions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Briefcase, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'accountant') redirect('/dashboard');

  const missions = await prisma.mission.findMany({
    where: missionWhereForUser(user),
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { displayName: true } },
      contractor: { select: { displayName: true } },
      members: { include: { user: { select: { displayName: true } } } },
      _count: { select: { gateways: true, maintMeters: true, installEntries: true, installNotes: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Missions"
        description="All field missions across the team."
        actions={<Button asChild><Link href="/missions/new">New Mission</Link></Button>}
      />

      {missions.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No missions yet. Create the first one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {missions.map((m) => {
            const itemCount =
              m.type === 'rf_site_survey'
                ? m._count.gateways
                : m.type === 'site_maintenance'
                ? m._count.maintMeters
                : m._count.installEntries + m._count.installNotes;
            return (
              <Link key={m.id} href={`/missions/${m.id}`} className="block">
                <Card className="p-4 hover:border-primary/40 transition-colors h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{m.type.replace(/_/g, ' ')}</div>
                    </div>
                    <Badge variant={m.status === 'active' ? 'success' : m.status === 'completed' ? 'muted' : m.status === 'paused' ? 'warning' : 'primary'}>
                      {m.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span className="capitalize">{m.district}</span>
                    <span>·</span>
                    <span>{m.zoneName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>{m.members.length} {m.members.length === 1 ? 'member' : 'members'}</span>
                    <span>
                      {itemCount} {m.type === 'rf_site_survey' ? 'gateways' : m.type === 'site_maintenance' ? 'meters' : 'entries'}
                      {m.expectedGatewayCount ? ` / ${m.expectedGatewayCount}` : ''}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
