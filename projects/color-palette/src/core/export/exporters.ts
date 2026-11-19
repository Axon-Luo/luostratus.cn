import { toColorMap } from '../palette/types';
import type { Palette } from '../palette/types';
import { rgbToCmyk } from '../cmyk';
import { MOOD_MAP, SCENES, STYLE_MAP } from '../../content/presets';
import { colorName } from '../color/naming';

const ROLE_TOKEN: Record<string, string> = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  bg: 'bg',
  surface: 'surface',
  text: 'text',
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function displayName(p: Palette): string {
  return p.customName?.trim() || p.name;
}

/** 色卡副标题：有风格/情绪时说明组合，没有时用三个彩色的中文名。 */
export function paletteSubtitle(p: Palette): string {
  const scene = SCENES.find((s) => s.id === p.scene)?.label ?? p.scene;
  const mods = [
    p.style !== 'none' ? STYLE_MAP[p.style]?.label : '',
    p.mood !== 'none' ? MOOD_MAP[p.mood]?.label : '',
  ].filter((v): v is string => Boolean(v));
  if (mods.length) return `${scene} · ${mods.join(' · ')}`;
  const map = toColorMap(p);
  return `主色 ${colorName(map.primary)} · 辅助 ${colorName(map.secondary)} · 强调 ${colorName(map.accent)}`;
}

export function paletteToCss(p: Palette): string {
  const lines = p.colors.map(
    (c) =>
      `  --color-${ROLE_TOKEN[c.role] ?? c.role}: ${c.hex}; /* ${c.label} ${c.name} ${c.ratio}% */`,
  );
  const dark = (p.dark ?? []).map(
    (c) =>
      `  --color-${ROLE_TOKEN[c.role] ?? c.role}: ${c.hex}; /* ${c.label} ${c.name} ${c.ratio}% */`,
  );
  const parts = [
    `/* ${displayName(p)} · 配色工坊 */`,
    ':root {',
    ...lines,
    '}',
  ];
  if (dark.length) {
    parts.push('', '[data-theme="dark"] {', ...dark, '}');
  }
  return parts.join('\n') + '\n';
}

export function paletteToJson(p: Palette): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      name: displayName(p),
      scene: p.scene,
      style: p.style,
      mood: p.mood,
      harmony: p.harmony,
      a11y: p.a11y,
      darkA11y: p.darkA11y,
      cvd: p.cvd,
      print: {
        primary: rgbToCmyk(p.colors.find((c) => c.role === 'primary')?.hex ?? '#000000'),
        note: 'CMYK 为近似值，正式印刷请以打样为准',
      },
      colors: p.colors.map((c) => ({
        role: c.role,
        label: c.label,
        hex: c.hex,
        name: c.name,
        ratio: c.ratio,
      })),
      dark: p.dark?.map((c) => ({
        role: c.role,
        label: c.label,
        hex: c.hex,
        name: c.name,
        ratio: c.ratio,
      })),
      description: p.description,
      generator: 'colife-workshop/0.1',
    },
    null,
    2,
  );
}

export function paletteToSvg(p: Palette): string {
  const W = 900;
  const H = 520;
  const map = toColorMap(p);
  const name = displayName(p);
  const sceneLine = paletteSubtitle(p);

  const chips = p.colors
    .map((c, i) => {
      const x = 40 + i * 136;
      return [
        `<rect x="${x}" y="118" width="124" height="168" rx="8" fill="${c.hex}" stroke="rgba(0,0,0,0.14)"/>`,
        `<text x="${x}" y="316" font-size="16" fill="#17171A">${esc(c.name)} ${esc(c.label)}</text>`,
        `<text x="${x}" y="340" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#6B6B66">${esc(c.hex)}</text>`,
        `<text x="${x}" y="360" font-size="12" fill="#8A8A84">${c.ratio}%</text>`,
      ].join('');
    })
    .join('');

  let cursor = 40;
  const bars = p.colors
    .map((c) => {
      const w = (c.ratio / 100) * 820;
      const rect = `<rect x="${cursor.toFixed(2)}" y="398" width="${Math.max(0, w).toFixed(2)}" height="14" fill="${c.hex}"/>`;
      cursor += w;
      return rect;
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="配色卡 ${esc(name)}">`,
    `<rect width="${W}" height="${H}" fill="#FFFDF9"/>`,
    `<text x="40" y="58" font-family="system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="30" font-weight="600" fill="#17171A">${esc(name)}</text>`,
    `<text x="40" y="88" font-family="system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="15" fill="#6B6B66">${esc(sceneLine)}</text>`,
    chips,
    `<rect x="40" y="398" width="820" height="14" rx="7" fill="#F0EDE6"/>`,
    bars,
    `<text x="40" y="452" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#6B6B66">文字/背景 ${p.a11y.textOnBg.toFixed(2)}:1 · APCA Lc ${p.a11y.apca.toFixed(1)}</text>`,
    `<text x="860" y="452" text-anchor="end" font-family="system-ui, sans-serif" font-size="13" fill="#8A8A84">配色工坊 · 生活调色盘</text>`,
    `<text x="40" y="482" font-family="system-ui, sans-serif" font-size="12" fill="#8A8A84">${esc(map.primary)} ${esc(map.secondary)} ${esc(map.accent)}</text>`,
    `</svg>`,
  ].join('');
}

export function exportFileName(p: Palette, ext: string): string {
  const base =
    displayName(p)
      .replace(/[\\/:*?"<>|·\s]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'palette';
  return `配色工坊-${base}.${ext}`;
}
