'use client';

import { Children, type ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-lg bg-muted"
                layoutId="report-card-hover-background"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 h-full">{child}</div>
        </div>
      ))}
    </div>
  );
}
