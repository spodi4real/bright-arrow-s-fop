import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { fileHyperlink, fmtDate, styleHeader } from '@/lib/reports';

export async function GET() {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const violations = await prisma.violation.findMany({
    include: { contractor: true, submittedBy: { select: { displayName: true } }, files: true },
    orderBy: { createdAt: 'desc' },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Violations');
  const h = ws.addRow(['Title', 'Description', 'Contractor', 'District', 'Place', 'Severity', 'Submitted by', 'Created at', 'Proof files']);
  styleHeader(h);
  for (const v of violations) {
    ws.addRow([
      v.title, v.description, v.contractor.displayName, v.district, v.place, v.severity, v.submittedBy.displayName, fmtDate(v.createdAt),
      v.files.length > 0 ? fileHyperlink(v.files[0].path, `${v.files.length} files`) : '',
    ]);
  }
  ws.columns.forEach((c) => (c.width = 16));
  ws.getColumn(2).width = 50;
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="violations.xlsx"' },
  });
}
