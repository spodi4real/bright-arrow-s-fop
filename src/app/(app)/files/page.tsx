import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessMission } from '@/lib/missions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { FolderOpen } from 'lucide-react';
import { FilesGrid } from './FilesGrid';

export const dynamic = 'force-dynamic';

const TOP_LEVEL = ['site_surveys', 'site_maintenance', 'installations', 'violations', 'expenses', 'general'];

export default async function FilesPage({ searchParams }: { searchParams: { category?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const category = searchParams.category;

  let categories = TOP_LEVEL;
  if (user.role === 'accountant') {
    categories = ['expenses'];
  } else if (user.role === 'engineer') {
    // engineer sees scoped — filter at file level
  }

  if (!category) {
    const counts: Record<string, number> = {};
    for (const c of categories) {
      const where: Record<string, unknown> = { category: c };
      if (user.role === 'engineer' && c !== 'general' && c !== 'expenses') {
        where.OR = [
          { uploadedById: user.id },
          { mission: { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] } },
        ];
      } else if (user.role === 'engineer' && c === 'general') {
        where.uploadedById = user.id;
      } else if (user.role === 'engineer' && c === 'expenses') {
        where.expense = { submittedById: user.id };
      } else if (user.role === 'accountant') {
        // only expenses
      }
      counts[c] = await prisma.fileRecord.count({ where });
    }
    return (
      <div>
        <PageHeader title="Files" description="Browse mission, expense, and violation assets." />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link key={c} href={`/files?category=${c}`} className="block">
              <Card className="p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-2"><FolderOpen className="h-5 w-5 text-primary" /><span className="font-medium capitalize">{c.replace('_', ' ')}</span></div>
                <div className="text-sm text-muted-foreground">{counts[c]} files</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!categories.includes(category)) redirect('/files');

  const where: Record<string, unknown> = { category };
  if (user.role === 'engineer') {
    if (category === 'general') where.uploadedById = user.id;
    else if (category === 'expenses') where.expense = { submittedById: user.id };
    else where.OR = [
      { uploadedById: user.id },
      { mission: { OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }] } },
    ];
  }

  const files = await prisma.fileRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300, include: { uploadedBy: { select: { displayName: true } }, mission: { select: { name: true } } } });

  return (
    <div>
      <PageHeader
        title={`Files / ${category.replace('_', ' ')}`}
        description={`${files.length} files`}
        actions={<Link href="/files" className="text-sm text-muted-foreground hover:text-foreground">‹ All folders</Link>}
      />
      <FilesGrid files={files as any} />
    </div>
  );
}
