import { colorName } from '../core/color/naming';
import { ROLES } from '../core/palette/types';
import type { ColorEntry, ColorMap, Palette, Role } from '../core/palette/types';

export interface SceneDef {
  id: string;
  label: string;
  desc: string;
  tip: string;
  chroma: number;
  hueShift: number;
  neutralHue: number;
}

export const SCENES: SceneDef[] = [
  {
    id: 'outfit',
    label: '穿搭',
    desc: '适合日常穿搭的上装、下装与鞋包配色',
    tip: '大面积交给中性色，主色放在上衣或外套，强调色留给鞋包与配饰',
    chroma: 0.95,
    hueShift: 0,
    neutralHue: 40,
  },
  {
    id: 'home',
    label: '家居',
    desc: '适合房间墙面、软装与摆件的配色',
    tip: '墙面用背景色，窗帘与沙发承接辅助色，摆件用强调色点亮',
    chroma: 0.8,
    hueShift: 4,
    neutralHue: 55,
  },
  {
    id: 'food',
    label: '美食',
    desc: '适合餐盘、甜品与餐桌布置的配色',
    tip: '暖色更开胃；背景保持干净，让食物本身成为画面主角',
    chroma: 1.1,
    hueShift: 10,
    neutralHue: 45,
  },
  {
    id: 'journal',
    label: '手账',
    desc: '适合手账、贴纸与文具的配色',
    tip: '同色系最容易排得好看，强调色只用来标注重点',
    chroma: 1,
    hueShift: -6,
    neutralHue: 70,
  },
  {
    id: 'travel',
    label: '旅行',
    desc: '适合旅行照片、游记与明信片的配色',
    tip: '让天空或远景成为背景，主体色取自画面中最亮的颜色',
    chroma: 1.05,
    hueShift: 0,
    neutralHue: 30,
  },
  {
    id: 'pet',
    label: '宠物',
    desc: '适合宠物照片、周边与领巾的配色',
    tip: '避开和宠物毛色太接近的颜色，主体才不会被吃掉',
    chroma: 0.9,
    hueShift: 6,
    neutralHue: 50,
  },
  {
    id: 'floral',
    label: '花艺',
    desc: '适合花束、花器与包装的配色',
    tip: '主色取自花瓣，辅助色取叶材，背景留给包装纸',
    chroma: 1.1,
    hueShift: -4,
    neutralHue: 80,
  },
  {
    id: 'web',
    label: '网页',
    desc: '适合落地页、产品界面与 App 的配色',
    tip: '主色承担按钮与链接，面板色做卡片，文字色保证 4.5:1',
    chroma: 1,
    hueShift: 0,
    neutralHue: 250,
  },
  {
    id: 'ppt',
    label: 'PPT',
    desc: '适合汇报、提案与课程展示的配色',
    tip: '深色做标题、浅色做底，强调色只出现在图表与结论',
    chroma: 0.95,
    hueShift: 0,
    neutralHue: 230,
  },
  {
    id: 'poster',
    label: '海报',
    desc: '适合海报、封面与社交媒体的配色',
    tip: '高对比更抓眼，但正文仍要保持可读，避免纯红绿并置',
    chroma: 1.15,
    hueShift: 8,
    neutralHue: 20,
  },
];

export const SCENE_MAP: Record<string, SceneDef> = Object.fromEntries(
  SCENES.map((s) => [s.id, s]),
);

export interface Modifier {
  id: string;
  label: string;
  chroma: number;
  light: number;
  hue: number;
}

export const STYLES: Modifier[] = [
  { id: 'minimal', label: '极简', chroma: 0.72, light: 0.04, hue: 0 },
  { id: 'retro', label: '复古', chroma: 0.82, light: -0.03, hue: -10 },
  { id: 'tech', label: '科技', chroma: 1.12, light: -0.02, hue: 10 },
  { id: 'nature', label: '自然', chroma: 0.9, light: 0.03, hue: -5 },
  { id: 'guochao', label: '国潮', chroma: 1.22, light: -0.02, hue: -14 },
  { id: 'vivid', label: '活力', chroma: 1.28, light: 0.02, hue: 6 },
];

export const MOODS: Modifier[] = [
  { id: 'warm', label: '温暖', chroma: 1.06, light: 0.03, hue: 9 },
  { id: 'calm', label: '冷静', chroma: 0.84, light: 0.02, hue: -9 },
  { id: 'fresh', label: '清新', chroma: 0.98, light: 0.05, hue: -3 },
  { id: 'premium', label: '高级', chroma: 0.68, light: -0.02, hue: 0 },
  { id: 'energy', label: '活力', chroma: 1.16, light: 0.02, hue: 5 },
];

export const STYLE_MAP: Record<string, Modifier> = Object.fromEntries(
  [...STYLES, { id: 'none', label: '通用', chroma: 1, light: 0, hue: 0 }].map((s) => [s.id, s]),
);

export const MOOD_MAP: Record<string, Modifier> = Object.fromEntries(
  [...MOODS, { id: 'none', label: '不限', chroma: 1, light: 0, hue: 0 }].map((s) => [s.id, s]),
);

export const HARMONIES: Array<{ id: string; label: string; hint: string }> = [
  { id: 'auto', label: '自动', hint: '每次换一种关系' },
  { id: 'analogous', label: '类似色', hint: '同色相相邻，最稳' },
  { id: 'complementary', label: '互补色', hint: '色环对面，对比强' },
  { id: 'triadic', label: '三角色', hint: '均衡又有变化' },
  { id: 'split', label: '分裂互补', hint: '有对比但不刺眼' },
  { id: 'tetradic', label: '四角色', hint: '丰富，适合海报' },
  { id: 'monochrome', label: '单色', hint: '一个色相走到底' },
];

export const HARMONY_LABEL: Record<string, string> = Object.fromEntries(
  HARMONIES.map((h) => [h.id, h.label]),
);

export const COLOR_FORMATS = ['HEX', 'RGB', 'HSL'] as const;
export type ColorFormat = (typeof COLOR_FORMATS)[number];

export function hexLabel(role: Role, hex: string, ratio: number): ColorEntry {
  return {
    role,
    label: ROLES.find((r) => r.id === role)?.label ?? role,
    hex,
    name: colorName(hex),
    ratio,
  };
}

export { ROLES };
export type { Role, ColorEntry, ColorMap, Palette };
