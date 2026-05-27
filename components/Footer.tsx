import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>Deploid is a Japanese B2B buyer portal for humanoid robot adoption.</p>
        <p>
          <Link href="/contact">情報提供・掲載相談・導入相談はこちら</Link>
        </p>
      </div>
    </footer>
  );
}
