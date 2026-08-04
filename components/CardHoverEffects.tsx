// RobotCard / ManufacturerCard / UseCaseCard 共通のホバー演出（シマー sweep + 下部 accent line）。
// 以前は各カードが個別に同じ2要素を持っていた。JS依存のポインタ追従グロー/チルト
// （lib/useTiltCardEffect.ts）は現在 FeaturedRobotCard のみが使い、この3カードは
// JS依存を外すため CSS の group-hover だけで動く静的な演出に統一している。
// 親要素に `group` クラスが必要（`group-hover:` で駆動するため）。props は無い。
export function CardHoverEffects() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%] motion-reduce:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full motion-reduce:transition-none"
      />
    </>
  );
}
