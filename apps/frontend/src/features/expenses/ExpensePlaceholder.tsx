export function ExpensePlaceholder() {
  return (
    <div
      className="bg-card border-2 border-dashed border-primary/60 rounded-lg px-3 py-2.5 mb-1.5 transition-all duration-200 opacity-90"
      role="status"
      aria-label="Drop zone for expense"
      style={{
        backgroundColor: 'hsl(var(--primary) / 0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 border-2 border-dashed border-primary/40 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-primary/20 rounded mb-1.5 animate-pulse" />
          <div className="h-3 w-20 bg-primary/10 rounded animate-pulse" />
        </div>
        <div className="h-4 w-16 bg-primary/20 rounded shrink-0 animate-pulse" />
      </div>
    </div>
  );
}





