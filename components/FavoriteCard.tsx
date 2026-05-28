'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { TBD_LABEL } from '@/lib/labels';

interface FavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  onRemove: (slug: string) => void;
}

export function FavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  onRemove,
}: FavoriteCardProps) {
  const payload = robot.specs.payloadKg != null ? `${robot.specs.payloadKg} kg` : TBD_LABEL;
  const runtime = robot.specs.runtimeMin != null ? `約${robot.specs.runtimeMin} 分` : TBD_LABEL;

  return (
    <div className="border border-neutral-300 bg-white p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/robots/${robot.slug}`} className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-neutral-900 truncate">
            {robot.nameJa ?? robot.name}
          </h4>
        </Link>
        <button
          onClick={() => onRemove(robot.slug)}
          className="text-neutral-400 hover:text-neutral-900 flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <ManufacturerLogoName
        name={manufacturerName ?? robot.manufacturerSlug}
        logo={manufacturerLogo}
        className="mb-2 text-xs text-neutral-500"
        frameClassName="h-4 w-4"
        imageClassName="h-3 w-3"
      />
      <dl className="space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-neutral-500">ペイロード</dt>
          <dd className="text-neutral-900 font-medium">{payload}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">稼働時間</dt>
          <dd className="text-neutral-900 font-medium">{runtime}</dd>
        </div>
      </dl>
    </div>
  );
}
