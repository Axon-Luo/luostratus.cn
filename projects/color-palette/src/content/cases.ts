import type { HarmonyType, MoodId, SceneId, StyleId } from '../core/palette/types';

export interface CasePreset {
  id: string;
  title: string;
  scene: SceneId;
  story: string;
  baseHex: string;
  style: StyleId | 'none';
  mood: MoodId | 'none';
  harmony: HarmonyType;
  tags: string[];
}

export const CASES: CasePreset[] = [
  {
    id: 'club-recruit',
    title: '校园社团招新',
    scene: 'poster',
    story: '招新摊位要在一排海报里被看见。用高饱和的橙红做主色，深蓝压住画面，留给二维码和报名时间。',
    baseHex: '#E85D3D',
    style: 'vivid',
    mood: 'energy',
    harmony: 'complementary',
    tags: ['校园', '海报', '招新'],
  },
  {
    id: 'graduation',
    title: '毕业季主视觉',
    scene: 'poster',
    story: '毕业不是结束，是把蓝色校服收进箱子。深蓝配米白，加一点旧金色，像一张被保存很久的照片。',
    baseHex: '#3D5A99',
    style: 'retro',
    mood: 'warm',
    harmony: 'analogous',
    tags: ['毕业', '主视觉', '纪念'],
  },
  {
    id: 'coffee-shop',
    title: '街角咖啡店',
    scene: 'food',
    story: '咖啡店的颜色要让人想坐下来。棕、奶油、深绿，像一杯刚做好的拿铁和窗边的植物。',
    baseHex: '#8C5A3C',
    style: 'retro',
    mood: 'warm',
    harmony: 'analogous',
    tags: ['咖啡', '餐饮', '温暖'],
  },
  {
    id: 'camping',
    title: '周末露营',
    scene: 'travel',
    story: '露营不需要太多颜色：森林绿、帐篷米、篝火橙。把大面积留给自然，小面积留给火光。',
    baseHex: '#4F7A4A',
    style: 'nature',
    mood: 'fresh',
    harmony: 'analogous',
    tags: ['露营', '户外', '自然'],
  },
  {
    id: 'exam-week',
    title: '考试周作息表',
    scene: 'web',
    story: '考试周的信息要清楚，不要刺激。蓝灰做底、深色文字、一个橙色提醒，够了。',
    baseHex: '#5B6B8C',
    style: 'minimal',
    mood: 'calm',
    harmony: 'monochrome',
    tags: ['学习', '表格', '冷静'],
  },
  {
    id: 'wedding',
    title: '婚礼请柬',
    scene: 'floral',
    story: '请柬的颜色要轻，但不能没有重点。燕麦色、干枯玫瑰、深棕，像一束晒干的花。',
    baseHex: '#B98A6A',
    style: 'minimal',
    mood: 'warm',
    harmony: 'analogous',
    tags: ['婚礼', '请柬', '温柔'],
  },
  {
    id: 'journal',
    title: '手账内页',
    scene: 'journal',
    story: '手账的颜色要能陪很久。低饱和的粉、米白、灰绿，写满一整本也不累。',
    baseHex: '#D98C8C',
    style: 'retro',
    mood: 'fresh',
    harmony: 'analogous',
    tags: ['手账', '文具', '日常'],
  },
  {
    id: 'podcast',
    title: '播客封面',
    scene: 'poster',
    story: '播客封面在小屏幕上也要认得出。紫做主角、荧光黄做强调，留一块深色放标题。',
    baseHex: '#6B4FA0',
    style: 'vivid',
    mood: 'premium',
    harmony: 'complementary',
    tags: ['播客', '封面', '声音'],
  },
];
