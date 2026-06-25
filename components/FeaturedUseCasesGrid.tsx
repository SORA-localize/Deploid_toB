import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { UseCaseCard } from '@/components/UseCaseCard';
import type { UseCase } from '@/data/types';

interface FeaturedUseCasesGridProps {
  useCases: UseCase[];
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
      <div className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {useCases.map((useCase) => (
          <div
            key={useCase.id}
            className="shrink-0 snap-start w-[78%] sm:w-[42%] md:w-[32%] xl:w-[26%]"
          >
            <UseCaseCard useCase={useCase} />
          </div>
        ))}
      </div>
    </section>
  );
}
