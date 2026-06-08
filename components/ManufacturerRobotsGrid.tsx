'use client';

import { RobotCard } from '@/components/RobotCard';
import type { Robot, Manufacturer } from '@/data/types';

interface ManufacturerRobotsGridProps {
  robots: Robot[];
  manufacturer: Manufacturer;
}

export function ManufacturerRobotsGrid({ robots, manufacturer }: ManufacturerRobotsGridProps) {
  if (robots.length === 0) {
    return (
      <div className="border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">このメーカーのロボット情報は準備中です</p>
      </div>
    );
  }

  return (
    <div className="robot-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {robots.map((robot) => (
        <RobotCard
          key={robot.slug}
          robot={robot}
          manufacturerName={manufacturer.name}
          manufacturerLogo={manufacturer.logo}
        />
      ))}
    </div>
  );
}
