'use client';

import { EmptyState } from '@/components/EmptyState';
import { RobotCard } from '@/components/RobotCard';
import type { Robot, Manufacturer } from '@/data/types';

interface ManufacturerRobotsGridProps {
  robots: Robot[];
  manufacturer: Manufacturer;
}

export function ManufacturerRobotsGrid({ robots, manufacturer }: ManufacturerRobotsGridProps) {
  if (robots.length === 0) {
    return <EmptyState message="このメーカーのロボット情報は準備中です" />;
  }

  return (
    <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
