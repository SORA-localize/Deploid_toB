import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Manufacturer, Robot } from '@/data/types';
import { getComparisonCoreRows } from '@/lib/robotDisplay';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';

interface CompareSummaryTableProps {
  robots: readonly Robot[];
  manufacturers: readonly Manufacturer[];
}

export function CompareSummaryTable({ robots, manufacturers }: CompareSummaryTableProps) {
  const manufacturerById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]),
  );

  if (robots.length === 0) {
    return null;
  }

  return (
    <section className="site-container py-6" aria-labelledby="compare-summary-heading">
      <Breadcrumbs items={[{ label: uiText.compare.breadcrumb }]} />

      <div className="mb-4 max-w-3xl">
        <h1 id="compare-summary-heading" className="text-2xl font-semibold text-foreground">
          {uiText.compare.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          候補ロボットを、価格公開状況、日本での入手性、導入段階、可搬重量、稼働時間などの導入判断変数で確認できます。
        </p>
      </div>

      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[920px] text-xs">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-3 font-medium">ロボット</th>
              <th className="px-3 py-3 font-medium">メーカー</th>
              <th className="px-3 py-3 font-medium">用途</th>
              <th className="px-3 py-3 font-medium">{uiText.compare.price}</th>
              <th className="px-3 py-3 font-medium">{uiText.comparison.japanSupport}</th>
              <th className="px-3 py-3 font-medium">{uiText.compare.deploymentStage}</th>
              <th className="px-3 py-3 font-medium">可搬重量</th>
              <th className="px-3 py-3 font-medium">稼働時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {robots.map((robot) => {
              const manufacturer = manufacturerById.get(robot.manufacturerId);
              const coreRows = new Map(
                getComparisonCoreRows(robot).map((row) => [row.label, row.value]),
              );
              const primaryUse = robot.industryTags?.[0]
                ? getTagLabel(robot.industryTags[0], 'industry')
                : '要確認';

              return (
                <tr key={robot.id}>
                  <td className="px-3 py-3 font-medium text-foreground">
                    <Link href={`/robots/${robot.slug}`} className="underline-offset-2 hover:underline">
                      {robot.nameJa ?? robot.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-foreground/80">
                    {manufacturer ? (
                      <Link
                        href={`/manufacturers/${manufacturer.slug}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {manufacturer.nameJa ?? manufacturer.name}
                      </Link>
                    ) : (
                      robot.manufacturerId
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{primaryUse}</td>
                  <td className="px-3 py-3 text-muted-foreground">{coreRows.get(uiText.compare.price)}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {coreRows.get(uiText.comparison.japanSupport)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {coreRows.get(uiText.compare.deploymentStage)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{coreRows.get('可搬重量')}</td>
                  <td className="px-3 py-3 text-muted-foreground">{coreRows.get('稼働時間')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
