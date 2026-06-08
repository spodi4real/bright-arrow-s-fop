import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { forbidden, isResponse, notFound, requireApi } from '@/lib/api';
import { canAccessMission } from '@/lib/missions';
import { styleHeader, fileHyperlink, fmtDate } from '@/lib/reports';
import { InstallationReportDocument } from '@/lib/pdf/InstallationReport';
import React from 'react';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireApi();
  if (isResponse(user)) return user;
  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      contractor: true,
      members: { include: { user: true } },
      survey: true,
      gateways: { include: { registeredBy: true, files: true }, orderBy: { registeredAt: 'asc' } },
      maintMeters: { include: { registeredBy: true, files: true }, orderBy: { registeredAt: 'asc' } },
      installEntries: { include: { registeredBy: true, files: true }, orderBy: { registeredAt: 'asc' } },
      installNotes: { include: { createdBy: true, files: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!mission) return notFound();
  if (!(await canAccessMission(mission, user))) return forbidden();

  const url = new URL(req.url);
  const fmt = url.searchParams.get('format') || (mission.type === 'installation_supervising' ? 'pdf' : 'xlsx');

  if (fmt === 'pdf' || mission.type === 'installation_supervising') {
    const doc = React.createElement(InstallationReportDocument, { mission: mission as unknown as Parameters<typeof InstallationReportDocument>[0]['mission'] });
    const buffer = await renderToBuffer(doc as React.ReactElement);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${encodeURIComponent(mission.slug)}-report.pdf"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BrightArrow';
  workbook.created = new Date();
  const ws = workbook.addWorksheet('Mission report');

  ws.addRow([mission.name]);
  ws.getRow(1).font = { size: 16, bold: true, color: { argb: 'FF1A1A1A' } };
  ws.addRow([`${mission.type.replace(/_/g, ' ')} · ${mission.district} · ${mission.zoneName}`]);
  ws.addRow([]);

  if (mission.type === 'rf_site_survey') {
    const headers = [
      'Gateway ID', 'Latitude', 'Longitude', 'Korek rating', 'Asiacell rating', 'Zain rating',
      'Pole photo', 'Area video', 'Korek photo', 'Zain photo', 'Asiacell photo',
      'Registered by', 'Registered at',
    ];
    const headerRow = ws.addRow(headers);
    styleHeader(headerRow);

    for (const g of mission.gateways) {
      const polePhoto = g.files.find((f) => f.originalName.toLowerCase().includes('pole') || f.relativePath.includes('-pole'));
      const areaVideo = g.files.find((f) => f.mimeType.startsWith('video') || f.relativePath.includes('-video'));
      const korek = g.files.find((f) => f.relativePath.includes('korek_signal'));
      const zain = g.files.find((f) => f.relativePath.includes('zain_signal'));
      const asia = g.files.find((f) => f.relativePath.includes('asiacell_signal'));
      ws.addRow([
        g.gatewayId,
        g.latitude ?? '',
        g.longitude ?? '',
        g.korekRating || '',
        g.asiacellRating || '',
        g.zainRating || '',
        polePhoto ? fileHyperlink(polePhoto.path) : '',
        areaVideo ? fileHyperlink(areaVideo.path) : '',
        korek ? fileHyperlink(korek.path) : '',
        zain ? fileHyperlink(zain.path) : '',
        asia ? fileHyperlink(asia.path) : '',
        g.registeredBy.displayName,
        fmtDate(g.registeredAt),
      ]);
    }
    ws.columns.forEach((c) => (c.width = 18));
    ws.getColumn(1).width = 24;
    ws.getColumn(12).width = 22;
  } else if (mission.type === 'site_maintenance') {
    const headers = ['Meter serial', 'Location', 'Enclosure #', 'Status', 'Notes', 'Photo', 'Registered by', 'Registered at'];
    const headerRow = ws.addRow(headers);
    styleHeader(headerRow);
    for (const m of mission.maintMeters) {
      const photo = m.files[0];
      ws.addRow([
        m.serialNumber,
        m.location,
        m.enclosureNumber || 'N/A',
        m.status.replace('_', ' '),
        m.description || '',
        photo ? fileHyperlink(photo.path) : '',
        m.registeredBy.displayName,
        fmtDate(m.registeredAt),
      ]);
    }
    ws.columns.forEach((c) => (c.width = 20));
    ws.getColumn(5).width = 50;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${encodeURIComponent(mission.slug)}-report.xlsx"`,
    },
  });
}
