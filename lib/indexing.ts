export function isSeoIndexable(item: { seo?: { noindex?: boolean } }) {
  return !item.seo?.noindex;
}

export function shouldIndexRobot(item: { publishStatus: string; seo?: { noindex?: boolean } }) {
  return item.publishStatus === 'published' && isSeoIndexable(item);
}

export function shouldIndexArticle(item: {
  publishStatus: string;
  contentKind?: string;
  seo?: { noindex?: boolean };
}) {
  return item.publishStatus === 'published' && item.contentKind !== 'sample' && isSeoIndexable(item);
}

export function shouldIndexPublishedRecord(item: { publishStatus: string; seo?: { noindex?: boolean } }) {
  return item.publishStatus === 'published' && isSeoIndexable(item);
}
