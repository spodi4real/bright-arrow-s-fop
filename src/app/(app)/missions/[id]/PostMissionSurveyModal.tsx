'use client';
import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  missionId: string;
  showContractorRating: boolean;
};

export function PostMissionSurveyModal({ open, onClose, missionId, showContractorRating }: Props) {
  const [missionRating, setMissionRating] = useState<number | null>(null);
  const [contractorRating, setContractorRating] = useState<number | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [problemsEncountered, setProblemsEncountered] = useState('');
  const [personalProblems, setPersonalProblems] = useState('');
  const [recurringIssues, setRecurringIssues] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function submit(skip = false) {
    setBusy(true);
    const body = skip ? {} : {
      missionRating,
      contractorRating: showContractorRating ? contractorRating : null,
      generalNotes,
      problemsEncountered,
      personalProblems,
      recurringIssues,
      suggestions,
    };
    const r = await fetch(`/api/missions/${missionId}/survey`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (r.ok) {
      if (!skip) toast({ title: 'Thanks for the feedback', variant: 'success' });
      onClose();
    } else {
      toast({ title: 'Could not save survey', variant: 'danger' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mission complete</DialogTitle>
          <DialogDescription>Optional feedback to help improve future missions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RatingField label="How was the mission?" value={missionRating} onChange={setMissionRating} />
          {showContractorRating && <RatingField label="Contractor rating" value={contractorRating} onChange={setContractorRating} />}
          <FieldText label="General notes" value={generalNotes} onChange={setGeneralNotes} />
          <FieldText label="Problems encountered" value={problemsEncountered} onChange={setProblemsEncountered} />
          <FieldText label="Personal problems (private — admin only)" value={personalProblems} onChange={setPersonalProblems} />
          <FieldText label="Recurring issues" value={recurringIssues} onChange={setRecurringIssues} />
          <FieldText label="Suggestions for next time" value={suggestions} onChange={setSuggestions} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => submit(true)} disabled={busy}>Skip</Button>
          <Button onClick={() => submit(false)} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RatingField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className={cn('p-1.5 rounded hover:bg-muted', value !== null && n <= value ? 'text-warning' : 'text-muted-foreground')}>
            <Star className={cn('h-5 w-5', value !== null && n <= value && 'fill-current')} />
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />
    </div>
  );
}
