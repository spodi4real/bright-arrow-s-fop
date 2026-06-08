import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { getCurrentExchangeRate } from '@/lib/currency';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { SettingsView } from './SettingsView';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const rate = await getCurrentExchangeRate();
  return (
    <div>
      <PageHeader title="Settings" description="Personal preferences and system configuration." />
      <SettingsView
        user={{ id: user.id, username: user.username, displayName: user.displayName, role: user.role, email: user.email }}
        canEditRate={can(user, 'exchangeRate.edit')}
        currentRate={rate}
      />
    </div>
  );
}
