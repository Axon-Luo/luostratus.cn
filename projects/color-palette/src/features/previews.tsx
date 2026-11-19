import { simulateCvd } from '../core/color/cvd';
import type { CvdType } from '../core/color/cvd';
import { textOn, withAlpha } from '../core/color/convert';
import type { ColorMap } from '../core/palette/types';
import type { PreviewMode } from '../core/storage';

export function applyCvd(map: ColorMap, cvd: CvdType): ColorMap {
  if (cvd === 'none') return map;
  const out = {} as ColorMap;
  for (const key of Object.keys(map) as Array<keyof ColorMap>) {
    out[key] = simulateCvd(map[key], cvd);
  }
  return out;
}

function PhonePreview({ c }: { c: ColorMap }) {
  return (
    <div class="pv-phone" style={{ background: c.bg, color: c.text }}>
      <div class="pv-status">
        <span>9:41</span>
        <span class="pv-status-dots">●●●</span>
      </div>
      <div class="pv-phone-body">
        <div class="pv-phone-head">
          <strong style={{ color: c.primary }}>配色工坊</strong>
          <span style={{ color: withAlpha(c.text, 0.6) }}>我的</span>
        </div>
        <div
          class="pv-phone-card"
          style={{ background: c.surface, borderColor: withAlpha(c.text, 0.1) }}
        >
          <span
            class="pv-pill"
            style={{ background: withAlpha(c.primary, 0.16), color: c.primary }}
          >
            今日配色
          </span>
          <h4 style={{ color: c.text }}>
            把生活调成
            <br />
            喜欢的颜色
          </h4>
          <p style={{ color: withAlpha(c.text, 0.68) }}>
            拍一张照片，立刻得到能用的配色
          </p>
          <div class="pv-actions">
            <span style={{ background: c.primary, color: textOn(c.primary) }}>开始配色</span>
            <span style={{ borderColor: withAlpha(c.text, 0.2), color: c.text }}>看看示例</span>
          </div>
        </div>
        <div class="pv-phone-tiles">
          <div style={{ background: c.secondary, color: textOn(c.secondary) }}>
            <span>辅助色</span>
            <small>{c.secondary}</small>
          </div>
          <div style={{ background: c.accent, color: textOn(c.accent) }}>
            <span>强调色</span>
            <small>{c.accent}</small>
          </div>
        </div>
      </div>
      <div class="pv-home-bar" style={{ background: withAlpha(c.text, 0.25) }} />
    </div>
  );
}

function WebPreview({ c }: { c: ColorMap }) {
  return (
    <div class="pv-web" style={{ background: c.bg, color: c.text }}>
      <div class="pv-web-nav" style={{ borderColor: withAlpha(c.text, 0.12) }}>
        <strong style={{ color: c.primary }}>LUO</strong>
        <span>首页</span>
        <span>产品</span>
        <span>关于</span>
        <span class="pv-web-cta" style={{ background: c.accent, color: textOn(c.accent) }}>
          立即开始
        </span>
      </div>
      <div class="pv-web-hero">
        <span class="pv-pill" style={{ background: withAlpha(c.primary, 0.14), color: c.primary }}>
          新功能
        </span>
        <h3 style={{ color: c.text }}>用色彩讲述品牌故事</h3>
        <p style={{ color: withAlpha(c.text, 0.7) }}>
          这是一段示例正文，用来观察配色在真实界面里的层次与可读性
        </p>
        <div class="pv-actions">
          <span style={{ background: c.primary, color: textOn(c.primary) }}>立即开始</span>
          <span style={{ borderColor: withAlpha(c.secondary, 0.8), color: c.secondary }}>
            了解更多
          </span>
        </div>
      </div>
      <div class="pv-web-cards">
        <div class="pv-web-card" style={{ background: c.surface, borderColor: withAlpha(c.text, 0.1) }}>
          <b style={{ color: c.primary }}>夏日色彩节</b>
          <p style={{ color: withAlpha(c.text, 0.65) }}>一场关于颜色、光与情绪的城市漫游</p>
        </div>
        <div class="pv-web-card" style={{ background: c.surface, borderColor: withAlpha(c.text, 0.1) }}>
          <b style={{ color: c.accent }}>重点标签</b>
          <p style={{ color: withAlpha(c.text, 0.65) }}>次级信息与辅助说明在这里展示</p>
        </div>
      </div>
    </div>
  );
}

function PosterPreview({ c }: { c: ColorMap }) {
  return (
    <div class="pv-poster" style={{ background: c.bg, color: c.text }}>
      <div class="pv-poster-copy">
        <span class="pv-poster-kicker" style={{ color: c.accent }}>
          2026 · 城市文化
        </span>
        <h3 style={{ color: c.text }}>夏日色彩节</h3>
        <p style={{ color: withAlpha(c.text, 0.72) }}>
          一场关于颜色、光与情绪的城市漫游
        </p>
        <span class="pv-poster-btn" style={{ background: c.primary, color: textOn(c.primary) }}>
          查看详情
        </span>
      </div>
      <div class="pv-poster-art" style={{ background: c.secondary }}>
        <i style={{ background: c.accent }} />
        <i style={{ background: withAlpha(c.primary, 0.9) }} />
        <i style={{ background: withAlpha(c.bg, 0.85) }} />
      </div>
    </div>
  );
}

function WallpaperPreview({ c }: { c: ColorMap }) {
  return (
    <div class="pv-wallpaper" style={{ background: c.bg, color: c.text }}>
      <div class="pv-wall-blob" style={{ background: c.primary }} />
      <div class="pv-wall-blob two" style={{ background: c.secondary }} />
      <div class="pv-wall-blob three" style={{ background: c.accent }} />
      <div class="pv-wall-content">
        <span class="pv-wall-time">{new Date().getHours().toString().padStart(2, '0')}:41</span>
        <span class="pv-wall-date">11 月 16 日 · 星期一</span>
        <p class="pv-wall-quote" style={{ color: withAlpha(c.text, 0.8) }}>
          把生活，调成喜欢的颜色
        </p>
      </div>
    </div>
  );
}

function OutfitPreview({ c }: { c: ColorMap }) {
  return (
    <div class="pv-outfit" style={{ background: c.bg, color: c.text }}>
      <div class="pv-outfit-head">
        <strong style={{ color: c.text }}>今日穿搭</strong>
        <span style={{ color: withAlpha(c.text, 0.6) }}>11 / 16</span>
      </div>
      <div class="pv-outfit-grid">
        <div class="pv-garment tall" style={{ background: c.primary }}>
          <span>上装</span>
        </div>
        <div class="pv-garment" style={{ background: c.secondary }}>
          <span>下装</span>
        </div>
        <div class="pv-garment small" style={{ background: c.accent }}>
          <span>鞋包</span>
        </div>
      </div>
      <p class="pv-outfit-note" style={{ color: withAlpha(c.text, 0.65) }}>
        主色占大面积，辅助色过渡，强调色只做点缀
      </p>
    </div>
  );
}

export function Preview({ mode, map }: { mode: PreviewMode; map: ColorMap }) {
  if (mode === 'web') return <WebPreview c={map} />;
  if (mode === 'poster') return <PosterPreview c={map} />;
  if (mode === 'wallpaper') return <WallpaperPreview c={map} />;
  if (mode === 'outfit') return <OutfitPreview c={map} />;
  return <PhonePreview c={map} />;
}
