import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart } from 'lucide-react';
import RequestAccessForm from '../components/RequestAccessForm';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [showRequestForm, setShowRequestForm] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in';

  if (showRequestForm) {
    return <RequestAccessForm onBack={() => setShowRequestForm(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/neighbors-light-logo-transparent.dim_200x200.png"
            alt="Neighbors Light"
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Neighbors Light
          </h1>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl sm:text-3xl">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Secure access to your internal operations dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full py-6 text-base font-semibold"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Login with Internet Identity'
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure, passwordless authentication powered by Internet Identity
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              onClick={() => setShowRequestForm(true)}
              variant="outline"
              className="w-full"
            >
              Request Access
            </Button>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                About Neighbors Light
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                A mobile-first operations platform for nonprofit organizations to manage referrals,
                client intakes, and bed tracking across shelters and facilities.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-200 px-4 py-6 text-center dark:border-gray-800">
        <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          © 2025. Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
