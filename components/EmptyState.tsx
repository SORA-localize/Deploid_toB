interface EmptyStateProps {
  message: string;
  variant?: 'white' | 'muted';
  size?: 'default' | 'large';
  className?: string;
}

export function EmptyState({
  message,
  variant = 'white',
  size = 'default',
  className = '',
}: EmptyStateProps) {
  const variantClassName =
    variant === 'muted' ? 'bg-muted text-muted-foreground' : 'bg-card text-muted-foreground';
  const sizeClassName = size === 'large' ? 'p-16' : 'p-8';

  return (
    <div className={`border border-border text-center text-sm ${variantClassName} ${sizeClassName} ${className}`}>
      {message}
    </div>
  );
}
