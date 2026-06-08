import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission, logMissionEvent } from '@/lib/missions';

const schema = z.object({
  action: z.enum(['accept', 'decline']),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');

  const inv = await prisma.missionInvitation.findUnique({
    where: { missionId_userId: { missionId: params.id, userId: user.id } },
  });
  if (!inv || inv.status !== 'pending') return notFound();

  if (parsed.data.action === 'accept') {
    await prisma.missionInvitation.update({
      where: { id: inv.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });
    await prisma.missionMember.upsert({
      where: { missionId_userId: { missionId: params.id, userId: user.id } },
      update: {},
      create: { missionId: params.id, userId: user.id },
    });
    await logMissionEvent(params.id, 'member_added', user.id);
  } else {
    await prisma.missionInvitation.update({
      where: { id: inv.id },
      data: { status: 'declined', respondedAt: new Date() },
    });
  }
  return ok({ ok: true });
}
