import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi, requirePermissionApi } from '@/lib/api';

const schema = z.object({
  title: z.string().min(1),
  location: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  attendeeIds: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  const events = await prisma.agendaEvent.findMany({
    where: {
      ...(start ? { endAt: { gte: new Date(start) } } : {}),
      ...(end ? { startAt: { lte: new Date(end) } } : {}),
      ...(user.role === 'admin' || user.role === 'supervisor'
        ? {}
        : user.role === 'accountant'
          ? { id: '___none___' }
          : { attendees: { some: { userId: user.id } } }),
    },
    orderBy: { startAt: 'asc' },
    include: { attendees: { include: { user: { select: { id: true, displayName: true } } } }, createdBy: { select: { displayName: true } } },
  });
  return ok({ events });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('agenda.manageEvents');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const ev = await prisma.agendaEvent.create({
    data: {
      title: parsed.data.title,
      location: parsed.data.location,
      note: parsed.data.note,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      createdById: user.id,
      attendees: { create: parsed.data.attendeeIds.map((uid) => ({ userId: uid })) },
    },
  });
  return created({ event: ev });
}
