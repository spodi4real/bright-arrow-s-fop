import { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requirePermissionApi } from '@/lib/api';
import { storageRoot } from '@/lib/storage';
import { safePathSegment } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  contractor: z.enum(['bim', 'broadcast', 'shandez']),
  district: z.enum(['sulaymaniyah', 'duhok', 'erbil']),
  place: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function GET() {
  const user = await requirePermissionApi('violation.view');
  if (isResponse(user)) return user;
  const violations = await prisma.violation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      contractor: { select: { name: true, displayName: true } },
      submittedBy: { select: { id: true, displayName: true } },
      files: { select: { id: true, originalName: true, mimeType: true } },
    },
    take: 200,
  });
  return ok({ violations });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('violation.create');
  if (isResponse(user)) return user;

  const formData = await req.formData();
  const json = {
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    contractor: String(formData.get('contractor') || ''),
    district: String(formData.get('district') || ''),
    place: String(formData.get('place') || ''),
    severity: String(formData.get('severity') || 'medium'),
  };
  const parsed = schema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid input', { issues: parsed.error.flatten() });

  const contractor = await prisma.contractor.findUnique({ where: { name: parsed.data.contractor } });
  if (!contractor) return badRequest('Unknown contractor');

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return badRequest('At least one proof file is required');

  const violation = await prisma.violation.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      contractorId: contractor.id,
      district: parsed.data.district,
      place: parsed.data.place,
      severity: parsed.data.severity,
      submittedById: user.id,
    },
  });

  const folderRel = path.join('violations', safePathSegment(violation.id));
  const folderAbs = path.join(storageRoot(), folderRel);
  await fs.mkdir(folderAbs, { recursive: true });

  let i = 1;
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = path.extname(f.name) || (f.type.startsWith('video') ? '.mp4' : '.jpg');
    const filename = `proof_${String(i).padStart(3, '0')}${ext}`;
    const dest = path.join(folderAbs, filename);
    await fs.writeFile(dest, buf);
    await prisma.fileRecord.create({
      data: {
        path: dest,
        relativePath: path.join(folderRel, filename),
        originalName: f.name || filename,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: buf.length,
        category: 'violations',
        uploadedById: user.id,
        violationId: violation.id,
      },
    });
    i += 1;
  }

  return created({ violation });
}
