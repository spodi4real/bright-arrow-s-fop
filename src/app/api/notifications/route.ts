import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isResponse, ok, requireApi } from '@/lib/api';

export async function GET(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const unread = url.searchParams.get('unread') === 'true';

  if (unread) {
    const count = await prisma.notification.count({ where: { userId: user.id, read: false } });
    return ok({ count });
  }
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return ok({ notifications });
}

export async function POST(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => ({}));
  if (body.action === 'mark_all_read') {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  }
  return ok({ ok: true });
}
