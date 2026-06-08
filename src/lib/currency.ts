import 'server-only';
import { prisma } from './prisma';

const RATE_KEY = 'iqd_per_usd';

export async function getCurrentExchangeRate(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: RATE_KEY } });
  if (row) return Number(row.value);
  const fallback = Number(process.env.DEFAULT_EXCHANGE_RATE || 1500);
  await prisma.setting.upsert({
    where: { key: RATE_KEY },
    create: { key: RATE_KEY, value: String(fallback) },
    update: {},
  });
  return fallback;
}

export async function setExchangeRate(value: number): Promise<void> {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid exchange rate');
  await prisma.setting.upsert({
    where: { key: RATE_KEY },
    create: { key: RATE_KEY, value: String(value) },
    update: { value: String(value) },
  });
}

export function toUsd(amount: number, currency: 'usd' | 'iqd', lockedRate: number): number {
  if (currency === 'usd') return amount;
  return amount / lockedRate;
}
