import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RobotCard } from '@/components/Cards';
import { getManufacturerForRobot, getRobots } from '@/lib/data';

export const metadata = {
  title: 'ロボット',
};

export default function RobotsPage() {
  const robots = getRobots();

  return (
    <section className="hero">
      <div className="container">
        <Breadcrumbs items={[{ label: 'ロボット' }]} />
        <span className="eyebrow">Robots</span>
        <h1 className="page-title">ロボット</h1>
        <p className="lead">スペックだけではなく、調達、国内可否、PoC適性、保守、安全の観点で整理します。</p>
        <div className="grid two section">
          {robots.map((robot) => (
            <RobotCard
              key={robot.slug}
              robot={robot}
              manufacturerName={getManufacturerForRobot(robot.manufacturerSlug)?.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
