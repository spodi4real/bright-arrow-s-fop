import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { styleHeader } from '@/lib/reports';
import { computeContractorScore } from '@/lib/bonus';

export async function GET() {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const contractors = await prisma.contractor.findMany({
    include: { _count: { select: { violations: true, missions: true } } },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Contractors');
  styleHeader(ws.addRow(['Contractor', 'Score', 'Violations', 'Missions']));
  for (const c of contractors) {
    const score = await computeContractorScore(c.id);
    ws.addRow([c.displayName, score.toFixed(1), c._count.violations, c._count.missions]);
  }
  ws.columns.forEach((c) => (c.width = 18));
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="contractors.xlsx"' },
  });
}
