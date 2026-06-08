import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission } from '@/lib/missions';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;

  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      contractor: true,
      members: { include: { user: { select: { id: true, displayName: true, username: true, role: true } } } },
      invitations: { where: { status: 'pending' }, include: { user: { select: { id: true, displayName: true, username: true, role: true } } } },
      referenceFile: true,
      logs: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, displayName: true } } } },
      survey: true,
      _count: { select: { gateways: true, maintMeters: true, installEntries: true, installNotes: true } },
    },
  });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  return ok({ mission });
}
