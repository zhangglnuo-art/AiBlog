import rawData from './models.generated.json';

export interface RelatedPost {
  title: string;
  href: string;
}

export interface AIModel {
  rank: number;
  slug: string;
  name: string;
  provider: string;
  providerZh: string;
  region: 'global' | 'china';
  license: 'closed' | 'open-weight';
  tier: 'flagship' | 'balanced' | 'fast';
  openrouterId: string | null;
  arenaElo: number;
  codingScore: number;
  reasoningScore: number;
  contextLength: number;
  inputPricePerM: number | null;
  outputPricePerM: number | null;
  blendedPricePerM: number | null;
  modalities: string[];
  releaseDate: string;
  chinaAccess: string;
  summary: string;
  strengths: string[];
  limitations: string[];
  bestFor: string[];
  differenceNote: string;
  relatedPosts: RelatedPost[];
  tags: string[];
  liveSynced: boolean;
}

export interface ModelsDataset {
  updatedAt: string;
  source: string;
  totalCount: number;
  models: AIModel[];
}

export const modelsDataset = rawData as ModelsDataset;
export const allModels: AIModel[] = modelsDataset.models;

export function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}M`;
  }
  return `${Math.round(tokens / 1000)}K`;
}

export function formatPrice(price: number | null): string {
  if (price == null) return '—';
  if (price === 0) return '免费';
  if (price < 0.1) return `$${price.toFixed(3)}`;
  if (price < 1) return `$${price.toFixed(2)}`;
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2).replace(/0$/, '')}`;
}

const MODALITY_LABELS: Record<string, string> = {
  text: '文本',
  image: '图像',
  audio: '音频',
  video: '视频',
  file: '文件',
};

export function formatModality(mod: string): string {
  return MODALITY_LABELS[mod] ?? mod;
}

export function getTierLabel(tier: AIModel['tier']): string {
  if (tier === 'flagship') return '旗舰';
  if (tier === 'balanced') return '均衡主力';
  return '极速轻量';
}

export function getLicenseLabel(license: AIModel['license']): string {
  return license === 'open-weight' ? '开源权重' : '闭源商业';
}

export function getRegionLabel(region: AIModel['region']): string {
  return region === 'china' ? '国产' : '海外';
}
