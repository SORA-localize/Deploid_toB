import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const robots = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/robots' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      maker: z.string(),
      makerCountry: z.string(),
      hero: image().optional(),
      heightCm: z.number().optional(),
      weightKg: z.number().optional(),
      payloadKg: z.number().optional(),
      dof: z.number().optional(),
      mobility: z.enum(['二足', '車輪', 'ハイブリッド']).optional(),
      runtimeMin: z.number().optional(),
      procurement: z.array(z.enum(['買い切り', 'リース', 'RaaS', 'サブスク'])),
      priceNote: z.string().optional(),
      domesticAvailability: z.enum(['国内代理店あり', '並行輸入のみ', '国内不可']),
      distributorJP: z.string().optional(),
      deploymentStatus: z.enum(['構想段階', 'PoC事例あり', '本番運用あり']),
      safetyNote: z.string().optional(),
      vendorRiskNote: z.string().optional(),
      industries: z.array(reference('industries')).optional(),
      sources: z.array(z.string().url()).optional(),
      updated: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    stage: z.enum(['know', 'decide', 'act']),
    order: z.number(),
    updated: z.coerce.date(),
    relatedRobots: z.array(reference('robots')).optional(),
    draft: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(['interview', 'handson', 'report', 'news', 'case']),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      heroImage: image().optional(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      relatedRobots: z.array(reference('robots')).optional(),
      sources: z.array(z.string().url()).optional(),
      draft: z.boolean().default(false),
    }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/industries' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    painPoints: z.array(z.string()).default([]),
  }),
});

export const collections = { robots, guides, posts, industries };
