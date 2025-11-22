import { useState } from 'react';
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
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          'sm:max-w-lg',
          // Mobile bottom sheet style - override default positioning
          'bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0',
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'rounded-t-2xl rounded-b-none sm:rounded-lg',
          'border-b-0 sm:border-b',
          // Mobile slide animations
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95'
        )}
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
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of your expense to track your spending.
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm onSubmit={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
