import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import { RobotCardRail } from '@/components/RobotCardRail';
import type { Robot, Manufacturer } from '@/data/types';
import { getRobotPrimaryImage } from '@/lib/robotMedia';

interface FeaturedRobotsGridProps {
  robots: Robot[];
  manufacturerById: Record<string, Manufacturer | undefined>;
}

export function FeaturedRobotsGrid({ robots, manufacturerById }: FeaturedRobotsGridProps) {
  const leadingImageRobotId = robots.find((robot) => getRobotPrimaryImage(robot))?.id;

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
      <RobotCardRail ariaLabel="注目ロボット">
        {robots.map((robot) => {
          const manufacturer = manufacturerById[robot.manufacturerId];
          return (
            <FeaturedRobotCard
              key={robot.id}
              robot={robot}
              manufacturerName={manufacturer?.name}
              eagerImage={robot.id === leadingImageRobotId}
            />
          );
        })}
      </RobotCardRail>
    </section>
  );
}
