import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { UseCase } from '@/data/types';
import { uiText } from '@/lib/uiText';

interface FeaturedUseCasesGridProps {
  useCases: UseCase[];
}

function FeaturedUseCaseCard({ useCase }: { useCase: UseCase }) {
  const title = useCase.titleJa ?? useCase.title;
  const description = useCase.subtitle ?? useCase.summary;

  return (
    <Link
      href={`/use-cases/${useCase.slug}`}
      className="group flex h-full min-h-[172px] flex-col border border-border bg-card p-4 transition-colors hover:border-ring focus-visible:border-ring focus-visible:outline-none sm:min-h-[184px]"
      aria-label={`${title}の詳細を見る`}
    >
      <div>
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
        <span>{uiText.useCases.candidateRobots(useCase.candidateRobots.length)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          {uiText.useCases.detail}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function FeaturedUseCasesGrid({ useCases }: FeaturedUseCasesGridProps) {
  return (
    <section className="py-8 sm:py-12 border-b border-border">
      <div className="flex items-end justify-between mb-5">
        <h2 className="text-2xl font-semibold text-foreground">用途から探す</h2>
        <Link
          href="/use-cases"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          すべて見る
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {useCases.map((useCase) => (
          <FeaturedUseCaseCard key={useCase.id} useCase={useCase} />
        ))}
      </div>
    </section>
  );
}
