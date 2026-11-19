import { SCENES } from '../content/presets';
import type { Palette, Role } from './palette/types';

export interface ChecklistRow {
  role: Role;
  label: string;
  hex: string;
  use: string;
}

export interface SceneChecklistItem {
  scene: string;
  label: string;
  tip: string;
  rows: ChecklistRow[];
}

const USES: Record<string, Record<Role, string>> = {
  outfit: {
    primary: '上装 / 外套主色',
    secondary: '下装 / 内搭',
    accent: '鞋包 / 配饰',
    bg: '留白 / 内搭',
    surface: '外套 / 叠穿',
    text: '线条 / 小面积文字',
  },
  home: {
    primary: '主墙 / 大件家具',
    secondary: '沙发 / 次墙',
    accent: '抱枕 / 摆件',
    bg: '墙面底色',
    surface: '柜体 / 桌面',
    text: '灯具 / 小物',
  },
  food: {
    primary: '主菜 / 品牌色',
    secondary: '配菜 / 餐具',
    accent: '点缀 / 酱汁',
    bg: '餐盘 / 桌面',
    surface: '托盘 / 包装',
    text: '菜单 / 标签',
  },
  journal: {
    primary: '标题 / 主贴纸',
    secondary: '副标题 / 胶带',
    accent: '高亮 / 标记',
    bg: '纸面',
    surface: '便签 / 卡片',
    text: '正文 / 日期',
  },
  travel: {
    primary: '主视觉 / 行李',
    secondary: '天空 / 水',
    accent: '路标 / 票根',
    bg: '留白 / 云',
    surface: '卡片 / 地图',
    text: '说明 / 路线',
  },
  pet: {
    primary: '主色 / 牵引绳',
    secondary: '玩具 / 窝垫',
    accent: '名牌 / 小配件',
    bg: '背景 / 垫子',
    surface: '窝 / 毯子',
    text: '文字 / 标签',
  },
  floral: {
    primary: '主花',
    secondary: '配叶',
    accent: '丝带 / 包装',
    bg: '包装纸',
    surface: '卡片 / 内衬',
    text: '祝福 / 落款',
  },
  web: {
    primary: '主按钮 / 品牌',
    secondary: '链接 / 图表',
    accent: '状态 / 强调',
    bg: '页面背景',
    surface: '卡片 / 导航',
    text: '正文 / 标题',
  },
  ppt: {
    primary: '标题 / 主色块',
    secondary: '图表 / 次色块',
    accent: '强调 / 数据点',
    bg: '页面背景',
    surface: '卡片 / 表格',
    text: '正文 / 注释',
  },
  poster: {
    primary: '主视觉',
    secondary: '次视觉 / 图形',
    accent: '信息点 / 小字',
    bg: '底色',
    surface: '色块 / 边框',
    text: '标题 / 正文',
  },
};

export function buildSceneChecklist(p: Palette): SceneChecklistItem[] {
  return SCENES.map((scene) => {
    const uses = USES[scene.id] ?? USES.outfit;
    return {
      scene: scene.id,
      label: scene.label,
      tip: scene.tip,
      rows: p.colors.map((color) => ({
        role: color.role,
        label: color.label,
        hex: color.hex,
        use: uses[color.role] ?? color.label,
      })),
    };
  });
}

export function checklistMarkdown(p: Palette, items: SceneChecklistItem[]): string {
  const lines = [
    `# 场景清单 · ${p.customName?.trim() || p.name}`,
    '',
    `文字/背景 ${p.a11y.textOnBg.toFixed(2)}:1 · APCA Lc ${p.a11y.apca.toFixed(1)}`,
    '',
  ];
  for (const item of items) {
    lines.push(`## ${item.label}`, '');
    for (const row of item.rows) {
      lines.push(`- ${row.label} ${row.hex}：${row.use}`);
    }
    lines.push('', `> ${item.tip}`, '');
  }
  return lines.join('\n');
}
