import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi, requirePermissionApi } from '@/lib/api';
import { computeTargetProgress } from '@/lib/bonus';

const schema = z.object({
  userId: z.string(),
  workstream: z.enum(['rf_site_survey', 'site_maintenance', 'installation_supervising']),
  metricLabel: z.string().min(1),
  amount: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  visibleToUser: z.boolean().default(false),
});

export async function GET() {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const isAdmin = user.role === 'admin';
  const targets = await prisma.target.findMany({
    where: isAdmin ? {} : { userId: user.id, visibleToUser: true },
    orderBy: { startDate: 'desc' },
    include: { user: { select: { displayName: true } }, createdBy: { select: { displayName: true } } },
  });
  const enriched = await Promise.all(
    targets.map(async (t) => {
      const progress = await computeTargetProgress(t.userId, t.workstream, t.startDate, t.endDate);
      return { ...t, progress };
    })
  );
  return ok({ targets: enriched });
}

export async function POST(req: NextRequest) {
  const user = await requirePermissionApi('target.manage');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input', { issues: parsed.error.flatten() });
  const t = await prisma.target.create({
    data: {
      userId: parsed.data.userId,
      workstream: parsed.data.workstream,
      metricLabel: parsed.data.metricLabel,
      amount: parsed.data.amount,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      visibleToUser: parsed.data.visibleToUser,
      createdById: user.id,
    },
  });
  if (parsed.data.visibleToUser) {
    await prisma.notification.create({
      data: {
        userId: parsed.data.userId,
        type: 'target_assigned',
        title: 'New target assigned',
        message: parsed.data.metricLabel,
        link: '/targets',
      },
    });
  }
  return created({ target: t });
}
