// Phase 1（クリーンスレート）：再現UIを撤去した素のスタブ。
// Phase 3 で Figma の Home を逐語コピーして復元する。
export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Deploid</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ヒューマノイド導入判断ポータル（Phase 3 で Home を復元）
      </p>
    </main>
  );
}
