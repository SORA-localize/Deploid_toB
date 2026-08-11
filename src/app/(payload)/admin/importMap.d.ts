import type { ImportMap } from 'payload';

/**
 * `importMap.js` は `payload generate:importmap` が生成する plain JS ファイル。
 * このリポジトリは `tsconfig.json` で `allowJs: false` を維持しているため（意図的、他の .js
 * 正本を誤って import させないため）、同名の `.d.ts` を手動で用意して型だけを供給する。
 */
export declare const importMap: ImportMap;
