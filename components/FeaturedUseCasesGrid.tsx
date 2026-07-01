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
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {useCases.map((useCase) => (
          <div key={useCase.id} className="w-[220px] shrink-0">
            <UseCaseCard useCase={useCase} />
          </div>
        ))}
      </div>
    </section>
  );
}
