import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Briefcase, AlertTriangle, Wallet, Trophy, Calendar, Building2, FileSpreadsheet } from 'lucide-react';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'reports.admin')) redirect('/dashboard');

  const reports = [
    { title: 'Missions export', desc: 'Filter by type, district, contractor, date range. Excel.', href: '/api/reports/missions?format=xlsx', icon: Briefcase },
    { title: 'Violations export', desc: 'All violations with proof links.', href: '/api/reports/violations?format=xlsx', icon: AlertTriangle },
    { title: 'Expenses export', desc: 'All expenses by user, with totals.', href: '/api/reports/expenses?format=xlsx', icon: Wallet },
    { title: 'KPI report', desc: 'Per-user bonus and KPI summary.', href: '/api/reports/kpi?format=xlsx', icon: Trophy },
    { title: 'Agenda report', desc: 'Missions, events, holidays.', href: '/api/reports/agenda?format=xlsx', icon: Calendar },
    { title: 'Contractor performance', desc: 'Score, violations, ratings per contractor.', href: '/api/reports/contractors?format=xlsx', icon: Building2 },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Admin-only exports of operational data." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1"><Icon className="h-4 w-4 text-primary" /><span className="font-medium">{r.title}</span></div>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <Button asChild variant="outline" size="sm"><a href={r.href} target="_blank" rel="noreferrer"><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</a></Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
