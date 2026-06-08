import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { NewExpenseForm } from './NewExpenseForm';

export default async function NewExpensePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'expense.create')) redirect('/dashboard');
  return (
    <div className="max-w-md">
      <PageHeader title="Add expense" description="Submit a receipt for approval." />
      <NewExpenseForm />
    </div>
  );
}
