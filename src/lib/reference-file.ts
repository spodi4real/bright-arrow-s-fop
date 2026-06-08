import 'server-only';
import path from 'node:path';
import { DOMParser } from 'xmldom';
import { kml as kmlToGeoJson } from '@tmcw/togeojson';
import JSZip from 'jszip';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export type RefFileResult = {
  count: number;
  source: 'kml' | 'kmz' | 'csv' | 'xlsx';
};

export async function parseReferenceFile(filename: string, buffer: Buffer): Promise<RefFileResult> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.kml') return { count: countFromKml(buffer.toString('utf8')), source: 'kml' };
  if (ext === '.kmz') return { count: await countFromKmz(buffer), source: 'kmz' };
  if (ext === '.csv') return { count: countFromCsv(buffer.toString('utf8')), source: 'csv' };
  if (ext === '.xlsx' || ext === '.xls') return { count: await countFromXlsx(buffer), source: 'xlsx' };
  throw new Error(`Unsupported reference file type: ${ext}`);
}

function countFromKml(text: string): number {
  const parser = new DOMParser({ errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} } });
  const doc = parser.parseFromString(text, 'text/xml');
  const gj = kmlToGeoJson(doc as unknown as Document);
  return gj.features.filter((f: { geometry?: { type: string } }) => f.geometry?.type === 'Point').length;
}

async function countFromKmz(buf: Buffer): Promise<number> {
  const zip = await JSZip.loadAsync(buf);
  let count = 0;
  for (const name of Object.keys(zip.files)) {
    if (name.toLowerCase().endsWith('.kml')) {
      const text = await zip.files[name].async('string');
      count += countFromKml(text);
    }
  }
  return count;
}

function countFromCsv(text: string): number {
  const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return Array.isArray(result.data) ? result.data.length : 0;
}

async function countFromXlsx(buf: Buffer): Promise<number> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return 0;
  return Math.max(0, ws.rowCount - 1);
}
