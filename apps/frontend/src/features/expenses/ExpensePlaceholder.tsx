export function ExpensePlaceholder() {
  return (
    <div
      className="h-[52px] border-2 border-dashed border-muted-foreground/30 bg-muted/20 rounded-lg opacity-60 transition-all duration-200"
      role="status"
      aria-label="Drop zone for expense"
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground/50">
          Drop here
        </div>
      </div>
    </div>
  );
}





