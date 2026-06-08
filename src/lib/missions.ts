import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from './prisma';
import { storageRoot } from './storage';
import { slugify, safePathSegment } from './utils';
import type { Mission, MissionType, User, Role } from '@prisma/client';

export function categoryForMissionType(type: MissionType): string {
  if (type === 'rf_site_survey') return 'site_surveys';
  if (type === 'site_maintenance') return 'site_maintenance';
  if (type === 'installation_supervising') return 'installations';
  return 'general';
}

export function missionFolderRelative(type: MissionType, slug: string, missionId: string): string {
  const folderName = `${slug}_${missionId}`;
  return path.join(categoryForMissionType(type), safePathSegment(folderName));
}

export function missionFolderAbsolute(type: MissionType, slug: string, missionId: string): string {
  return path.join(storageRoot(), missionFolderRelative(type, slug, missionId));
}

export async function ensureMissionFolders(type: MissionType, slug: string, missionId: string) {
  const base = missionFolderAbsolute(type, slug, missionId);
  await fs.mkdir(base, { recursive: true });
  if (type === 'installation_supervising') {
    await fs.mkdir(path.join(base, 'meters'), { recursive: true });
    await fs.mkdir(path.join(base, 'notes'), { recursive: true });
  }
  return base;
}

export async function isMissionMemberOrCreator(missionId: string, userId: string): Promise<boolean> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { createdById: true, members: { where: { userId }, select: { id: true } } },
  });
  if (!mission) return false;
  if (mission.createdById === userId) return true;
  return mission.members.length > 0;
}

export async function canAccessMission(mission: Pick<Mission, 'id' | 'createdById'>, user: Pick<User, 'id' | 'role'>): Promise<boolean> {
  if (user.role === 'accountant') return false;
  if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'iskra') return true;
  if (mission.createdById === user.id) return true;
  const m = await prisma.missionMember.findFirst({
    where: { missionId: mission.id, userId: user.id },
    select: { id: true },
  });
  return !!m;
}

export function missionWhereForUser(user: { id: string; role: Role }) {
  if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'iskra') return {};
  if (user.role === 'accountant') return { id: '___never___' };
  return {
    OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }],
  };
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'mission';
  let candidate = base;
  let n = 1;
  while (await prisma.mission.findFirst({ where: { slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function logMissionEvent(missionId: string, event: string, userId?: string, details?: Record<string, unknown>) {
  await prisma.missionLog.create({
    data: {
      missionId,
      userId: userId || null,
      event,
      details: (details as object) || undefined,
    },
  });
}
