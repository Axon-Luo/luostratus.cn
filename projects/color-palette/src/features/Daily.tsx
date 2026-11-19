import { useEffect, useState } from 'preact/hooks';
import { dailyPalette, dailyNote, dayKey } from '../core/daily';
import { contrastRatio } from '../core/color/contrast';
import type { Palette } from '../core/palette/types';
import { displayName } from '../core/export/exporters';
import { applyPaletteToStudio, daily, markDailyVisit, toast } from '../state';
import { Card } from '../ui/components';
import { ShareCardDialog } from './studio/ShareCardDialog';
import { copyText, exportPng } from './fileExport';

function shortDate(key: string): string {
  return key.slice(5).replace('-', '.');
}

export function Daily() {
  const today = dayKey();
  const [todayPalette, setTodayPalette] = useState<Palette>(() => dailyPalette(today));
  const [selected, setSelected] = useState(today);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setTodayPalette(markDailyVisit());
  }, []);

  const current = selected === today ? todayPalette : dailyPalette(selected);
  const archive = daily.value.archive.length ? daily.value.archive : [{ date: today, seed: 0 }];

  return (
    <div class="container page">
      <header class="page-head">
        <h1>每日一色</h1>
        <p>每天固定一套配色，配一句给今天的话，连续回来看，会留下一条颜色记录</p>
      </header>

      <Card
        title={`今日 · ${shortDate(today)}`}
        hint={`连续 ${daily.value.streak} 天`}
        actions={
          <div class="card-actions">
            {selected !== today && (
              <button type="button" class="btn ghost sm" onClick={() => setSelected(today)}>
                回到今天
              </button>
            )}
            <button
              type="button"
              class="btn ghost sm"
              onClick={() => copyText(current.colors.map((c) => c.hex).join(', '), '色值已复制')}
            >
              复制色值
            </button>
            <button
              type="button"
              class="btn ghost sm"
              onClick={() => void exportPng(current)}
            >
              导出 PNG
            </button>
            <button type="button" class="btn ghost sm" onClick={() => setShareOpen(true)}>
              分享卡
            </button>
          </div>
        }
      >
        <div class="daily-hero">
          <div class="daily-swatches">
            {current.colors.map((c) => (
              <button
                type="button"
                key={c.role}
                class="daily-swatch"
                style={{ background: c.hex }}
                onClick={() => copyText(c.hex, `已复制 ${c.hex}`)}
                aria-label={`复制 ${c.label} ${c.hex}`}
              >
                <span>
                  {c.label}
                  <br />
                  {c.hex}
                </span>
              </button>
            ))}
          </div>
          <div class="daily-side">
            <p class="daily-note">{dailyNote(selected)}</p>
            <p class="daily-desc">{current.description}</p>
            <div class="card-actions">
              <button
                type="button"
                class="btn primary sm"
                onClick={() => {
                  applyPaletteToStudio(current);
                  toast('已带回工作台');
                }}
              >
                用这套去工作台
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="最近 7 天" hint="点日期回看">
        <div class="daily-archive">
          {archive.map((item) => {
            const p = dailyPalette(item.date);
            return (
              <button
                type="button"
                key={item.date}
                class={`daily-day ${selected === item.date ? 'is-on' : ''}`}
                onClick={() => setSelected(item.date)}
              >
                <span class="daily-date">{shortDate(item.date)}</span>
                <span class="daily-strip" aria-hidden="true">
                  {p.colors.map((c) => (
                    <i key={c.role} style={{ background: c.hex }} />
                  ))}
                </span>
                <span class="daily-name">{displayName(p)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <ShareCardDialog
        open={shareOpen}
        palette={current}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
