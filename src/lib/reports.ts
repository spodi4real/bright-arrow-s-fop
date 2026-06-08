import 'server-only';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export const BRAND_BLUE = 'FF349FDE';

export function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
    };
  });
  row.height = 24;
}

export function fileHyperlink(absPath: string, label = 'View') {
  return { text: label, hyperlink: `file:///${absPath.replace(/\\/g, '/')}` } as ExcelJS.CellHyperlinkValue;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return format(new Date(d), 'yyyy-MM-dd HH:mm');
}
