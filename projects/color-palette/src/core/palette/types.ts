export const ROLES = [
  { id: 'primary', label: '主色', ratio: 38 },
  { id: 'secondary', label: '辅助色', ratio: 22 },
  { id: 'accent', label: '强调色', ratio: 8 },
  { id: 'bg', label: '背景', ratio: 22 },
  { id: 'surface', label: '面板', ratio: 6 },
  { id: 'text', label: '文字', ratio: 4 },
] as const;

export type Role = (typeof ROLES)[number]['id'];

export const ROLE_IDS: Role[] = ROLES.map((r) => r.id);

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  ROLES.map((r) => [r.id, r.label]),
) as Record<Role, string>;

export interface ColorEntry {
  role: Role;
  label: string;
  hex: string;
  name: string;
  ratio: number;
}

export interface A11yReport {
  textOnBg: number;
  primaryOnBg: number;
  secondaryOnBg: number;
  accentOnBg: number;
  apca: number;
  aa: boolean;
  aaa: boolean;
  warnings: string[];
}

export type HarmonyType =
  | 'auto'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'split'
  | 'tetradic'
  | 'monochrome';

export type SceneId =
  | 'outfit'
  | 'home'
  | 'food'
  | 'journal'
  | 'travel'
  | 'pet'
  | 'floral'
  | 'web'
  | 'ppt'
  | 'poster';

export type StyleId = 'minimal' | 'retro' | 'tech' | 'nature' | 'guochao' | 'vivid';

export type MoodId = 'warm' | 'calm' | 'fresh' | 'premium' | 'energy';

export interface Palette {
  id: string;
  name: string;
  customName: string;
  seed: number;
  harmony: HarmonyType;
  scene: SceneId;
  style: StyleId | 'none';
  mood: MoodId | 'none';
  colors: ColorEntry[];
  a11y: A11yReport;
  description: string;
  createdAt: number;
  updatedAt: number;
  /** F06：成对生成的深色版本；缺省时预览用派生值。 */
  dark?: ColorEntry[];
  darkA11y?: A11yReport;
  cvd?: CvdReport;
  source?: 'generator' | 'share' | 'import' | 'image' | 'case' | 'daily' | 'tool';
  tags?: string[];
}

export interface CvdReport {
  protan: number;
  deutan: number;
  tritan: number;
  safe: boolean;
}

export type ColorMap = Record<Role, string>;

export function toColorMap(palette: Palette): ColorMap {
  const map = {} as ColorMap;
  for (const c of palette.colors) map[c.role] = c.hex;
  return map;
}
