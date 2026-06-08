import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fileExists, statFile, streamFile } from '@/lib/storage';
import { forbidden, isResponse, notFound, requireApi } from '@/lib/api';
import { canAccessMission } from '@/lib/missions';
import type { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;

  const record = await prisma.fileRecord.findUnique({
    where: { id: params.id },
    include: { mission: true, expense: true, violation: true },
  });
  if (!record) return notFound();

  const allowed = await canAccessFileRecord(user, record);
  if (!allowed) return forbidden();

  if (!(await fileExists(record.path))) return notFound();
  const stat = await statFile(record.path);
  const stream = streamFile(record.path) as unknown as ReadableStream;
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'content-type': record.mimeType || 'application/octet-stream',
      'content-length': String(stat.size),
      'cache-control': 'private, max-age=3600',
      'content-disposition': `inline; filename="${encodeURIComponent(record.originalName)}"`,
    },
  });
}

async function canAccessFileRecord(
  user: { id: string; role: Role },
  record: { category: string; missionId: string | null; mission: { id: string; createdById: string } | null; expense: { submittedById: string } | null; uploadedById: string }
): Promise<boolean> {
  if (user.role === 'admin') return true;

  if (record.category === 'expenses' || record.expense) {
    if (user.role === 'accountant') return true;
    if (record.expense?.submittedById === user.id) return true;
    return false;
  }

  if (user.role === 'accountant') return false;

  if (record.category === 'violations') {
    if (user.role === 'supervisor' || user.role === 'iskra') return true;
    return record.uploadedById === user.id;
  }

  if (record.category === 'general') {
    return user.role === 'supervisor' || user.role === 'iskra' || record.uploadedById === user.id;
  }

  if (record.mission) {
    return canAccessMission(record.mission, user);
  }

  return record.uploadedById === user.id;
}
