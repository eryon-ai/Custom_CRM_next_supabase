'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useUIStore } from '@/stores/ui-store';
import {
  LayoutDashboard,
  Kanban,
  MapPin,
  FileText,
  Package,
  BarChart3,
  Settings,
  Users,
  Bot,
  Search,
} from 'lucide-react';

const actions = [
  { id: 'go-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'go-pipeline', label: 'Open Pipeline', icon: Kanban, href: '/dashboard/pipeline' },
  { id: 'go-leads', label: 'View Leads', icon: Users, href: '/dashboard' },
  { id: 'go-field', label: 'Field Operations', icon: MapPin, href: '/dashboard/field-ops' },
  { id: 'go-quotations', label: 'New Quotation', icon: FileText, href: '/dashboard/quotations' },
  { id: 'go-inventory', label: 'Check Inventory', icon: Package, href: '/dashboard/inventory' },
  { id: 'go-analytics', label: 'View Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { id: 'go-reports', label: 'Export Reports', icon: BarChart3, href: '/dashboard/reports' },
  { id: 'go-settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { id: 'ai-assist', label: 'Open AI Assistant', icon: Bot, href: '' },
];

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      // Escape to close
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = useCallback(
    (id: string) => {
      setCommandPaletteOpen(false);
      if (id === 'ai-assist') {
        // Toggle AI assistant – handled by the AIAssistant component
        return;
      }
      const action = actions.find((a) => a.id === id);
      if (action?.href) {
        router.push(action.href);
      }
    },
    [router, setCommandPaletteOpen]
  );

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-xl border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Search pages, actions, or type a command..."
              className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-[11px] font-medium text-muted-foreground px-2 py-1.5">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Command.Item
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action.id)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{action.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="Quick Actions" className="text-[11px] font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                value="create-lead"
                onSelect={() => handleSelect('create-lead')}
                className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-accent"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-[10px] text-primary font-bold">+</span>
                Create New Lead
              </Command.Item>
              <Command.Item
                value="create-quote"
                onSelect={() => handleSelect('go-quotations')}
                className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-accent"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-[10px] text-primary font-bold">+</span>
                New Quotation
              </Command.Item>
            </Command.Group>

            <div className="border-t px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-4">
              <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> Open</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd> Close</span>
            </div>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
