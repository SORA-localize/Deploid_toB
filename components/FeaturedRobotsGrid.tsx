'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { RobotCard } from '@/components/RobotCard';
import type { Robot, Manufacturer } from '@/data/types';

interface FeaturedRobotsGridProps {
  robots: Robot[];
  manufacturerBySlug: Record<string, Manufacturer | undefined>;
}

export function FeaturedRobotsGrid({ robots, manufacturerBySlug }: FeaturedRobotsGridProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <section className="py-16 border-b border-neutral-200">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-semibold text-neutral-900">注目ロボット</h2>
        <Link
          href="/robots"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
        >
          すべて見る
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {robots.map((robot) => {
          const manufacturer = manufacturerBySlug[robot.manufacturerSlug];
          return (
            <RobotCard
              key={robot.slug}
              robot={robot}
              manufacturerName={manufacturer?.name}
              manufacturerLogo={manufacturer?.logo}
              dimmed={hoveredSlug !== null && hoveredSlug !== robot.slug}
              onHoverStart={() => setHoveredSlug(robot.slug)}
              onHoverEnd={() => setHoveredSlug(null)}
            />
          );
        })}
      </div>
    </section>
  );
}
