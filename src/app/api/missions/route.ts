import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, badRequest, created, requireApi, isResponse, requirePermissionApi, forbidden } from '@/lib/api';
import { ensureMissionFolders, generateUniqueSlug, logMissionEvent, missionWhereForUser } from '@/lib/missions';
import { can } from '@/lib/permissions';
import { MissionType } from '@prisma/client';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(['rf_site_survey', 'site_maintenance', 'installation_supervising']),
  district: z.enum(['sulaymaniyah', 'duhok', 'erbil']),
  zoneName: z.string().min(1).max(120),
  contractor: z.enum(['bim', 'broadcast', 'shandez']).optional(),
  meterTypes: z.array(z.enum(['me516', 'me513', 'mt880', 'am550dc', 'am550ct', 'gateway'])).optional(),
  scheduledStartAt: z.string(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const district = url.searchParams.get('district');

  const where: Record<string, unknown> = missionWhereForUser(user) as Record<string, unknown>;
  if (status) (where as Record<string, unknown>).status = status;
  if (type) (where as Record<string, unknown>).type = type;
  if (district) (where as Record<string, unknown>).district = district;

  const missions = await prisma.mission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      contractor: { select: { id: true, name: true, displayName: true } },
      members: { include: { user: { select: { id: true, displayName: true } } } },
      _count: { select: { gateways: true, maintMeters: true, installEntries: true, installNotes: true, invitations: true } },
    },
    take: 200,
  });
  return ok({ missions });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('mission.create');
  if (isResponse(user)) return user;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid input', { issues: parsed.error.flatten() });
  const { name, type, district, zoneName, contractor, meterTypes, scheduledStartAt, memberIds } = parsed.data;

  if (type === 'installation_supervising' && !contractor) {
    return badRequest('Contractor is required for installation supervising');
  }
  if (type === 'site_maintenance' && (!meterTypes || meterTypes.length === 0)) {
    return badRequest('At least one meter type is required for maintenance missions');
  }

  const slug = await generateUniqueSlug(name);
  let contractorId: string | undefined;
  if (contractor) {
    const c = await prisma.contractor.findUnique({ where: { name: contractor } });
    if (!c) return badRequest('Unknown contractor');
    contractorId = c.id;
  }

  const mission = await prisma.mission.create({
    data: {
      name,
      type: type as MissionType,
      status: 'planned',
      district,
      zoneName,
      contractorId,
      meterTypes: meterTypes || [],
      scheduledStartAt: new Date(scheduledStartAt),
      slug,
      createdById: user.id,
      members: { create: [{ userId: user.id }] },
    },
  });

  await ensureMissionFolders(mission.type, slug, mission.id);
  await logMissionEvent(mission.id, 'created', user.id, { name, type });

  // Members handling
  if (memberIds && memberIds.length > 0) {
    const otherIds = memberIds.filter((id) => id !== user.id);
    if (user.role === 'admin') {
      // Add directly
      for (const uid of otherIds) {
        await prisma.missionMember.upsert({
          where: { missionId_userId: { missionId: mission.id, userId: uid } },
          update: {},
          create: { missionId: mission.id, userId: uid },
        });
        await logMissionEvent(mission.id, 'member_added', user.id, { userId: uid });
        await prisma.notification.create({
          data: {
            userId: uid,
            type: 'mission_invitation',
            title: 'Added to mission',
            message: `You were added to "${mission.name}".`,
            link: `/missions/${mission.id}`,
          },
        });
      }
    } else {
      for (const uid of otherIds) {
        await prisma.missionInvitation.upsert({
          where: { missionId_userId: { missionId: mission.id, userId: uid } },
          update: { status: 'pending', invitedById: user.id, respondedAt: null },
          create: { missionId: mission.id, userId: uid, invitedById: user.id },
        });
        await prisma.notification.create({
          data: {
            userId: uid,
            type: 'mission_invitation',
            title: 'New mission invitation',
            message: `${user.displayName} invited you to "${mission.name}".`,
            link: `/missions/${mission.id}`,
          },
        });
      }
    }
  }

  return created({ mission });
}
