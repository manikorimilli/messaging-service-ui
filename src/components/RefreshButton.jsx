import { useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Refresh button whose icon spins: at least one full turn per click, and for as
// long as `loading` is true. It stops only at the end of a turn, so the icon
// never snaps back mid-rotation.
export function RefreshButton({ onClick, loading, className }) {
  const [spinning, setSpinning] = useState(false);
  // A load started elsewhere (auto-refresh) also spins the icon.
  if (loading && !spinning) setSpinning(true);

  return (
    <Button
      variant="outline"
      size="lg"
      className={cn('group rounded-full bg-background/60', className)}
      onClick={() => {
        setSpinning(true);
        onClick();
      }}
      disabled={loading}
      aria-busy={loading || undefined}
    >
      <RefreshCwIcon
        aria-hidden="true"
        className={cn(
          'transition-transform duration-300 ease-out group-hover:rotate-45 motion-reduce:transition-none',
          spinning && 'animate-spin',
        )}
        onAnimationIteration={() => {
          if (!loading) setSpinning(false);
        }}
      />
      Refresh
    </Button>
  );
}
