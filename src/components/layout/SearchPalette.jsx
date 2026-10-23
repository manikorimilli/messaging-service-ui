import { useEffect } from 'react';
import { SearchIcon } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const KEY = 'rounded-md border bg-muted px-1.5 py-0.5 font-medium text-xs';
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const SEARCH_SHORTCUT = isMac ? '⌘K' : 'Ctrl K';

// Extra words each page answers to in the search box.
const KEYWORDS = {
  providers: ['gateway', 'twilio', 'vonage', 'register', 'config'],
  send: ['message', 'single', 'sms'],
  bulk: ['broadcast', 'batch', 'recipients'],
  scheduled: ['jobs', 'runs', 'history', 'cron'],
};

// Search field in the sidebar. It opens the palette; so does Cmd/Ctrl+K anywhere.
export function SearchButton({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Search pages"
      aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
      className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-background/40 px-3 text-muted-foreground text-sm outline-none transition-colors hover:border-input hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded-md border border-sidebar-border bg-muted px-1.5 py-0.5 font-medium text-xs">{SEARCH_SHORTCUT}</kbd>
    </button>
  );
}

export function SearchPalette({ open, onOpenChange, routes }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const run = (action) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search pages" className="sm:max-w-xl">
      <Command className="p-0 **:data-[slot=command-input-wrapper]:p-3 **:data-[slot=input-group]:h-12! **:data-[slot=input-group]:rounded-xl! **:data-[slot=input-group]:px-1">
        <CommandInput placeholder="Search pages..." className="text-base" />
        <CommandList className="max-h-96 scroll-py-2 px-2 pb-2">
          <CommandEmpty className="py-10 text-muted-foreground">No pages match your search.</CommandEmpty>
          <CommandGroup heading="Pages" className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pb-2">
            {routes.map(({ key, label, icon: Icon }) => (
              <CommandItem
                key={key}
                value={label}
                keywords={KEYWORDS[key]}
                onSelect={() => run(() => (window.location.hash = `#/${key}`))}
                className="h-11 gap-3 px-3"
              >
                <Icon aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-4 border-t px-4 py-3 text-muted-foreground text-xs" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <kbd className={KEY}>↑</kbd>
            <kbd className={KEY}>↓</kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className={KEY}>Enter</kbd>
            to open
          </span>
          <span className="ms-auto flex items-center gap-1.5">
            <kbd className={KEY}>Esc</kbd>
            to close
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
