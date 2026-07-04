'use client';

import { EmptyState } from '@/components/EmptyState';
import { RobotCard } from '@/components/RobotCard';
import type { Robot, Manufacturer } from '@/data/types';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

interface ManufacturerRobotsGridProps {
  robots: Robot[];
  manufacturer: Manufacturer;
}

export function ManufacturerRobotsGrid({ robots, manufacturer }: ManufacturerRobotsGridProps) {
  if (robots.length === 0) {
    return <EmptyState message="このメーカーのロボット情報は準備中です" />;
  }

  return (
    <div className={browserGridClassNames.robots}>
      {robots.map((robot) => (
        <RobotCard
          key={robot.id}
          robot={robot}
          manufacturerName={manufacturer.name}
          manufacturerLogo={manufacturer.logo}
        />
      ))}
    </div>
  );
}
