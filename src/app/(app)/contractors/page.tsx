import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeContractorScore } from '@/lib/bonus';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!['admin', 'supervisor'].includes(user.role)) redirect('/dashboard');

  const contractors = await prisma.contractor.findMany({
    include: {
      _count: { select: { violations: true, missions: true } },
    },
    orderBy: { displayName: 'asc' },
  });
  const withScores = await Promise.all(contractors.map(async (c) => ({ ...c, score: await computeContractorScore(c.id) })));

  return (
    <div>
      <PageHeader title="Contractors" description="Performance score based on violations and ratings." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {withScores.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{c.displayName}</span>
              </div>
              <div className="text-4xl font-semibold mb-3">
                {c.score.toFixed(0)}
                <span className="text-base text-muted-foreground font-normal"> / 100</span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant="muted">{c.score >= 80 ? 'Strong' : c.score >= 60 ? 'Fair' : 'Needs review'}</Badge>
                <span>{c._count.violations} violations</span>
                <span>·</span>
                <span>{c._count.missions} missions</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
