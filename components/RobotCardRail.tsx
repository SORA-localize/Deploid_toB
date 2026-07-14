import { Children, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RobotCardRailProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** FeaturedRobotCard用の配置規格。見出し・データ取得・件数判断は親に残す。 */
export function RobotCardRail({ children, className, ariaLabel }: RobotCardRailProps) {
  return (
    <div
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      className={cn(
        'flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1',
        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'sm:gap-4',
        className,
      )}
    >
      {Children.map(children, (child) => (
        <div className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-48">
          {child}
        </div>
      ))}
    </div>
  );
}
