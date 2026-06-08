import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { computeBonusForUser } from '@/lib/bonus';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { startOfMonth, endOfMonth } from 'date-fns';
import { BonusScoresTable } from './BonusScoresTable';

export const dynamic = 'force-dynamic';

export default async function BonusScoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'bonus.viewAll')) redirect('/dashboard');

  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ['engineer', 'iskra', 'supervisor'] } },
    select: { id: true, displayName: true, role: true },
    orderBy: { displayName: 'asc' },
  });
  const rows = await Promise.all(
    users.map(async (u) => ({
      user: u,
      breakdown: await computeBonusForUser(u.id, start, end),
    }))
  );
  rows.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  return (
    <div>
      <PageHeader title="Bonus scores" description="Performance scores for the current month." />
      <BonusScoresTable rows={rows} />
    </div>
  );
}
