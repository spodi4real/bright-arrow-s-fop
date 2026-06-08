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
  const meters = await prisma.installationMeter.findMany({
    where: { missionId: mission.id },
    orderBy: { registeredAt: 'desc' },
    include: { registeredBy: { select: { id: true, displayName: true } }, files: true },
  });
  const notes = await prisma.installationNote.findMany({
    where: { missionId: mission.id },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, displayName: true } }, files: true },
  });
  return ok({ meters, notes });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  if (mission.type !== 'installation_supervising') return badRequest('Not an installation mission');
  if (mission.status !== 'active') return badRequest('Mission must be active to register entries');

  const formData = await req.formData();
  const kind = String(formData.get('kind') || '');

  if (kind === 'meter') {
    const serial = String(formData.get('serialNumber') || '').trim();
    if (!serial) return badRequest('Serial number is required');
    const observation = String(formData.get('observation') || '').trim() || null;
    const folderRel = path.join(
      missionFolderRelative(mission.type, mission.slug, mission.id),
      'meters',
      safePathSegment(serial)
    );
    const folderAbs = path.join(missionFolderAbsolute(mission.type, mission.slug, mission.id), 'meters', safePathSegment(serial));
    await fs.mkdir(folderAbs, { recursive: true });

    const meter = await prisma.installationMeter.create({
      data: {
        missionId: mission.id,
        serialNumber: serial,
        observation,
        registeredById: user.id,
      },
    });
    const photo = formData.get('photo');
    if (photo instanceof File && photo.size > 0) {
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
          category: 'installations',
          uploadedById: user.id,
          missionId: mission.id,
          installationMeterId: meter.id,
        },
      });
    }
    await logMissionEvent(mission.id, 'item_registered', user.id, { kind: 'meter', serial });
    return ok({ meter });
  }

  if (kind === 'note') {
    const text = String(formData.get('noteText') || '').trim();
    if (!text) return badRequest('Note text is required');
    const note = await prisma.installationNote.create({
      data: { missionId: mission.id, noteText: text, createdById: user.id },
    });
    const folderRel = path.join(
      missionFolderRelative(mission.type, mission.slug, mission.id),
      'notes',
      safePathSegment(note.id)
    );
    const folderAbs = path.join(missionFolderAbsolute(mission.type, mission.slug, mission.id), 'notes', safePathSegment(note.id));
    const photo = formData.get('photo');
    if (photo instanceof File && photo.size > 0) {
      await fs.mkdir(folderAbs, { recursive: true });
      const buf = Buffer.from(await photo.arrayBuffer());
      const ext = path.extname(photo.name) || '.jpg';
      const filename = `attachment${ext}`;
      const dest = path.join(folderAbs, filename);
      await fs.writeFile(dest, buf);
      await prisma.fileRecord.create({
        data: {
          path: dest,
          relativePath: path.join(folderRel, filename),
          originalName: photo.name || filename,
          mimeType: photo.type || 'image/jpeg',
          sizeBytes: buf.length,
          category: 'installations',
          uploadedById: user.id,
          missionId: mission.id,
          installationNoteId: note.id,
        },
      });
    }
    await logMissionEvent(mission.id, 'item_registered', user.id, { kind: 'note' });
    return ok({ note });
  }

  return badRequest('Unknown entry kind');
}
