import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { isResponse, requirePermissionApi } from '@/lib/api';
import { fmtDate, styleHeader, fileHyperlink } from '@/lib/reports';

export async function GET() {
  const user = await requirePermissionApi('reports.admin');
  if (isResponse(user)) return user;
  const expenses = await prisma.expense.findMany({
    include: {
      submittedBy: { select: { displayName: true } },
      reviewedBy: { select: { displayName: true } },
      files: true,
    },
    orderBy: [{ submittedById: 'asc' }, { createdAt: 'desc' }],
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Expenses');
  const h = ws.addRow(['User', 'Name', 'Note', 'Amount', 'Currency', 'Amount USD', 'Locked rate', 'Status', 'Reason', 'Submitted', 'Reviewed by', 'Reviewed at', 'Receipt']);
  styleHeader(h);
  for (const e of expenses) {
    ws.addRow([
      e.submittedBy.displayName, e.name, e.note || '', e.amount, e.currency.toUpperCase(), e.amountUsd, e.lockedExchangeRate,
      e.status, e.denialReason || '', fmtDate(e.createdAt), e.reviewedBy?.displayName || '', fmtDate(e.reviewedAt),
      e.files[0] ? fileHyperlink(e.files[0].path) : '',
    ]);
  }
  ws.columns.forEach((c) => (c.width = 16));
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 40;
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="expenses.xlsx"' },
  });
}
