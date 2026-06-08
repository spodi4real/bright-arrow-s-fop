import { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badRequest, created, isResponse, ok, requireApi } from '@/lib/api';
import { storageRoot } from '@/lib/storage';
import { safePathSegment } from '@/lib/utils';
import { can } from '@/lib/permissions';
import { getCurrentExchangeRate, toUsd } from '@/lib/currency';

const schema = z.object({
  name: z.string().min(1),
  note: z.string().optional().nullable(),
  amount: z.number().positive(),
  currency: z.enum(['usd', 'iqd']),
});

export async function GET(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (can(user, 'expense.viewAll')) {
    // accountant / admin: see all
  } else {
    where.submittedById = user.id;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      submittedBy: { select: { id: true, displayName: true } },
      reviewedBy: { select: { id: true, displayName: true } },
      files: true,
    },
    take: 500,
  });
  return ok({ expenses });
}

export async function POST(req: NextRequest) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  if (!can(user, 'expense.create')) {
    return badRequest('You cannot submit expenses.');
  }

  const formData = await req.formData();
  const json = {
    name: String(formData.get('name') || ''),
    note: String(formData.get('note') || '') || null,
    amount: parseFloat(String(formData.get('amount') || '0')),
    currency: String(formData.get('currency') || 'usd'),
  };
  const parsed = schema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid input', { issues: parsed.error.flatten() });

  const receipt = formData.get('receipt');
  if (!(receipt instanceof File) || receipt.size === 0) {
    return badRequest('A receipt or photo of the place/goods is required. If you don\'t have a receipt, take a quick photo where you bought from or what you bought.');
  }

  const rate = await getCurrentExchangeRate();
  const amountUsd = toUsd(parsed.data.amount, parsed.data.currency, rate);

  const expense = await prisma.expense.create({
    data: {
      submittedById: user.id,
      name: parsed.data.name,
      note: parsed.data.note,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      lockedExchangeRate: rate,
      amountUsd,
      status: 'pending',
    },
  });

  const folderRel = path.join('expenses', safePathSegment(user.username), safePathSegment(expense.id));
  const folderAbs = path.join(storageRoot(), folderRel);
  await fs.mkdir(folderAbs, { recursive: true });
  const buf = Buffer.from(await receipt.arrayBuffer());
  const ext = path.extname(receipt.name) || '.jpg';
  const filename = `receipt${ext}`;
  const dest = path.join(folderAbs, filename);
  await fs.writeFile(dest, buf);
  await prisma.fileRecord.create({
    data: {
      path: dest,
      relativePath: path.join(folderRel, filename),
      originalName: receipt.name || filename,
      mimeType: receipt.type || 'image/jpeg',
      sizeBytes: buf.length,
      category: 'expenses',
      uploadedById: user.id,
      expenseId: expense.id,
    },
  });

  // Notify accountants and admins
  const reviewers = await prisma.user.findMany({ where: { role: { in: ['accountant', 'admin'] }, active: true } });
  await prisma.notification.createMany({
    data: reviewers.map((r) => ({
      userId: r.id,
      type: 'expense_pending' as const,
      title: 'New expense submitted',
      message: `${user.displayName} submitted ${parsed.data.name}`,
      link: '/expenses',
    })),
  });

  return created({ expense });
}
