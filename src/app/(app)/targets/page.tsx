import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeTargetProgress } from '@/lib/bonus';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { TargetsManager } from './TargetsManager';
import { TargetsViewOnly } from './TargetsViewOnly';

export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (can(user, 'target.manage')) {
    const [targets, users] = await Promise.all([
      prisma.target.findMany({
        orderBy: { startDate: 'desc' },
        include: { user: { select: { id: true, displayName: true } }, createdBy: { select: { displayName: true } } },
      }),
      prisma.user.findMany({
        where: { active: true, role: { in: ['engineer', 'iskra'] } },
        select: { id: true, displayName: true, role: true },
        orderBy: { displayName: 'asc' },
      }),
    ]);
    const enriched = await Promise.all(
      targets.map(async (t) => ({ ...t, progress: await computeTargetProgress(t.userId, t.workstream, t.startDate, t.endDate) }))
    );
    return (
      <div>
        <PageHeader title="Targets" description="Define goals per user and workstream." />
        <TargetsManager initialTargets={enriched} users={users} />
      </div>
    );
  }

  if (can(user, 'target.view.self')) {
    const ts = await prisma.target.findMany({
      where: { userId: user.id, visibleToUser: true },
      orderBy: { startDate: 'desc' },
    });
    const enriched = await Promise.all(
      ts.map(async (t) => ({ ...t, progress: await computeTargetProgress(t.userId, t.workstream, t.startDate, t.endDate) }))
    );
    return (
      <div>
        <PageHeader title="My targets" description="Targets shared with you." />
        <TargetsViewOnly targets={enriched} />
      </div>
    );
  }

  redirect('/dashboard');
}
