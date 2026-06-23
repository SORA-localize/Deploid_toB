import type { ReactNode } from 'react';

interface SidebarSectionProps {
  /** robots/use-cases は常時sticky、guides（12colグリッド）は lg からのみ */
  sticky?: 'always' | 'lg';
  children: ReactNode;
}

// RobotStickyAside / use-cases[slug] / guides[slug] の右サイドバーで共通の
// 「sticky + 区切り線で並ぶブロック群」の外枠。<aside>か<div>か、hidden有無は
// 各ページのグリッド構造に依存するため、ここでは内側のラッパーのみを担う。
export function SidebarSection({ sticky = 'always', children }: SidebarSectionProps) {
  const stickyClass = sticky === 'lg' ? 'lg:sticky' : 'sticky';
  return <div className={`${stickyClass} top-site-header-gap space-y-5`}>{children}</div>;
}

interface SidebarBlockProps {
  kicker: ReactNode;
  /** 見出し下マージン（既存実装は mb-1 / mb-2 / mb-3 が混在） */
  kickerClassName?: string;
  children: ReactNode;
}

export function SidebarBlock({ kicker, kickerClassName = 'mb-3', children }: SidebarBlockProps) {
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-widest text-muted-foreground ${kickerClassName}`}>
        {kicker}
      </p>
      {children}
    </div>
  );
}

export function SidebarDivider() {
  return <div className="border-t border-border" />;
}
