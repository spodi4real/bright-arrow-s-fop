import 'server-only';
import { prisma } from './prisma';

const WEIGHTS = {
  targetHitPct: 0.25,
  productivity: 0.2,
  quality: 0.15,
  reliability: 0.15,
  initiative: 0.1,
  collaboration: 0.1,
  violationReports: 0.05,
};

export type BonusBreakdown = {
  targetHitPct: number;
  productivity: number;
  quality: number;
  reliability: number;
  initiative: number;
  collaboration: number;
  violationReports: number;
  totalScore: number;
};

function clamp(v: number, min = 0, max = 100): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

function normalizeAgainstAvg(value: number, avg: number): number {
  if (avg <= 0) return value > 0 ? 100 : 50;
  const ratio = value / avg;
  return clamp(50 + (ratio - 1) * 50);
}

export async function computeBonusForUser(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  context?: { teamAverages?: Partial<Record<keyof BonusBreakdown, number>> }
): Promise<BonusBreakdown> {
  const targets = await prisma.target.findMany({
    where: { userId, startDate: { lte: periodEnd }, endDate: { gte: periodStart } },
  });

  // Target hit %
  let targetHit = 0;
  if (targets.length > 0) {
    const ratios = await Promise.all(
      targets.map(async (t) => {
        const progress = await computeTargetProgress(userId, t.workstream, t.startDate, t.endDate);
        return Math.min(100, (progress / Math.max(1, t.amount)) * 100);
      })
    );
    targetHit = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  } else {
    targetHit = 50;
  }

  // Productivity: items registered per mission-day during the period
  const memberships = await prisma.missionMember.findMany({
    where: {
      userId,
      mission: {
        startedAt: { gte: periodStart, lte: periodEnd },
      },
    },
    include: { mission: true },
  });

  let totalItems = 0;
  let totalDays = 0;
  for (const m of memberships) {
    const days = m.mission.endedAt && m.mission.startedAt
      ? Math.max(1, Math.ceil((m.mission.endedAt.getTime() - m.mission.startedAt.getTime()) / 86400000))
      : 1;
    totalDays += days;
    const gw = await prisma.gateway.count({ where: { missionId: m.missionId, registeredById: userId } });
    const mm = await prisma.maintenanceMeter.count({ where: { missionId: m.missionId, registeredById: userId } });
    const im = await prisma.installationMeter.count({ where: { missionId: m.missionId, registeredById: userId } });
    totalItems += gw + mm + im;
  }
  const itemsPerDay = totalDays > 0 ? totalItems / totalDays : 0;
  const productivity = normalizeAgainstAvg(itemsPerDay, context?.teamAverages?.productivity ?? itemsPerDay);

  // Quality: % of optional fields filled (gateway optional fields)
  const myGateways = await prisma.gateway.findMany({ where: { registeredById: userId, registeredAt: { gte: periodStart, lte: periodEnd } } });
  let qualitySum = 0;
  for (const g of myGateways) {
    const optional = [g.coordinatesText, g.korekRating, g.zainRating, g.asiacellRating];
    const filled = optional.filter((x) => x !== null && x !== undefined && x !== '').length;
    qualitySum += (filled / optional.length) * 100;
  }
  const quality = myGateways.length > 0 ? qualitySum / myGateways.length : 70;

  // Reliability: % of missions started within 30 min of scheduled and ended by planned end
  let reliable = 0;
  let totalMissions = 0;
  for (const m of memberships) {
    totalMissions++;
    if (m.mission.startedAt) {
      const delta = Math.abs(m.mission.startedAt.getTime() - m.mission.scheduledStartAt.getTime());
      if (delta <= 30 * 60 * 1000) reliable++;
    }
  }
  const reliability = totalMissions > 0 ? (reliable / totalMissions) * 100 : 70;

  // Initiative: missions created / total in period
  const createdCount = await prisma.mission.count({
    where: { createdById: userId, createdAt: { gte: periodStart, lte: periodEnd } },
  });
  const totalInPeriod = await prisma.mission.count({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });
  const initiative = totalInPeriod > 0 ? clamp((createdCount / totalInPeriod) * 100 * 3) : 50;

  // Collaboration: % of own missions with at least one teammate
  let collabOk = 0;
  for (const m of memberships) {
    const ct = await prisma.missionMember.count({ where: { missionId: m.missionId } });
    if (ct >= 2) collabOk++;
  }
  const collaboration = memberships.length > 0 ? (collabOk / memberships.length) * 100 : 50;

  // Violation reports (capped)
  const vr = await prisma.violation.count({ where: { submittedById: userId, createdAt: { gte: periodStart, lte: periodEnd } } });
  const violationReports = clamp(vr * 10);

  const totalScore = clamp(
    targetHit * WEIGHTS.targetHitPct +
      productivity * WEIGHTS.productivity +
      quality * WEIGHTS.quality +
      reliability * WEIGHTS.reliability +
      initiative * WEIGHTS.initiative +
      collaboration * WEIGHTS.collaboration +
      violationReports * WEIGHTS.violationReports
  );

  return {
    targetHitPct: clamp(targetHit),
    productivity: clamp(productivity),
    quality: clamp(quality),
    reliability: clamp(reliability),
    initiative: clamp(initiative),
    collaboration: clamp(collaboration),
    violationReports: clamp(violationReports),
    totalScore,
  };
}

export async function computeTargetProgress(
  userId: string,
  workstream: 'rf_site_survey' | 'site_maintenance' | 'installation_supervising' | 'comm_check',
  start: Date,
  end: Date
): Promise<number> {
  if (workstream === 'rf_site_survey') {
    const c = await prisma.gateway.count({
      where: {
        registeredAt: { gte: start, lte: end },
        mission: {
          type: 'rf_site_survey',
          members: { some: { userId } },
        },
      },
    });
    return c;
  }
  if (workstream === 'site_maintenance') {
    return prisma.maintenanceMeter.count({
      where: {
        registeredAt: { gte: start, lte: end },
        mission: { type: 'site_maintenance', members: { some: { userId } } },
      },
    });
  }
  if (workstream === 'installation_supervising') {
    return prisma.installationMeter.count({
      where: {
        registeredAt: { gte: start, lte: end },
        mission: { type: 'installation_supervising', members: { some: { userId } } },
      },
    });
  }
  return 0;
}

export async function computeContractorScore(contractorId: string): Promise<number> {
  const violations = await prisma.violation.findMany({ where: { contractorId } });
  let penalty = 0;
  for (const v of violations) {
    if (v.severity === 'low') penalty += 1;
    else if (v.severity === 'medium') penalty += 3;
    else if (v.severity === 'high') penalty += 5;
  }
  const surveys = await prisma.postMissionSurvey.findMany({
    where: { mission: { contractorId } },
    select: { contractorRating: true },
  });
  const ratings = surveys.map((s) => s.contractorRating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const violationScore = Math.max(0, 100 - penalty);
  const ratingScore = avgRating > 0 ? avgRating * 20 : 60;
  const combined = 0.6 * violationScore + 0.4 * ratingScore;
  return Math.max(0, Math.min(100, combined));
}
