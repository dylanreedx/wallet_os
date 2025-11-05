import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { expenses } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
}

const MAX_LENGTH = 500;

export function DescriptionInput({
  value,
  onChange,
  error,
  disabled,
  maxLength = MAX_LENGTH,
}: DescriptionInputProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch expense history for autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user?.id || !value.trim() || value.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const allExpenses = await expenses.getAll(user.id);
        const descriptions = Array.isArray(allExpenses)
          ? allExpenses
              .map((exp: any) => exp.description)
              .filter((desc: string) => desc && desc.toLowerCase().includes(value.toLowerCase()))
              .filter((desc: string, index: number, arr: string[]) => arr.indexOf(desc) === index) // unique
              .slice(0, 5) // top 5 matches
          : [];
        
        setSuggestions(descriptions);
        setShowSuggestions(descriptions.length > 0 && value.length > 0);
      } catch (err) {
        console.error('Failed to fetch expense suggestions:', err);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, user?.id]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleEmojiClick = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const commonEmojis = ['💰', '🍔', '🚗', '🛒', '🎬', '🏥', '✈️', '📚', '💊', '☕', '🍕', '🎮'];

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="What did you spend on?"
          rows={3}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            'pr-20',
            error && 'border-destructive focus:ring-destructive',
            'transition-all duration-200'
          )}
          aria-label="Expense description"
          aria-invalid={!!error}
          aria-describedby={error ? 'description-error' : undefined}
        />
        
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            'absolute right-2 top-2 p-1.5 rounded-md',
            'hover:bg-muted transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            showEmojiPicker && 'bg-muted'
          )}
          aria-label="Add emoji"
          disabled={disabled}
        >
          <Smile className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors',
                'first:rounded-t-md last:rounded-b-md',
                'focus:outline-none focus:bg-muted'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-2">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md',
                  'hover:bg-muted transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
                aria-label={`Add ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character Counter & Error */}
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <p id="description-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <p
          className={cn(
            'text-xs',
            isNearLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {remainingChars} characters remaining
        </p>
      </div>
    </div>
  );
}





