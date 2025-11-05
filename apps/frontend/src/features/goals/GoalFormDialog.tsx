import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GoalForm } from './GoalForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalFormDialogProps {
  onSuccess?: (goal: any) => void;
  trigger?: React.ReactNode;
  defaultValues?: any;
  goalId?: number;
  title?: string;
  description?: string;
}

export function GoalFormDialog({
  onSuccess,
  trigger,
  defaultValues,
  goalId,
  title = 'Create New Goal',
  description = 'Set a financial goal and break it down into specific items.',
}: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (goal: any) => {
    setOpen(false);
    onSuccess?.(goal);
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
            Add Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          'sm:max-w-2xl',
          // Mobile bottom sheet style
          'bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0',
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'rounded-t-2xl rounded-b-none sm:rounded-lg',
          'border-b-0 sm:border-b',
          // Mobile slide animations
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95'
        )}
        onInteractOutside={(e) => {
          // Prevent closing the dialog when clicking inside a popover (like date picker)
          const target = e.target as HTMLElement;
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <GoalForm
          onSubmit={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          goalId={goalId}
        />
      </DialogContent>
    </Dialog>
  );
}
