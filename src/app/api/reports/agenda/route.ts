import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { fmtDate, styleHeader } from '@/lib/reports';

export async function GET() {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const [missions, events, holidays] = await Promise.all([
    prisma.mission.findMany({ orderBy: { scheduledStartAt: 'asc' }, include: { createdBy: { select: { displayName: true } } } }),
    prisma.agendaEvent.findMany({ orderBy: { startAt: 'asc' }, include: { createdBy: { select: { displayName: true } } } }),
    prisma.holiday.findMany({ orderBy: { startDate: 'asc' } }),
  ]);
  const wb = new ExcelJS.Workbook();
  const wsM = wb.addWorksheet('Missions');
  styleHeader(wsM.addRow(['Mission', 'Type', 'District', 'Zone', 'Status', 'Scheduled', 'Started', 'Ended', 'By']));
  for (const m of missions) wsM.addRow([m.name, m.type, m.district, m.zoneName, m.status, fmtDate(m.scheduledStartAt), fmtDate(m.startedAt), fmtDate(m.endedAt), m.createdBy.displayName]);
  wsM.columns.forEach((c) => (c.width = 16));

  const wsE = wb.addWorksheet('Events');
  styleHeader(wsE.addRow(['Title', 'Start', 'End', 'Location', 'By']));
  for (const e of events) wsE.addRow([e.title, fmtDate(e.startAt), fmtDate(e.endAt), e.location || '', e.createdBy.displayName]);
  wsE.columns.forEach((c) => (c.width = 18));

  const wsH = wb.addWorksheet('Holidays');
  styleHeader(wsH.addRow(['Name', 'Start', 'End']));
  for (const h of holidays) wsH.addRow([h.name, fmtDate(h.startDate), fmtDate(h.endDate)]);
  wsH.columns.forEach((c) => (c.width = 20));

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="agenda.xlsx"' },
  });
}
