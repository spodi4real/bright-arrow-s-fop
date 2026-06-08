import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { UsersManager } from './UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'user.manage')) redirect('/dashboard');
  const users = await prisma.user.findMany({
    orderBy: { displayName: 'asc' },
    select: { id: true, username: true, displayName: true, role: true, email: true, active: true, createdAt: true },
  });
  return (
    <div>
      <PageHeader title="Users" description="Manage team accounts." />
      <UsersManager initial={users} currentUserId={user.id} />
    </div>
  );
}
