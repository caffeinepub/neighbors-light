import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-6">
      <div className="mx-auto max-w-7xl text-center">
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
      </div>
    </footer>
  );
}
