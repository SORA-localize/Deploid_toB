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
      <div className="grid auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {useCases.map((useCase) => (
          <UseCaseCard key={useCase.id} useCase={useCase} />
        ))}
      </div>
    </section>
  );
}
