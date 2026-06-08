import { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission, missionFolderAbsolute, missionFolderRelative } from '@/lib/missions';
import { parseReferenceFile } from '@/lib/reference-file';
import { safePathSegment } from '@/lib/utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  if (mission.type !== 'rf_site_survey') return badRequest('Reference files are only for RF site survey missions');

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return badRequest('No file uploaded');

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = safePathSegment(file.name || 'reference');

  let parsed;
  try {
    parsed = await parseReferenceFile(filename, buffer);
  } catch (e) {
    return badRequest((e as Error).message);
  }

  const folder = missionFolderAbsolute(mission.type, mission.slug, mission.id);
  await fs.mkdir(folder, { recursive: true });
  const dest = path.join(folder, filename);
  await fs.writeFile(dest, buffer);

  const fileRec = await prisma.fileRecord.create({
    data: {
      path: dest,
      relativePath: path.join(missionFolderRelative(mission.type, mission.slug, mission.id), filename),
      originalName: file.name || 'reference',
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buffer.length,
      category: 'site_surveys',
      uploadedById: user.id,
      missionId: mission.id,
    },
  });

  await prisma.mission.update({
    where: { id: mission.id },
    data: {
      referenceFileId: fileRec.id,
      expectedGatewayCount: parsed.count,
    },
  });

  return ok({ expectedGatewayCount: parsed.count, file: fileRec });
}
