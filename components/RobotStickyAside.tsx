import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { Robot } from '@/data/types';
import type { Manufacturer } from '@/data/types';
import { getSpecRows } from '@/lib/robotDisplay';
import { deploymentStageLabels, japanAvailabilityLabels } from '@/lib/labels';

interface RobotStickyAsideProps {
  robot: Robot;
  manufacturer?: Manufacturer;
}

export function RobotStickyAside({ robot, manufacturer }: RobotStickyAsideProps) {
  // 項目の選抜はサイドバーの編集判断、ラベル・整形は specSchema 準拠
  const quickSpecs = getSpecRows(robot.specs, [
    'heightCm',
    'weightKg',
    'payloadKg',
    'runtimeMin',
    'mobility',
  ]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-site-header-gap space-y-5">

        {/* 基本スペック */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            基本スペック
          </p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border">
              {quickSpecs.map((row) => (
                <tr key={row.label}>
                  <td className="py-2 text-muted-foreground">{row.label}</td>
                  <td className="py-2 text-foreground font-medium text-right">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border" />

        {/* 導入段階 + 入手性 */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              導入段階
            </p>
            <p className="text-sm font-medium text-foreground">
              {deploymentStageLabels[robot.deploymentStage]}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              日本での入手性
            </p>
            <p className="text-sm font-medium text-foreground">
              {japanAvailabilityLabels[robot.japanAvailability]}
            </p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* CTA */}
        <div className="space-y-2">
          {manufacturer?.website && (
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 w-full text-xs py-2.5 border border-border hover:border-foreground/40 transition-colors text-foreground/80 hover:text-foreground"
            >
              メーカーサイトへ
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Link
            href="/compare"
            className="flex items-center justify-center w-full text-xs py-2.5 border border-border hover:border-foreground/40 transition-colors text-foreground/80 hover:text-foreground"
          >
            比較ページで確認
          </Link>
        </div>

      </div>
    </aside>
  );
}
