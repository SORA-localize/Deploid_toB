interface PageListHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export function PageListHeader({ title, description, className = 'mb-5' }: PageListHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{description}</p>
    </div>
  );
}
