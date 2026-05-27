import { ManufacturerCard } from '@/components/Cards';
import { getManufacturers } from '@/lib/data';

export const metadata = {
  title: 'メーカー',
};

export default function ManufacturersPage() {
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">Manufacturers</span>
        <h1 className="page-title">メーカー</h1>
        <p className="lead">会社紹介ではなく、日本での供給、代理店、PoC、保守体制を確認するためのページです。</p>
        <div className="grid two section">
          {getManufacturers().map((manufacturer) => (
            <ManufacturerCard key={manufacturer.slug} manufacturer={manufacturer} />
          ))}
        </div>
      </div>
    </section>
  );
}
