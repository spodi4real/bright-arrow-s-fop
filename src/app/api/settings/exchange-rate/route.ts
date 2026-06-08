import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, isResponse, ok, requirePermissionApi } from '@/lib/api';
import { getCurrentExchangeRate, setExchangeRate } from '@/lib/currency';

const schema = z.object({ value: z.number().positive() });

export async function GET() {
  const v = await getCurrentExchangeRate();
  return ok({ value: v });
}

export async function PUT(req: NextRequest) {
  const user = await requirePermissionApi('exchangeRate.edit');
  if (isResponse(user)) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid input');
  await setExchangeRate(parsed.data.value);
  return ok({ value: parsed.data.value });
}
