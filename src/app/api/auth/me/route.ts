import { getCurrentUser } from '@/lib/auth';
import { ok, unauthorized } from '@/lib/api';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
  });
}
