import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { styleHeader } from '@/lib/reports';
import { computeBonusForUser } from '@/lib/bonus';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ['engineer', 'iskra', 'supervisor'] } },
    select: { id: true, displayName: true, role: true },
    orderBy: { displayName: 'asc' },
  });
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('KPI');
  const h = ws.addRow(['User', 'Role', 'Total score', 'Target hit %', 'Productivity', 'Quality', 'Reliability', 'Initiative', 'Collaboration', 'Violation reports']);
  styleHeader(h);
  for (const u of users) {
    const b = await computeBonusForUser(u.id, start, end);
    ws.addRow([u.displayName, u.role, b.totalScore.toFixed(1), b.targetHitPct.toFixed(1), b.productivity.toFixed(1), b.quality.toFixed(1), b.reliability.toFixed(1), b.initiative.toFixed(1), b.collaboration.toFixed(1), b.violationReports.toFixed(1)]);
  }
  ws.columns.forEach((c) => (c.width = 16));
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="kpi.xlsx"' },
  });
}
