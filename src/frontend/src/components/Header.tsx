import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Header() {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdminUser } = useIsAdmin();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Display effective role: Admin if backend recognizes as admin, otherwise profile role
  const displayRole = isAdminUser ? 'Admin' : (userProfile?.role || 'Staff');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/neighbors-light-logo-transparent.dim_200x200.png"
            alt="Neighbors Light"
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">Neighbors Light</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Internal Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 px-2 sm:px-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {userProfile ? getInitials(userProfile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {userProfile?.name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{displayRole}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
