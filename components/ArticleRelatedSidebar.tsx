'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useSharedActiveSection } from '@/lib/activeSectionContext';
import { cn } from '@/lib/utils';

interface ArticleRelatedSidebarProps {
  children: ReactNode;
  className?: string;
  enabled?: boolean;
  revealId: string;
  sectionIds: readonly string[];
}

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

function useDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export function ArticleRelatedSidebar({
  children,
  className,
  enabled = true,
  revealId,
  sectionIds,
}: ArticleRelatedSidebarProps) {
  const isDesktop = useDesktopLayout();
  const shouldTrackActiveSection = enabled && isDesktop && sectionIds.includes(revealId);
  const activeId = useSharedActiveSection(sectionIds, { enabled: shouldTrackActiveSection });
  const visible = !enabled || (isDesktop && activeId === revealId);

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
