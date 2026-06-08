import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { AgendaView } from './AgendaView';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const now = new Date();
  const monthStart = startOfWeek(startOfMonth(now));
  const monthEnd = endOfWeek(endOfMonth(now));

  const isAdmin = can(user, 'agenda.view.all');
  const isAccountant = user.role === 'accountant';

  const [events, missions, holidays, users] = await Promise.all([
    prisma.agendaEvent.findMany({
      where: {
        startAt: { lte: monthEnd },
        endAt: { gte: monthStart },
        ...(isAdmin
          ? {}
          : isAccountant
            ? { id: '___none___' }
            : { attendees: { some: { userId: user.id } } }),
      },
      include: { attendees: { include: { user: { select: { displayName: true } } } } },
    }),
    isAccountant ? [] : prisma.mission.findMany({
      where: {
        scheduledStartAt: { lte: monthEnd },
        ...(isAdmin ? {} : { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] }),
        NOT: { status: 'completed' },
      },
      select: { id: true, name: true, scheduledStartAt: true, status: true, type: true, endedAt: true },
    }),
    prisma.holiday.findMany({ where: { startDate: { lte: monthEnd }, endDate: { gte: monthStart } } }),
    isAdmin
      ? prisma.user.findMany({ where: { active: true }, select: { id: true, displayName: true, role: true }, orderBy: { displayName: 'asc' } })
      : [],
  ]);

  return (
    <div>
      <PageHeader title="Agenda" description="Missions, events, and holidays." />
      <AgendaView
        events={events as any}
        missions={missions as any}
        holidays={holidays as any}
        users={users as any}
        canManageEvents={can(user, 'agenda.manageEvents')}
        canManageHolidays={can(user, 'agenda.manageHolidays')}
      />
    </div>
  );
}
