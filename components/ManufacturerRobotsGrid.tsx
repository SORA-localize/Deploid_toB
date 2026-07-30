'use client';

import { EmptyState } from '@/components/EmptyState';
import { RobotCard } from '@/components/RobotCard';
import type { RobotCatalogItem } from '@/lib/viewModels/robots';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

interface ManufacturerRobotsGridProps {
  items: RobotCatalogItem[];
}

export function ManufacturerRobotsGrid({ items }: ManufacturerRobotsGridProps) {
  if (items.length === 0) {
    return <EmptyState message="このメーカーのロボット情報は準備中です" />;
  }

  return (
    <div className={browserGridClassNames.robots}>
      {items.map((item) => (
        <RobotCard key={item.id} item={item} hideManufacturer />
      ))}
    </div>
  );
}
