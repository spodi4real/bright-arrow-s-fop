'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Play, Pause, StopCircle, RotateCw, FileSpreadsheet, FileText, ChevronLeft, MapPin, Calendar, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { GatewayRegistration } from './GatewayRegistration';
import { MaintenanceRegistration } from './MaintenanceRegistration';
import { InstallationRegistration } from './InstallationRegistration';
import { ReferenceFileUpload } from './ReferenceFileUpload';
import { PostMissionSurveyModal } from './PostMissionSurveyModal';
import type { MissionStatus, MissionType } from '@prisma/client';
import { format } from 'date-fns';

type Mission = {
  id: string;
  name: string;
  type: MissionType;
  status: MissionStatus;
  district: string;
  zoneName: string;
  slug: string;
  scheduledStartAt: Date | string;
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  expectedGatewayCount: number | null;
  referenceFile: { id: string; originalName: string } | null;
  contractor: { displayName: string } | null;
  createdBy: { id: string; displayName: string; username: string };
  members: { user: { id: string; displayName: string; username: string; role: string } }[];
  invitations: { id: string; user: { id: string; displayName: string; username: string } }[];
  survey: unknown | null;
  _count: { gateways: number; maintMeters: number; installEntries: number; installNotes: number };
};

type Props = {
  mission: Mission;
  currentUser: { id: string; role: string; displayName: string };
  hasPendingInvite: boolean;
  isMember: boolean;
};

export function MissionDetail({ mission, currentUser, hasPendingInvite, isMember }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  async function lifecycle(action: 'start' | 'end_day' | 'resume' | 'end_mission') {
    setBusy(true);
    try {
      const r = await fetch(`/api/missions/${mission.id}/lifecycle`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast({ title: 'Action failed', description: data.error, variant: 'danger' });
      } else {
        if (action === 'end_mission') setShowSurvey(true);
        else router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function respondInvite(action: 'accept' | 'decline') {
    setBusy(true);
    const r = await fetch(`/api/missions/${mission.id}/invitations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (r.ok) {
      router.refresh();
      toast({ title: action === 'accept' ? 'Invitation accepted' : 'Invitation declined', variant: 'success' });
    } else {
      toast({ title: 'Failed to update invitation', variant: 'danger' });
    }
  }

  const itemCount =
    mission.type === 'rf_site_survey'
      ? mission._count.gateways
      : mission.type === 'site_maintenance'
      ? mission._count.maintMeters
      : mission._count.installEntries + mission._count.installNotes;

  const exportHref =
    mission.type === 'installation_supervising'
      ? `/api/missions/${mission.id}/report?format=pdf`
      : `/api/missions/${mission.id}/report?format=xlsx`;

  return (
    <div>
      <Link href="/missions" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-2"><ChevronLeft className="h-4 w-4" /> All missions</Link>
      <PageHeader
        title={mission.name}
        description={`${mission.type.replace(/_/g, ' ')} · ${mission.zoneName}, ${mission.district}`}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={mission.status === 'active' ? 'success' : mission.status === 'completed' ? 'muted' : mission.status === 'paused' ? 'warning' : 'primary'}>
              {mission.status}
            </Badge>
            {mission.status === 'planned' && isMember && (
              <Button onClick={() => lifecycle('start')} disabled={busy} size="sm"><Play className="h-3.5 w-3.5" /> Start Mission</Button>
            )}
            {mission.status === 'active' && isMember && (
              <>
                <Button onClick={() => lifecycle('end_day')} disabled={busy} size="sm" variant="outline"><Pause className="h-3.5 w-3.5" /> End Day</Button>
                <Button onClick={() => lifecycle('end_mission')} disabled={busy} size="sm" variant="destructive"><StopCircle className="h-3.5 w-3.5" /> End Mission</Button>
              </>
            )}
            {mission.status === 'paused' && isMember && (
              <Button onClick={() => lifecycle('resume')} disabled={busy} size="sm"><RotateCw className="h-3.5 w-3.5" /> Resume</Button>
            )}
            <Button asChild size="sm" variant="outline">
              <a href={exportHref} target="_blank" rel="noreferrer">
                {mission.type === 'installation_supervising' ? <FileText className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Export
              </a>
            </Button>
          </div>
        }
      />

      {hasPendingInvite && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <span className="text-sm">You've been invited to this mission.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => respondInvite('decline')} disabled={busy}>Decline</Button>
              <Button size="sm" onClick={() => respondInvite('accept')} disabled={busy}>Accept</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="h-3.5 w-3.5" />Scheduled start</div>
          <div className="text-sm font-medium">{format(new Date(mission.scheduledStartAt), 'PPpp')}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><MapPin className="h-3.5 w-3.5" />Location</div>
          <div className="text-sm font-medium capitalize">{mission.district} · {mission.zoneName}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Users className="h-3.5 w-3.5" />Team</div>
          <div className="text-sm font-medium">{mission.members.length} members{mission.invitations.length > 0 && ` · ${mission.invitations.length} invited`}</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {mission.type === 'rf_site_survey' && (
            <>
              <ReferenceFileUpload mission={mission} />
              <GatewayRegistration mission={mission} />
            </>
          )}
          {mission.type === 'site_maintenance' && <MaintenanceRegistration mission={mission} />}
          {mission.type === 'installation_supervising' && <InstallationRegistration mission={mission} />}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-1">{itemCount}{mission.expectedGatewayCount ? <span className="text-muted-foreground text-base"> / {mission.expectedGatewayCount}</span> : null}</div>
              <div className="text-xs text-muted-foreground">
                {mission.type === 'rf_site_survey' ? 'gateways registered' : mission.type === 'site_maintenance' ? 'meters registered' : 'entries registered'}
              </div>
              {mission.expectedGatewayCount && (
                <div className="mt-3 h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (itemCount / mission.expectedGatewayCount) * 100)}%` }} />
                </div>
              )}
            </CardContent>
          </Card>

          {mission.contractor && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Contractor</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{mission.contractor.displayName}</span></div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Members</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mission.members.map((m) => (
                <div key={m.user.id} className="flex items-center justify-between text-sm">
                  <span>{m.user.displayName}</span>
                  <Badge variant="muted" className="capitalize">{m.user.role}</Badge>
                </div>
              ))}
              {mission.invitations.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">Invited (pending)</div>
                  {mission.invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{inv.user.displayName}</span>
                      <Badge variant="warning">invited</Badge>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PostMissionSurveyModal
        open={showSurvey}
        onClose={() => { setShowSurvey(false); router.refresh(); }}
        missionId={mission.id}
        showContractorRating={mission.type !== 'rf_site_survey'}
      />
    </div>
  );
}
