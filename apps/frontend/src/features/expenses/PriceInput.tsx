import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export function PriceInput({
  value,
  onChange,
  error,
  disabled,
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toFixed(2));
      }
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      onChange(undefined);
      return;
    }

    // Remove non-numeric characters except decimal point
    const numericValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const cleanedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : numericValue;

    setDisplayValue(cleanedValue);

    // Parse and update the actual value
    const parsed = parseFloat(cleanedValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else if (cleanedValue === '') {
      onChange(undefined);
    }
  };

  const handleQuickAmount = (amount: number) => {
    onChange(amount);
    setDisplayValue(amount.toFixed(2));
  };

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-3">
      {/* Large Display */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
        </div>
        <Input
          type="text"
          inputMode="decimal"
          value={isFocused ? displayValue : formatDisplayValue(displayValue)}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            // Focus selects all text for easy replacement
            setTimeout(() => {
              const input = document.activeElement as HTMLInputElement;
              if (input) input.select();
            }, 0);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="0.00"
          className={cn(
            'h-16 text-2xl font-bold pl-12 pr-4',
            'focus:ring-2 focus:ring-primary focus:border-primary',
            error && 'border-destructive focus:ring-destructive',
            'transition-all duration-200'
          )}
          disabled={disabled}
          aria-label="Expense amount"
          aria-invalid={!!error}
          aria-describedby={error ? 'price-error' : undefined}
        />
        {value !== undefined && value > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            <span className="font-medium">${value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</span>
          </div>
        )}
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={value === amount ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickAmount(amount)}
            disabled={disabled}
            className={cn(
              'flex-1 min-w-[60px]',
              value === amount && 'ring-2 ring-primary ring-offset-2'
            )}
            aria-label={`Quick add $${amount}`}
          >
            ${amount}
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p id="price-error" className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="text-xs text-muted-foreground">
          Enter the amount or tap a quick amount button
        </p>
      )}
    </div>
  );
}





