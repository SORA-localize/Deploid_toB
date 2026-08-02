'use client';

import { Children, type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface CardHoverEffectProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}

export function CardHoverEffect({
  children,
  className,
  itemClassName,
}: CardHoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, index) => (
        <div
          key={index}
          className={cn('relative block h-full p-2', itemClassName)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* 常時mountしてopacityだけ切り替える。display:none だと transition が効かない。
              旧実装は layoutId でハイライトがcard間をスライドしていたが、CSSでは別要素間の
              位置遷移を表現できないため、card毎のcross-fadeになる。 */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 block h-full w-full rounded-lg bg-muted',
              'transition-opacity duration-150 ease-out motion-reduce:transition-none',
              hoveredIndex === index ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div className="relative z-10 h-full">{child}</div>
        </div>
      ))}
    </div>
  );
}
