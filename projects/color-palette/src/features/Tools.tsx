import { Card } from '../ui/components';

interface ToolLink {
  href: string;
  title: string;
  desc: string;
  tag: string;
}

const GROUPS: Array<{ title: string; items: ToolLink[] }> = [
  {
    title: '开始与素材',
    items: [
      {
        href: '#/studio',
        title: '工作台',
        desc: '拍照、选图、情绪板、吸管或粘贴 CSS/JSON，从一张照片开始配色',
        tag: '开始',
      },
      {
        href: '#/library',
        title: '我的方案',
        desc: '收藏、历史、备份导入导出，所有数据只留在本机',
        tag: '管理',
      },
    ],
  },
  {
    title: '专业工具',
    items: [
      {
        href: '#/scales',
        title: '色阶与设计令牌',
        desc: '6 色 × 11 档色阶、语义色，导出 CSS / Tailwind / Figma / Android / iOS / Flutter',
        tag: '开发',
      },
      {
        href: '#/gradient',
        title: '渐变生成器',
        desc: '线性、径向、锥形；色标轨拖拽、角度旋钮与中心控制，6 套预设，复制 CSS 或多尺寸 PNG',
        tag: '设计',
      },
      {
        href: '#/mix',
        title: '混色实验室',
        desc: '同比例下颜料减色与光加色并排对比，滑杆调比例，结果可复制或带回工作台',
        tag: '实验',
      },
      {
        href: '#/contrast',
        title: '对比度修复器',
        desc: 'WCAG 四档判定，一键给出离原色最近的达标修正色，修前景或修背景',
        tag: '无障碍',
      },
    ],
  },
  {
    title: '生活任务',
    items: [
      {
        href: '#/outfit',
        title: '一周穿搭',
        desc: '按场合和天气生成七天搭配，导出周历，单日可带回工作台',
        tag: '穿搭',
      },
      {
        href: '#/room',
        title: '房间刷色',
        desc: '墙面/地面/沙发/窗帘/点缀按面积分配，导出 A4 清单',
        tag: '家居',
      },
      {
        href: '#/card',
        title: '礼物贺卡',
        desc: '五种版式、四种场合，写祝福并独立调色，导出 3:4 贺卡 PNG',
        tag: '礼物',
      },
      {
        href: '#/print',
        title: '打印色卡',
        desc: 'A4/A5、150dpi、带裁切线，色卡与房间清单都能打印',
        tag: '打印',
      },
    ],
  },
  {
    title: '灵感与学习',
    items: [
      {
        href: '#/cases',
        title: '生活案例',
        desc: '8 个真实场景的配色起点：社团招新、毕业季、咖啡店、露营……',
        tag: '案例',
      },
      {
        href: '#/learn',
        title: '配色小课堂',
        desc: '8 篇体系化短文：比例、对比度、色觉、和谐、色彩模型、情绪、色阶与印刷',
        tag: '学习',
      },
      {
        href: '#/themes',
        title: '主题配色',
        desc: '12 个节气、8 座城市和随机盲盒，每一套都能带回工作台',
        tag: '灵感',
      },
      {
        href: '#/traditional',
        title: '传统色字典',
        desc: '118 个中国传统色叫法，按名字/色值/色系翻查，任意色值查最接近的传统名',
        tag: '字典',
      },
    ],
  },
  {
    title: '每日与挑战',
    items: [
      {
        href: '#/daily',
        title: '每日一色',
        desc: '每天固定一套配色和一句话，留下连续回看的颜色记录',
        tag: '每天',
      },
      {
        href: '#/play',
        title: '配色挑战',
        desc: '60 秒四种题型，色差越来越小，看看眼睛有多敏感',
        tag: '练习',
      },
    ],
  },
];

export function Tools() {
  return (
    <div class="container page">
      <header class="page-head">
        <h1>工具</h1>
        <p>除了工作台，还有这些可以直接用的小工具，都是本地计算，不上传图片</p>
      </header>

      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title}>
          <div class="tool-grid">
            {group.items.map((tool) => (
              <a class="tool-card" href={tool.href} key={tool.href}>
                <span class="tool-tag">{tool.tag}</span>
                <strong>{tool.title}</strong>
                <p>{tool.desc}</p>
              </a>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
