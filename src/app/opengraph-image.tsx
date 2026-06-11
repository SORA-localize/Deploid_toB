import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Deploid — Humanoid Robot Buyer Portal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ogColors = {
  background: '#ffffff',
  foreground: '#1c2024',
  mark: '#1c2024',
} as const;

// Next.js が build 時に都度生成する OGP 画像。
// 日本語フォントを edge runtime で同梱するのは重いので、ここでは英語表記中心。
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background: ogColors.background,
          color: ogColors.foreground,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, opacity: 0.55 }}>HUMANOID ROBOT BUYER PORTAL</div>
        <div style={{ fontSize: 128, fontWeight: 700, letterSpacing: -4, marginTop: 24 }}>Deploid</div>
        <div style={{ fontSize: 36, marginTop: 24, opacity: 0.85, maxWidth: 900, lineHeight: 1.3 }}>
          A B2B portal for humanoid robot procurement decisions in Japan.
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 16, height: 16, background: ogColors.mark }} />
          <div style={{ fontSize: 20, opacity: 0.7 }}>deploid</div>
        </div>
      </div>
    ),
    size,
  );
}
