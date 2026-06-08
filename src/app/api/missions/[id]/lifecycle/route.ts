import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission, logMissionEvent } from '@/lib/missions';

const schema = z.object({
  action: z.enum(['start', 'end_day', 'resume', 'end_mission']),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');

  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();

  const now = new Date();
  switch (parsed.data.action) {
    case 'start': {
      if (mission.status !== 'planned') return badRequest('Mission must be in planned state to start');
      await prisma.mission.update({
        where: { id: mission.id },
        data: { status: 'active', startedAt: mission.startedAt || now },
      });
      await logMissionEvent(mission.id, 'started', user.id);
      break;
    }
    case 'end_day': {
      if (mission.status !== 'active') return badRequest('Mission must be active to end a day');
      await prisma.mission.update({ where: { id: mission.id }, data: { status: 'paused' } });
      await logMissionEvent(mission.id, 'day_ended', user.id);
      break;
    }
    case 'resume': {
      if (mission.status !== 'paused') return badRequest('Mission must be paused to resume');
      await prisma.mission.update({ where: { id: mission.id }, data: { status: 'active' } });
      await logMissionEvent(mission.id, 'resumed', user.id);
      break;
    }
    case 'end_mission': {
      if (mission.status === 'completed') return badRequest('Mission already completed');
      await prisma.mission.update({
        where: { id: mission.id },
        data: { status: 'completed', endedAt: now },
      });
      await logMissionEvent(mission.id, 'completed', user.id);
      break;
    }
  }

  const updated = await prisma.mission.findUnique({ where: { id: mission.id } });
  return ok({ mission: updated });
}
