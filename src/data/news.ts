import rawNews from './news.generated.json';

export type NewsCategory = 'china' | 'official' | 'opensource' | 'media' | 'community';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  sourceId: string;
  sourceName: string;
  region: 'china' | 'global';
  category: NewsCategory;
  publishedAt: string;
  points?: number;
  tags: string[];
}

export interface NewsDataset {
  updatedAt: string;
  activeSources: string[];
  totalCount: number;
  items: NewsItem[];
}

export const newsDataset = rawNews as NewsDataset;
export const allNews: NewsItem[] = newsDataset.items;

export const NEWS_CATEGORIES: { id: 'all' | NewsCategory; label: string }[] = [
  { id: 'all', label: '全部热点' },
  { id: 'china', label: '国内快讯' },
  { id: 'official', label: '官方一手' },
  { id: 'opensource', label: '开源生态' },
  { id: 'media', label: '海外媒体' },
  { id: 'community', label: '社区热议' },
];

export function getCategoryLabel(cat: NewsCategory): string {
  return NEWS_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

export function formatNewsTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso.slice(0, 10);
  // 转北京时间 (UTC+8)
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = bj.getUTCFullYear();
  const m = String(bj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(bj.getUTCDate()).padStart(2, '0');
  const hh = String(bj.getUTCHours()).padStart(2, '0');
  const mm = String(bj.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso.slice(0, 10);
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const m = String(bj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(bj.getUTCDate()).padStart(2, '0');
  return `${m}-${day}`;
}
