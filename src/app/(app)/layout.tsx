import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/app-shell/Sidebar';
import { TopBar } from '@/components/app-shell/TopBar';
import { MobileBottomNav } from '@/components/app-shell/MobileBottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const safeUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar user={safeUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={safeUser} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileBottomNav user={safeUser} />
    </div>
  );
}
