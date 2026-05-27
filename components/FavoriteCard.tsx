'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { Robot } from '@/data/types';

const TBD = '要確認';

interface FavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  onRemove: (slug: string) => void;
}

export function FavoriteCard({ robot, manufacturerName, onRemove }: FavoriteCardProps) {
  const payload = robot.specs.payloadKg != null ? `${robot.specs.payloadKg} kg` : TBD;
  const runtime = robot.specs.runtimeMin != null ? `約${robot.specs.runtimeMin} 分` : TBD;

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
      <p className="text-xs text-neutral-500 mb-2">{manufacturerName ?? robot.manufacturerSlug}</p>
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
