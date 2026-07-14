import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { FactList } from '@/components/FactList';
import type { Robot } from '@/data/types';
import type { Manufacturer } from '@/data/types';
import { SidebarBlock, SidebarDivider, SidebarSection } from '@/components/SidebarSection';
import { getRobotBasicFacts } from '@/lib/robotCatalog';
import { deploymentStageLabels, japanAvailabilityLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';

interface RobotStickyAsideProps {
  robot: Robot;
  manufacturer?: Manufacturer;
}

export function RobotStickyAside({ robot, manufacturer }: RobotStickyAsideProps) {
  const quickSpecs = getRobotBasicFacts(robot);

  return (
    <aside className="hidden lg:block">
      <SidebarSection>
        <SidebarBlock kicker={uiText.robots.basicSpecs}>
          <FactList
            variant="compact"
            rows={quickSpecs.map((row) => ({ key: row.key, label: row.label, value: row.value }))}
          />
        </SidebarBlock>

        <SidebarDivider />

        {/* 導入段階 + 入手性 */}
        <div className="space-y-4">
          <SidebarBlock kicker={uiText.robots.deploymentStage} kickerClassName="mb-1">
            <p className="text-sm font-medium text-foreground">
              {deploymentStageLabels[robot.deploymentStage]}
            </p>
          </SidebarBlock>
          <SidebarBlock kicker={uiText.robots.japanAvailability} kickerClassName="mb-1">
            <p className="text-sm font-medium text-foreground">
              {japanAvailabilityLabels[robot.japanAvailability]}
            </p>
          </SidebarBlock>
        </div>

        <SidebarDivider />

        {/* CTA */}
        <div className="space-y-2">
          {manufacturer?.website && (
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full text-xs py-2.5 border border-border hover:border-foreground/40 transition-colors text-foreground/80 hover:text-foreground"
            >
              {uiText.robots.toManufacturerSite}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Link
            href="/compare"
            className="flex items-center justify-center w-full text-xs py-2.5 border border-border hover:border-foreground/40 transition-colors text-foreground/80 hover:text-foreground"
          >
            {uiText.robots.checkOnComparePage}
          </Link>
        </div>
      </SidebarSection>
    </aside>
  );
}
