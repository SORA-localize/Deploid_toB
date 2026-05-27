import Link from 'next/link';
import { getManufacturerForRobot, getRobots } from '@/lib/data';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  procurementLabels,
} from '@/lib/labels';

export const metadata = {
  title: '比較',
};

export default function ComparePage() {
  const robots = getRobots();

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">Compare</span>
        <h1 className="page-title">比較</h1>
        <p className="lead">カードを並べるだけでなく、買い手が最初に確認すべき導入判断変数を横並びで見ます。</p>
        <div className="section">
          <table className="table">
            <thead>
              <tr>
                <th>項目</th>
                {robots.map((robot) => (
                  <th key={robot.slug}>
                    <Link href={`/robots/${robot.slug}`}>{robot.nameJa ?? robot.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>メーカー</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{getManufacturerForRobot(robot.manufacturerSlug)?.name ?? robot.manufacturerSlug}</td>
                ))}
              </tr>
              <tr>
                <th>導入段階</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{deploymentStageLabels[robot.deploymentStage]}</td>
                ))}
              </tr>
              <tr>
                <th>実務ラベル</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{buyerReadinessLabels[robot.buyerReadiness]}</td>
                ))}
              </tr>
              <tr>
                <th>日本での入手性</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{japanAvailabilityLabels[robot.japanAvailability]}</td>
                ))}
              </tr>
              <tr>
                <th>調達</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{robot.procurementModels.map((model) => procurementLabels[model]).join(' / ')}</td>
                ))}
              </tr>
              <tr>
                <th>向く用途</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{robot.comparison.bestFit.join(' / ')}</td>
                ))}
              </tr>
              <tr>
                <th>主な制約</th>
                {robots.map((robot) => (
                  <td key={robot.slug}>{robot.comparison.constraints.join(' / ')}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
