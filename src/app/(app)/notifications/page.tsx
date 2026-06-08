import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { MarkAllRead } from './MarkAllRead';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const notifs = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return (
    <div>
      <PageHeader title="Notifications" description={`${notifs.filter((n) => !n.read).length} unread`} actions={<MarkAllRead />} />
      {notifs.length === 0 ? (
        <Card className="p-12 text-center"><Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No notifications.</p></Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Card key={n.id} className={!n.read ? 'border-primary/30 bg-primary/5' : ''}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{n.title}</div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  {n.link && <Link href={n.link} className="text-xs text-primary hover:underline mt-1 inline-block">View →</Link>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(n.createdAt), 'MMM d, HH:mm')}</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
