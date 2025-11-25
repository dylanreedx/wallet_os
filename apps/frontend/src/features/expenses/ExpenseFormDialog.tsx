import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseFormDialogProps {
  onSuccess?: (expense: any) => void;
  trigger?: React.ReactNode;
}

export function ExpenseFormDialog({
  onSuccess,
  trigger,
}: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle visualViewport API for keyboard awareness
  useEffect(() => {
    if (!isMobile || !open) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewportHeight);
        window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
      };
    } else {
      window.addEventListener('resize', updateViewportHeight);
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
      };
    }
  }, [isMobile, open]);

  // Auto-scroll focused input into view
  useEffect(() => {
    if (!isMobile || !open) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && dialogContentRef.current?.contains(target)) {
        // Small delay to ensure keyboard has appeared
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isMobile, open]);

  const handleSuccess = (expense: any) => {
    setOpen(false);
    onSuccess?.(expense);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        ref={dialogContentRef}
        className={cn(
          'overflow-y-auto',
          'sm:max-w-lg',
          // Mobile bottom sheet style - override default positioning with !important
          '!bottom-0 !left-0 !right-0 !top-auto !translate-y-0 !translate-x-0',
          'sm:!bottom-auto sm:!left-[50%] sm:!right-auto sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%]',
          'rounded-t-2xl rounded-b-none sm:rounded-lg',
          'border-b-0 sm:border-b',
          // Mobile slide animations
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'p-3 sm:p-6 pb-6 sm:pb-6', // Tighter padding on mobile
          'max-h-[90vh] sm:max-h-[85vh]', // Ensure max height for scrolling
          'transition-[max-height] duration-150 ease-out' // Smooth height transition
        )}
        style={{
          maxHeight: isMobile && viewportHeight
            ? `${viewportHeight - 20}px`
            : undefined, // Let CSS handle desktop/default mobile
          width: isMobile ? '100%' : undefined,
          maxWidth: isMobile ? '100%' : undefined,
        }}
        onInteractOutside={(e: any) => {
          // Prevent closing the dialog when clicking inside a popover (like date picker)
          const target = e.target as HTMLElement;
          // Check both the target and the event's composed path for popover content
          const composedPath = e.composedPath() as HTMLElement[];
          const isInsidePopover =
            target.closest('[data-slot="popover-content"]') ||
            composedPath.some(
              (el) =>
                el?.hasAttribute?.('data-slot') &&
                el.getAttribute('data-slot') === 'popover-content'
            );

          if (isInsidePopover) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className={cn(isMobile && 'pb-2')}>
          <DialogTitle className={cn(isMobile && 'text-base')}>Add New Expense</DialogTitle>
          {!isMobile && (
            <DialogDescription className="text-xs">
              Enter the details of your expense to track your spending.
            </DialogDescription>
          )}
        </DialogHeader>
        <ExpenseForm onSubmit={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
