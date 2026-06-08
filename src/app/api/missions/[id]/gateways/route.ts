import { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission, missionFolderAbsolute, missionFolderRelative, logMissionEvent } from '@/lib/missions';
import { parseCoordinates, safePathSegment } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();

  const gateways = await prisma.gateway.findMany({
    where: { missionId: mission.id },
    orderBy: { registeredAt: 'desc' },
    include: {
      registeredBy: { select: { id: true, displayName: true } },
      files: true,
    },
  });
  return ok({ gateways });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  if (mission.type !== 'rf_site_survey') return badRequest('This mission is not RF site survey');
  if (mission.status !== 'active') return badRequest('Mission must be active to register a gateway');

  const formData = await req.formData();
  const gatewayId = String(formData.get('gatewayId') || '').trim();
  if (!gatewayId) return badRequest('Gateway ID required');

  const coordsText = String(formData.get('coordinatesText') || '').trim();
  const coords = coordsText ? parseCoordinates(coordsText) : null;
  const korek = String(formData.get('korekRating') || '').trim() || null;
  const zain = String(formData.get('zainRating') || '').trim() || null;
  const asia = String(formData.get('asiacellRating') || '').trim() || null;

  const folderRel = path.join(
    missionFolderRelative(mission.type, mission.slug, mission.id),
    safePathSegment(gatewayId)
  );
  const folderAbs = path.join(missionFolderAbsolute(mission.type, mission.slug, mission.id), safePathSegment(gatewayId));
  await fs.mkdir(folderAbs, { recursive: true });

  // Required files: pole, video, korek, zain
  const required = ['polePhoto', 'areaVideo', 'korekSignalPhoto', 'zainSignalPhoto'] as const;
  for (const k of required) {
    if (!(formData.get(k) instanceof File)) return badRequest(`Missing required file: ${k}`);
  }

  const created = await prisma.gateway.create({
    data: {
      missionId: mission.id,
      gatewayId,
      latitude: coords?.lat,
      longitude: coords?.lng,
      coordinatesText: coordsText || null,
      korekRating: korek as 'bad' | 'good' | 'perfect' | null,
      zainRating: zain as 'bad' | 'good' | 'perfect' | null,
      asiacellRating: asia as 'bad' | 'good' | 'perfect' | null,
      registeredById: user.id,
    },
  });

  const fileFields = [
    { key: 'polePhoto', name: `${safePathSegment(gatewayId)}-pole` },
    { key: 'areaVideo', name: `${safePathSegment(gatewayId)}-video` },
    { key: 'korekSignalPhoto', name: 'korek_signal' },
    { key: 'zainSignalPhoto', name: 'zain_signal' },
    { key: 'asiacellSignalPhoto', name: 'asiacell_signal' },
    { key: 'coordinatesProof', name: 'coordinates_proof' },
  ];

  for (const ff of fileFields) {
    const f = formData.get(ff.key);
    if (!(f instanceof File)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = path.extname(f.name) || (f.type.startsWith('video') ? '.mp4' : '.jpg');
    const filename = `${ff.name}${ext}`;
    const dest = path.join(folderAbs, filename);
    await fs.writeFile(dest, buf);
    await prisma.fileRecord.create({
      data: {
        path: dest,
        relativePath: path.join(folderRel, filename),
        originalName: f.name || filename,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: buf.length,
        category: 'site_surveys',
        uploadedById: user.id,
        missionId: mission.id,
        gatewayId: created.id,
      },
    });
  }

  await logMissionEvent(mission.id, 'item_registered', user.id, { gatewayId });

  const full = await prisma.gateway.findUnique({
    where: { id: created.id },
    include: { registeredBy: { select: { id: true, displayName: true } }, files: true },
  });
  return ok({ gateway: full });
}
