'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ArticleRelatedSidebarProps {
  children: ReactNode;
  className?: string;
  /**
   * この要素がビューポートから外れたときにサイドバーを表示する。
   * 記事ヘッダー要素の id を渡す。
   */
  triggerId: string;
}

export function ArticleRelatedSidebar({
  children,
  className,
  triggerId,
}: ArticleRelatedSidebarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(triggerId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // ヘッダーがビューポートから出たら表示
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerId]);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      className={cn(
        'transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
