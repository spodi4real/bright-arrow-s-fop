import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { styleHeader, fmtDate } from '@/lib/reports';

export async function GET(req: NextRequest) {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const district = url.searchParams.get('district');
  const status = url.searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (district) where.district = district;
  if (status) where.status = status;

  const missions = await prisma.mission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { displayName: true } },
      contractor: { select: { displayName: true } },
      _count: { select: { members: true, gateways: true, maintMeters: true, installEntries: true, installNotes: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Missions');
  const header = ws.addRow([
    'Mission', 'Type', 'Status', 'District', 'Zone', 'Contractor',
    'Created by', 'Members', 'Scheduled', 'Started', 'Ended',
    'Gateways', 'Maint meters', 'Install meters', 'Install notes',
  ]);
  styleHeader(header);
  for (const m of missions) {
    ws.addRow([
      m.name, m.type.replace(/_/g, ' '), m.status, m.district, m.zoneName,
      m.contractor?.displayName || '',
      m.createdBy.displayName, m._count.members,
      fmtDate(m.scheduledStartAt), fmtDate(m.startedAt), fmtDate(m.endedAt),
      m._count.gateways, m._count.maintMeters, m._count.installEntries, m._count.installNotes,
    ]);
  }
  ws.columns.forEach((c) => (c.width = 16));
  ws.getColumn(1).width = 28;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="missions.xlsx"',
    },
  });
}
