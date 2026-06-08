import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { NewViolationForm } from './NewViolationForm';

export default async function NewViolationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'violation.create')) redirect('/dashboard');
  return (
    <div className="max-w-2xl">
      <PageHeader title="Report violation" description="Document a contractor issue with proof." />
      <NewViolationForm />
    </div>
  );
}
