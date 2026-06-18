import type { Metadata } from 'next';

export const defaultSiteTitle = 'Deploid | ヒューマノイド導入判断ポータル';
export const defaultSiteDescription =
  '日本のtoB事業者向けに、ヒューマノイドロボット、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。';
export const defaultSocialDescription =
  '日本のtoB事業者向けに、ヒューマノイドロボットの導入判断に必要な変数を整理する情報基盤。';

const defaultOgImage = '/opengraph-image';

function socialTitle(title: string) {
  return title.includes('Deploid') ? title : `${title} | Deploid`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}): Metadata {
  const resolvedDescription = description ?? defaultSiteDescription;
  const resolvedSocialTitle = socialTitle(title);
  const resolvedImage = image || defaultOgImage;
  const metadataTitle = title.includes('Deploid') ? { absolute: title } : title;

  return {
    title: metadataTitle,
    description: resolvedDescription,
    alternates: path ? { canonical: path } : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      title: resolvedSocialTitle,
      description: resolvedDescription,
      url: path,
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: resolvedSocialTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedSocialTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  };
}
