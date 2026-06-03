'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Sun, Moon } from 'lucide-react';

const modes = [
  { value: 'system', label: 'システム設定に合わせる', icon: Monitor },
  { value: 'light', label: 'ライトモード', icon: Sun },
  { value: 'dark', label: 'ダークモード', icon: Moon },
] as const;

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // マウント前はテーマが解決できないため、レイアウトシフトを避けて同寸の
  // 無効化プレースホルダを描画する。
  if (!mounted) {
    return (
      <div
        className="inline-flex h-9 border border-border bg-card"
        aria-hidden="true"
      >
        {modes.map((mode) => (
          <span key={mode.value} className="inline-flex h-full w-9 items-center justify-center">
            <mode.icon className="h-4 w-4 text-muted-foreground" />
          </span>
        ))}
      </div>
    );
  }

  const active = theme ?? 'system';

  return (
    <div
      className="inline-flex h-9 border border-border bg-card text-muted-foreground"
      role="group"
      aria-label="テーマモード"
    >
      {modes.map((mode) => {
        const isActive = active === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={isActive}
            aria-label={mode.label}
            title={mode.label}
            onClick={() => setTheme(mode.value)}
            className={`inline-flex h-full w-9 items-center justify-center transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-foreground'
            }`}
          >
            <mode.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
