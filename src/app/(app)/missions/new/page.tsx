import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { NewMissionForm } from './NewMissionForm';

export default async function NewMissionPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'mission.create')) redirect('/dashboard');

  const candidates = await prisma.user.findMany({
    where: { active: true, id: { not: user.id }, role: { in: ['admin', 'supervisor', 'iskra', 'engineer'] } },
    select: { id: true, displayName: true, username: true, role: true },
    orderBy: { displayName: 'asc' },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="New mission" description="Pick a type and fill out the details." />
      <NewMissionForm
        candidates={candidates}
        isAdmin={user.role === 'admin'}
        currentUser={{ id: user.id, displayName: user.displayName, role: user.role }}
      />
    </div>
  );
}
