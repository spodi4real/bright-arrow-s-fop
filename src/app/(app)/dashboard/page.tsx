import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminDashboard } from './AdminDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { IskraDashboard } from './IskraDashboard';
import { EngineerDashboard } from './EngineerDashboard';
import { AccountantDashboard } from './AccountantDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  switch (user.role) {
    case 'admin': return <AdminDashboard userId={user.id} />;
    case 'supervisor': return <SupervisorDashboard userId={user.id} />;
    case 'iskra': return <IskraDashboard userId={user.id} />;
    case 'engineer': return <EngineerDashboard userId={user.id} />;
    case 'accountant': return <AccountantDashboard userId={user.id} />;
  }
}
