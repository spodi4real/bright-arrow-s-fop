import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi, requirePermissionApi } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET() {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const holidays = await prisma.holiday.findMany({ orderBy: { startDate: 'asc' } });
  return ok({ holidays });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('agenda.manageHolidays');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const h = await prisma.holiday.create({
    data: {
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      createdById: user.id,
    },
  });
  return created({ holiday: h });
}
