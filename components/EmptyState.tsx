import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  variant?: 'white' | 'muted';
  size?: 'default' | 'large';
  className?: string;
  icon?: ReactNode;
  description?: string;
}

export function EmptyState({
  message,
  variant = 'white',
  size = 'default',
  className = '',
  icon,
  description,
}: EmptyStateProps) {
  const variantClassName =
    variant === 'muted' ? 'bg-muted text-muted-foreground' : 'bg-card text-muted-foreground';
  const sizeClassName = size === 'large' ? 'p-16' : 'p-8';

  return (
    <div className={`border border-border text-center text-sm ${variantClassName} ${sizeClassName} ${className}`}>
      {icon && <div className="mb-3 flex justify-center text-muted-foreground/50">{icon}</div>}
      <p>{message}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>}
    </div>
  );
}
