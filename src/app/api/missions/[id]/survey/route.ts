import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isResponse, notFound, ok, requireApi } from '@/lib/api';
import { canAccessMission } from '@/lib/missions';

const schema = z.object({
  missionRating: z.number().int().min(1).max(5).optional().nullable(),
  generalNotes: z.string().optional().nullable(),
  contractorRating: z.number().int().min(1).max(5).optional().nullable(),
  problemsEncountered: z.string().optional().nullable(),
  personalProblems: z.string().optional().nullable(),
  recurringIssues: z.string().optional().nullable(),
  suggestions: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  const data = parsed.data;

  if (mission.type === 'rf_site_survey') data.contractorRating = null;

  const survey = await prisma.postMissionSurvey.upsert({
    where: { missionId: mission.id },
    update: data,
    create: {
      missionId: mission.id,
      submittedById: user.id,
      ...data,
    },
  });
  return ok({ survey });
}
