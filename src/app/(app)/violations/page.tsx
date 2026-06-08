import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ViolationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'violation.view') && !can(user, 'violation.create')) redirect('/dashboard');

  const violations = can(user, 'violation.view')
    ? await prisma.violation.findMany({
        orderBy: { createdAt: 'desc' },
        include: { contractor: true, submittedBy: { select: { displayName: true } } },
        take: 200,
      })
    : await prisma.violation.findMany({
        where: { submittedById: user.id },
        orderBy: { createdAt: 'desc' },
        include: { contractor: true, submittedBy: { select: { displayName: true } } },
        take: 200,
      });

  return (
    <div>
      <PageHeader
        title="Violations"
        description="Field issues with contractors."
        actions={can(user, 'violation.create') ? <Button asChild><Link href="/violations/new">Report violation</Link></Button> : undefined}
      />
      {violations.length === 0 ? (
        <Card className="p-12 text-center"><AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No violations reported.</p></Card>
      ) : (
        <div className="space-y-2">
          {violations.map((v) => (
            <Card key={v.id}><CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{v.title}</span>
                  <Badge variant={v.severity === 'high' ? 'danger' : v.severity === 'medium' ? 'warning' : 'muted'}>{v.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{v.contractor.displayName}</span>
                  <span className="capitalize">{v.district}</span>
                  <span>{v.place}</span>
                  <span>{v.submittedBy.displayName}</span>
                  <span>{format(new Date(v.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
