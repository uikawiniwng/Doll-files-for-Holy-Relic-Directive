import type { DollData, ThemeResolved } from '../types';

export const rarityColorMap: Record<string, string> = {
  D: '#6B7280',
  C: '#9CA3AF',
  B: '#34D399',
  A: '#60A5FA',
  S: '#C084FC',
  X: '#FBBF24',
  EX: '#67E8F9',
};

export const rarityTierMap: Record<string, number> = {
  D: 0,
  C: 1,
  B: 2,
  A: 3,
  S: 4,
  X: 5,
  EX: 6,
};

function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
  let h = (hex || '#808080').replace(/^#/, '');
  if (h.length === 3) h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return {
    r: Number.isFinite(r) ? r : 128,
    g: Number.isFinite(g) ? g : 128,
    b: Number.isFinite(b) ? b : 128,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): string {
  const { r, g, b } = hexToRgbObj(hex);
  return `${r}, ${g}, ${b}`;
}

export function harmonizeAccent(
  hex: string,
  mixTarget = '#94a3b8',
  mixRatio = 0.22,
  minLuma = 102,
  maxLuma = 205,
): string {
  const base = hexToRgbObj(hex);
  const target = hexToRgbObj(mixTarget);

  let r = base.r * (1 - mixRatio) + target.r * mixRatio;
  let g = base.g * (1 - mixRatio) + target.g * mixRatio;
  let b = base.b * (1 - mixRatio) + target.b * mixRatio;

  const luma = () => 0.299 * r + 0.587 * g + 0.114 * b;
  let current = luma();

  if (current < minLuma) {
    const t = (minLuma - current) / 255;
    r = r + (255 - r) * t;
    g = g + (255 - g) * t;
    b = b + (255 - b) * t;
    current = luma();
  }

  if (current > maxLuma) {
    const t = (current - maxLuma) / 255;
    r = r * (1 - t);
    g = g * (1 - t);
    b = b * (1 - t);
  }

  return rgbToHex(r, g, b);
}

export function normalizeRarity(raw: unknown): string {
  const text = String(raw || 'C')
    .trim()
    .toUpperCase()
    .replace(/[级級]/g, '');

  if (text.includes('EX')) return 'EX';
  if (text.includes('SSS') || text.includes('SS') || text.includes('X')) return 'X';
  if (text.includes('S')) return 'S';
  if (text.includes('A')) return 'A';
  if (text.includes('B')) return 'B';
  if (text.includes('C')) return 'C';
  if (text.includes('D')) return 'D';
  return 'C';
}

export function resolveTheme(data: DollData): ThemeResolved {
  const rarity = normalizeRarity(data.稀有度);
  const rawHex = rarityColorMap[rarity] || rarityColorMap.C;
  const rarityHex = harmonizeAccent(rawHex);
  const tier = rarityTierMap[rarity] || 1;

  return {
    rarity,
    rarityHex,
    rarityRgb: hexToRgb(rarityHex),
    tier,
    raceKey: rarity,
    raceHex: rarityHex,
    tierHex: rarityHex,
    raceRgb: hexToRgb(rarityHex),
    tierRgb: hexToRgb(rarityHex),
  };
}

export function applyTheme(theme: ThemeResolved, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--rarity-color', theme.rarityHex);
  root.style.setProperty('--rarity-color-rgb', theme.rarityRgb);
  root.style.setProperty('--race-color', theme.rarityHex);
  root.style.setProperty('--race-color-rgb', theme.rarityRgb);
  root.style.setProperty('--tier-color', theme.rarityHex);
  root.style.setProperty('--tier-color-rgb', theme.rarityRgb);
}
