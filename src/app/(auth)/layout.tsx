import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');
  return <div className="min-h-dvh flex items-center justify-center p-4 bg-background">{children}</div>;
}
