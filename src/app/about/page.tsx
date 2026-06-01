import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: '会社概要',
  description:
    'Deploidは、日本のtoB事業者がヒューマノイド導入を判断するための入口メディア。買い手目線の体系化と出典主義で、導入判断に必要な変数を整理します。',
};

const values = [
  {
    label: 'ミッション',
    title: '導入判断の最初の入口をつくる',
    body: '機種名やニュースではなく、調達・保守・安全・用途適合・PoC設計まで、買い手が判断に使う変数で整理します。',
  },
  {
    label: '課題',
    title: '既存情報は買い手目線で体系化されていない',
    body: 'メーカー発表やスペック表は揃っても、「うちに要るか・国内で導入できるか・何から始めるか」に答える構造が不足しています。',
  },
  {
    label: '方針',
    title: '出典と確認日を残す',
    body: '公式情報・報道・推定を混ぜず、信頼度（reliability）と確認日をデータとして残します。AIの推測値を事実として扱いません。',
  },
];

const roadmap = [
  { step: '01', title: '公開情報の構造化', body: 'ロボット・メーカー・用途・ガイド・記事を導入判断軸で整理。' },
  { step: '02', title: '用途からの逆引き', body: '業種ではなく作業・タスク起点で成立条件と候補を探せるように。' },
  { step: '03', title: '一次取材・ハンズオン', body: '代理店デモや実機検証など、後発の一次情報で深さを出す。' },
  { step: '04', title: '相談・選定支援', body: 'PoC設計や選定支援など、実務側の導線へ拡張。' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-12">
      <Breadcrumbs items={[{ label: '会社概要' }]} />

      <section className="py-12 border-b border-neutral-200">
        <p className="text-xs text-neutral-500 mb-4">Deploidについて</p>
        <h1 className="text-3xl font-semibold text-neutral-900 mb-4 max-w-3xl leading-tight">
          ヒューマノイド導入の、最初の判断材料をつくる。
        </h1>
        <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
          Deploidは、日本のtoB事業者がヒューマノイドロボットを検討するときに、機種名やニュースだけでなく、調達・保守・安全・用途適合・PoC設計まで見られる入口を目指す情報メディアです。
        </p>
      </section>

      <section className="py-12 border-b border-neutral-200">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.label} className="border border-neutral-200 bg-white p-6">
              <p className="text-xs text-neutral-500 mb-3">{v.label}</p>
              <h3 className="font-semibold text-neutral-900 mb-2">{v.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 border-b border-neutral-200">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">ロードマップ</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roadmap.map((r) => (
            <div key={r.step} className="flex gap-4 border border-neutral-200 bg-white p-5">
              <div className="flex-shrink-0 w-12 h-12 border-2 border-neutral-900 flex items-center justify-center">
                <span className="text-xs font-semibold text-neutral-900">{r.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">{r.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="border border-neutral-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">運営とお問い合わせ</h2>
          <p className="text-neutral-600 mb-6 max-w-3xl leading-relaxed">
            現在は少人数で運営しています。掲載相談、情報提供・修正、取材相談、導入相談を受け付けています。
            特定メーカーの販売促進を目的とせず、導入判断に必要な客観的な情報の整理を優先します。
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors text-sm"
          >
            お問い合わせ
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
