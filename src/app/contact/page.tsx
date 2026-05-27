export const metadata = {
  title: 'お問い合わせ',
};

export default function ContactPage() {
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">Contact</span>
        <h1 className="page-title">情報提供・掲載相談・導入相談</h1>
        <p className="lead">
          ロボット情報の修正、メーカー/代理店の掲載相談、取材相談、導入検討に関する相談を受け付けます。
        </p>
        <div className="grid section">
          <div className="card">
            <span className="eyebrow">Data</span>
            <h3>情報提供・修正</h3>
            <p>価格、代理店、サポート、導入状況などの更新情報があれば共有してください。</p>
          </div>
          <div className="card">
            <span className="eyebrow">Listing</span>
            <h3>掲載相談</h3>
            <p>メーカー、代理店、SIer、関連サービスの掲載相談はこちら。</p>
          </div>
          <div className="card">
            <span className="eyebrow">Adoption</span>
            <h3>導入相談</h3>
            <p>どの用途から検討すべきか、PoC前に何を整理すべきかを相談できます。</p>
          </div>
        </div>
        <a className="button" href="mailto:hello@example.com">
          メールで連絡する
        </a>
      </div>
    </section>
  );
}
