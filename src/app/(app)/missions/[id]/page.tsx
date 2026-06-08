import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessMission } from '@/lib/missions';
import { MissionDetail } from './MissionDetail';

export const dynamic = 'force-dynamic';

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'accountant') redirect('/dashboard');

  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      contractor: true,
      members: { include: { user: { select: { id: true, displayName: true, username: true, role: true } } } },
      invitations: {
        where: { status: 'pending' },
        include: { user: { select: { id: true, displayName: true, username: true } } },
      },
      referenceFile: true,
      survey: true,
      _count: { select: { gateways: true, maintMeters: true, installEntries: true, installNotes: true } },
    },
  });
  if (!mission) notFound();
  const allowed = await canAccessMission(mission, user);
  if (!allowed) redirect('/missions');

  const pendingInvitation = await prisma.missionInvitation.findUnique({
    where: { missionId_userId: { missionId: mission.id, userId: user.id } },
  });
  const isMember = mission.members.some((m) => m.user.id === user.id) || mission.createdById === user.id;

  return (
    <MissionDetail
      mission={mission}
      currentUser={{ id: user.id, role: user.role, displayName: user.displayName }}
      hasPendingInvite={pendingInvitation?.status === 'pending'}
      isMember={isMember}
    />
  );
}
