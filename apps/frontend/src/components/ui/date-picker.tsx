import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string; // ISO date string or YYYY-MM-DD format
  onChange: (date: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the value to a Date object
  const date = value ? new Date(value + 'T00:00:00') : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format as YYYY-MM-DD for input compatibility
      const formatted = format(selectedDate, "yyyy-MM-dd")
      onChange(formatted)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100]" 
        align="start"
        onInteractOutside={(e) => {
          // When clicking outside the popover, check if we're inside a dialog context
          // If so, prevent the default to stop the event from bubbling to the dialog's handler
          const target = e.target as HTMLElement;
          const dialogContent = target.closest('[data-slot="dialog-content"]');
          const dialogOverlay = target.closest('[data-slot="dialog-overlay"]');
          
          // If the click is inside a dialog context (content or overlay), prevent default
          // This stops the popover's outside interaction from triggering the dialog's handler
          if (dialogContent || dialogOverlay) {
            e.preventDefault();
          }
        }}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

