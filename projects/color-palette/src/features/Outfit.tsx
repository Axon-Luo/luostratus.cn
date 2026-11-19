import { useEffect, useState } from 'preact/hooks';
import {
  buildOutfitWeek,
  OUTFIT_OCCASIONS,
  OUTFIT_WEATHERS,
} from '../core/lifePlans';
import type { OutfitDay, OutfitOccasion, OutfitWeather } from '../core/lifePlans';
import { renderOutfitImage } from '../core/lifeSheets';
import { applyPaletteToStudio, toast } from '../state';
import { Card } from '../ui/components';
import { downloadBlob } from './download';

export function Outfit() {
  const [occasion, setOccasion] = useState<OutfitOccasion>('commute');
  const [weather, setWeather] = useState<OutfitWeather>('mild');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [days, setDays] = useState<OutfitDay[]>(() =>
    buildOutfitWeek({ occasion: 'commute', weather: 'mild', seed }),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDays(buildOutfitWeek({ occasion, weather, seed }));
  }, [occasion, weather, seed]);

  const exportPng = async () => {
    setBusy(true);
    try {
      const label = OUTFIT_OCCASIONS.find((o) => o.id === occasion)?.label ?? '';
      const weatherLabel = OUTFIT_WEATHERS.find((w) => w.id === weather)?.label ?? '';
      const blob = await renderOutfitImage(days, `${label} · ${weatherLabel}天气 · 7 天`);
      downloadBlob(blob, `配色工坊-一周穿搭-${label}-${weatherLabel}.png`);
    } catch {
      toast('图片生成失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>一周穿搭</h1>
        <p>选一个场合和天气，生成七天的上装 / 下装 / 鞋包配色；每天都能单独带回工作台</p>
      </header>

      <Card
        title="搭配条件"
        actions={
          <div class="card-actions">
            <button
              type="button"
              class="btn ghost sm"
              onClick={() => setSeed(Math.floor(Math.random() * 100000))}
            >
              换一周
            </button>
            <button type="button" class="btn primary sm" disabled={busy} onClick={exportPng}>
              导出周历
            </button>
          </div>
        }
      >
        <div class="outfit-controls">
          <div class="field">
            <span class="field-label">场合</span>
            <div class="chips">
              {OUTFIT_OCCASIONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  class={`chip ${occasion === item.id ? 'is-on' : ''}`}
                  aria-pressed={occasion === item.id}
                  onClick={() => setOccasion(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div class="field">
            <span class="field-label">天气</span>
            <div class="chips">
              {OUTFIT_WEATHERS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  class={`chip ${weather === item.id ? 'is-on' : ''}`}
                  aria-pressed={weather === item.id}
                  onClick={() => setWeather(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div class="outfit-grid">
        {days.map((day) => (
          <article class="outfit-day" key={day.day}>
            <header>
              <strong>{['周一', '周二', '周三', '周四', '周五', '周六', '周日'][day.day - 1]}</strong>
              <button
                type="button"
                class="link"
                onClick={() => {
                  applyPaletteToStudio(day.palette);
                  toast('已带回工作台');
                }}
              >
                用这套
              </button>
            </header>
            <div class="outfit-chips">
              <span style={{ background: day.top }} title={day.top}>
                <b>上装</b>
              </span>
              <span style={{ background: day.bottom }} title={day.bottom}>
                <b>下装</b>
              </span>
              <span style={{ background: day.shoes }} title={day.shoes}>
                <b>鞋包</b>
              </span>
            </div>
            <div class="outfit-hex mono">
              {day.top} · {day.bottom} · {day.shoes}
            </div>
            <p>{day.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
