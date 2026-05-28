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
    variant === 'muted' ? 'bg-neutral-50 text-neutral-500' : 'bg-white text-neutral-600';
  const sizeClassName = size === 'large' ? 'p-16' : 'p-8';

  return (
    <div className={`border border-neutral-300 text-center text-sm ${variantClassName} ${sizeClassName} ${className}`}>
      {message}
    </div>
  );
}
