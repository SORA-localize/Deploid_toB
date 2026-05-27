export const metadata = {
  title: '会社概要',
};

export default function AboutPage() {
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">About</span>
        <h1 className="page-title">ヒューマノイド導入の最初の判断材料を作る。</h1>
        <p className="lead">
          Deploidは、日本のtoB事業者がヒューマノイドロボットを検討するときに、機種名やニュースだけでなく、調達、保守、安全、用途適合、PoC設計まで見られる入口を目指します。
        </p>
        <div className="grid section">
          <div className="card">
            <span className="eyebrow">Mission</span>
            <h3>買い手目線で整理する</h3>
            <p>メーカー発表やスペック表をそのまま並べず、導入担当者が判断に使う変数へ変換します。</p>
          </div>
          <div className="card">
            <span className="eyebrow">Policy</span>
            <h3>出典と確認日を残す</h3>
            <p>公式情報、報道、推定を混ぜず、信頼度と確認日をデータとして残します。</p>
          </div>
          <div className="card">
            <span className="eyebrow">Roadmap</span>
            <h3>DBから相談導線へ</h3>
            <p>まず公開情報を構造化し、次に取材、掲載相談、導入相談へ拡張します。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
