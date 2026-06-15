import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import type { Robot, Manufacturer } from '@/data/types';

interface FeaturedRobotsGridProps {
  robots: Robot[];
  manufacturerById: Record<string, Manufacturer | undefined>;
}

export function FeaturedRobotsGrid({ robots, manufacturerById }: FeaturedRobotsGridProps) {
  return (
    <section className="py-8 sm:py-12 border-b border-border">
      <div className="flex items-end justify-between mb-5">
        <h2 className="text-2xl font-semibold text-foreground">注目ロボット</h2>
        <Link
          href="/robots"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          すべて見る
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {robots.map((robot) => {
          const manufacturer = manufacturerById[robot.manufacturerId];
          return (
            <div key={robot.id} className="shrink-0 snap-start w-[44%] sm:w-[30%] md:w-[22%] xl:w-[18%]">
              <FeaturedRobotCard
                robot={robot}
                manufacturerName={manufacturer?.name}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
