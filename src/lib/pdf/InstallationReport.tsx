import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const COLORS = {
  bright: '#686064',
  arrow: '#349fde',
  fg: '#1A1A1A',
  muted: '#686064',
  border: '#E8E5E0',
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: COLORS.fg, fontFamily: 'Helvetica' },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  brandLight: { color: COLORS.bright, fontWeight: 300, fontSize: 22 },
  brandBold: { color: COLORS.arrow, fontWeight: 700, fontSize: 22 },
  reportTitle: { fontSize: 16, fontWeight: 700, marginTop: 18, marginBottom: 4 },
  reportSubtitle: { color: COLORS.muted, fontSize: 10, marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: COLORS.muted },
  table: { borderTopWidth: 1, borderTopColor: COLORS.border },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 4 },
  trHead: { backgroundColor: COLORS.arrow },
  th: { color: '#fff', fontWeight: 700, padding: 4 },
  td: { padding: 4 },
  noteBlock: { marginBottom: 10, padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 4 },
  noteMeta: { color: COLORS.muted, fontSize: 9, marginBottom: 4 },
  thumb: { width: 80, height: 60, marginTop: 6, objectFit: 'cover' },
  footer: { position: 'absolute', bottom: 18, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', color: COLORS.muted, fontSize: 8 },
});

type MissionForReport = {
  id: string;
  name: string;
  type: string;
  district: string;
  zoneName: string;
  contractor: { displayName: string } | null;
  scheduledStartAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  members: { user: { displayName: string } }[];
  installEntries: { id: string; serialNumber: string; observation: string | null; registeredAt: Date; registeredBy: { displayName: string }; files: { path: string; mimeType: string }[] }[];
  installNotes: { id: string; noteText: string; createdAt: Date; createdBy: { displayName: string }; files: { path: string; mimeType: string }[] }[];
  survey: {
    missionRating: number | null;
    contractorRating: number | null;
    generalNotes: string | null;
    problemsEncountered: string | null;
    recurringIssues: string | null;
    suggestions: string | null;
  } | null;
};

export function InstallationReportDocument({ mission }: { mission: MissionForReport }) {
  const memberNames = mission.members.map((m) => m.user.displayName).join(', ');

  // Group notes by day
  const notesByDay = new Map<string, typeof mission.installNotes>();
  for (const n of mission.installNotes) {
    const day = format(new Date(n.createdAt), 'yyyy-MM-dd');
    if (!notesByDay.has(day)) notesByDay.set(day, []);
    notesByDay.get(day)!.push(n);
  }
  const days = Array.from(notesByDay.keys()).sort();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLight}>Bright</Text>
          <Text style={styles.brandBold}>Arrow</Text>
        </View>
        <Text style={styles.reportTitle}>Installation Supervising Report</Text>
        <Text style={styles.reportSubtitle}>{mission.name}</Text>

        <View style={styles.row}><Text style={styles.label}>District / Zone</Text><Text>{mission.district} · {mission.zoneName}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Contractor</Text><Text>{mission.contractor?.displayName || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Scheduled</Text><Text>{format(new Date(mission.scheduledStartAt), 'PPP p')}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Started</Text><Text>{mission.startedAt ? format(new Date(mission.startedAt), 'PPP p') : '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Ended</Text><Text>{mission.endedAt ? format(new Date(mission.endedAt), 'PPP p') : '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Members</Text><Text>{memberNames}</Text></View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.row}><Text style={styles.label}>Meters checked</Text><Text>{mission.installEntries.length}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Notes recorded</Text><Text>{mission.installNotes.length}</Text></View>

        <Text style={styles.sectionTitle}>Notes</Text>
        {days.length === 0 && <Text style={{ color: COLORS.muted }}>No notes recorded.</Text>}
        {days.map((day) => (
          <View key={day} wrap={false}>
            <Text style={{ fontWeight: 700, marginTop: 6 }}>{format(new Date(day), 'EEEE, MMM d, yyyy')}</Text>
            {notesByDay.get(day)!.map((n) => (
              <View key={n.id} style={styles.noteBlock} wrap={false}>
                <Text style={styles.noteMeta}>{n.createdBy.displayName} · {format(new Date(n.createdAt), 'p')}</Text>
                <Text>{n.noteText}</Text>
                {n.files.length > 0 && n.files[0].mimeType.startsWith('image') && (
                  <Image src={n.files[0].path.replace(/\\/g, '/')} style={styles.thumb} />
                )}
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Meters checked</Text>
        {mission.installEntries.length === 0 ? (
          <Text style={{ color: COLORS.muted }}>No meters recorded.</Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHead]}>
              <Text style={[styles.th, { flex: 2 }]}>Serial</Text>
              <Text style={[styles.th, { flex: 4 }]}>Observation</Text>
              <Text style={[styles.th, { flex: 2 }]}>By</Text>
              <Text style={[styles.th, { flex: 2 }]}>At</Text>
            </View>
            {mission.installEntries.map((m) => (
              <View key={m.id} style={styles.tr} wrap={false}>
                <Text style={[styles.td, { flex: 2 }]}>{m.serialNumber}</Text>
                <Text style={[styles.td, { flex: 4 }]}>{m.observation || '—'}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{m.registeredBy.displayName}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{format(new Date(m.registeredAt), 'MMM d HH:mm')}</Text>
              </View>
            ))}
          </View>
        )}

        {mission.survey && (
          <>
            <Text style={styles.sectionTitle}>End-of-mission summary</Text>
            {mission.survey.missionRating && <View style={styles.row}><Text style={styles.label}>Mission rating</Text><Text>{mission.survey.missionRating} / 5</Text></View>}
            {mission.survey.contractorRating && <View style={styles.row}><Text style={styles.label}>Contractor rating</Text><Text>{mission.survey.contractorRating} / 5</Text></View>}
            {mission.survey.generalNotes && <View><Text style={styles.label}>General notes</Text><Text>{mission.survey.generalNotes}</Text></View>}
            {mission.survey.problemsEncountered && <View><Text style={styles.label}>Problems</Text><Text>{mission.survey.problemsEncountered}</Text></View>}
            {mission.survey.recurringIssues && <View><Text style={styles.label}>Recurring issues</Text><Text>{mission.survey.recurringIssues}</Text></View>}
            {mission.survey.suggestions && <View><Text style={styles.label}>Suggestions</Text><Text>{mission.survey.suggestions}</Text></View>}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Generated {format(new Date(), 'PPpp')}</Text>
          <Text>BrightArrow</Text>
        </View>
      </Page>
    </Document>
  );
}
