import { LoginForm } from './LoginForm';
import { Wordmark } from '@/components/brand/Wordmark';

export const metadata = {
  title: 'Sign in · BrightArrow',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8">
        <Wordmark size="xl" />
      </div>
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <h1 className="text-base font-semibold mb-1">Sign in</h1>
        <p className="text-xs text-muted-foreground mb-6">Use your BrightArrow username and password.</p>
        <LoginForm />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-6">
        Field operations platform
      </p>
    </div>
  );
}
