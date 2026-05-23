'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Users,
  MapPin,
  FileText,
  BarChart3,
  Package,
  Settings,
  ChevronLeft,
  LogOut,
  Bot,
  Bell,
  Search,
  Menu,
  Gem,
  ListTodo,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban, href: '/dashboard/pipeline' },
  { id: 'marble-catalog', label: 'Marble Catalog', icon: Gem, href: '/dashboard/marble-catalog' },
  { id: 'field-ops', label: 'Field Operations', icon: MapPin, href: '/dashboard/field-ops' },
  { id: 'quotations', label: 'Quotations', icon: FileText, href: '/dashboard/quotations' },
  { id: 'inventory', label: 'Inventory', icon: Package, href: '/dashboard/inventory' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { id: 'reports', label: 'Reports', icon: ListTodo, href: '/dashboard/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed, setSidebarCollapsed, isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { user, clearUser } = useAuthStore();

  const activeTab = pathname.split('/')[2] ?? 'dashboard';
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.push('/login');
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold capitalize">{activeTab.replace(/-/g, ' ')}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCommandPaletteOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-all duration-300',
            isSidebarCollapsed ? 'w-16' : 'w-64',
            'hidden lg:flex'
          )}
        >
          {/* Logo */}
          <div className={cn('flex h-14 items-center border-b border-sidebar-border px-4', isSidebarCollapsed && 'justify-center')}>
            {isSidebarCollapsed ? (
              <span className="text-lg font-bold text-sidebar-primary">M</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-sidebar-primary">Marble Mart</span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  CRM
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                          isSidebarCollapsed && 'justify-center px-2'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isSidebarCollapsed && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          {/* AI Assistant Quick Button */}
          <div className="px-2 py-2 border-t border-sidebar-border">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isSidebarCollapsed ? 'icon' : 'default'}
                  className={cn('w-full justify-start gap-3 text-sidebar-foreground', isSidebarCollapsed && 'justify-center')}
                >
                  <Bot className="h-5 w-5 shrink-0 text-primary" />
                  {!isSidebarCollapsed && <span>AI Assistant</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">AI Assistant</TooltipContent>}
            </Tooltip>
          </div>

          {/* Theme Toggle */}
          <div className="px-2 py-1 border-t border-sidebar-border">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isSidebarCollapsed ? 'icon' : 'default'}
                  className={cn('w-full justify-start gap-3 text-sidebar-foreground', isSidebarCollapsed && 'justify-center')}
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 shrink-0" />
                  ) : (
                    <Moon className="h-5 w-5 shrink-0" />
                  )}
                  {!isSidebarCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">{isDark ? 'Light Mode' : 'Dark Mode'}</TooltipContent>}
            </Tooltip>
          </div>

          {/* User Area */}
          <div className="border-t border-sidebar-border p-3">
            <div className={cn('flex items-center gap-3', isSidebarCollapsed && 'justify-center')}>
              {user && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </>
              )}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          >
            <ChevronLeft className={cn('h-3 w-3 transition-transform', isSidebarCollapsed && 'rotate-180')} />
          </Button>
        </aside>

        {/* Mobile sidebar overlay */}
        {!isSidebarCollapsed && (
          <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarCollapsed(true)} />
        )}

        {/* Main content */}
        <main className={cn('transition-all duration-300', 'lg:pl-64', isSidebarCollapsed && 'lg:pl-16')}>
          <div className="flex-1">{children}</div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </TooltipProvider>
  );
}
