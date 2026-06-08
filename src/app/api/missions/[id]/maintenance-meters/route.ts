import { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission, logMissionEvent, missionFolderAbsolute, missionFolderRelative } from '@/lib/missions';
import { safePathSegment } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  const meters = await prisma.maintenanceMeter.findMany({
    where: { missionId: mission.id },
    orderBy: { registeredAt: 'desc' },
    include: { registeredBy: { select: { id: true, displayName: true } }, files: true },
  });
  return ok({ meters });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  if (mission.type !== 'site_maintenance') return badRequest('Not a maintenance mission');
  if (mission.status !== 'active') return badRequest('Mission must be active to register a meter');

  const formData = await req.formData();
  const serial = String(formData.get('serialNumber') || '').trim();
  if (!serial) return badRequest('Serial number is required');
  const location = String(formData.get('location') || '').trim();
  if (!location) return badRequest('Location is required');
  const enclosure = String(formData.get('enclosureNumber') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  const status = String(formData.get('status') || 'ongoing');
  if (!['resolved', 'ongoing', 'out_of_scope'].includes(status)) return badRequest('Invalid status');
  const photo = formData.get('photo');
  if (!(photo instanceof File)) return badRequest('Photo is required');

  const folderRel = path.join(missionFolderRelative(mission.type, mission.slug, mission.id), safePathSegment(serial));
  const folderAbs = path.join(missionFolderAbsolute(mission.type, mission.slug, mission.id), safePathSegment(serial));
  await fs.mkdir(folderAbs, { recursive: true });

  const meter = await prisma.maintenanceMeter.create({
    data: {
      missionId: mission.id,
      serialNumber: serial,
      location,
      enclosureNumber: enclosure,
      description,
      status: status as 'resolved' | 'ongoing' | 'out_of_scope',
      registeredById: user.id,
    },
  });

  const buf = Buffer.from(await photo.arrayBuffer());
  const ext = path.extname(photo.name) || '.jpg';
  const filename = `meter_photo${ext}`;
  const dest = path.join(folderAbs, filename);
  await fs.writeFile(dest, buf);
  await prisma.fileRecord.create({
    data: {
      path: dest,
      relativePath: path.join(folderRel, filename),
      originalName: photo.name || filename,
      mimeType: photo.type || 'image/jpeg',
      sizeBytes: buf.length,
      category: 'site_maintenance',
      uploadedById: user.id,
      missionId: mission.id,
      maintenanceMeterId: meter.id,
    },
  });

  await logMissionEvent(mission.id, 'item_registered', user.id, { serial });
  const full = await prisma.maintenanceMeter.findUnique({
    where: { id: meter.id },
    include: { registeredBy: { select: { id: true, displayName: true } }, files: true },
  });
  return ok({ meter: full });
}
