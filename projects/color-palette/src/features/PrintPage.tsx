import { useEffect, useState } from 'preact/hooks';
import { PRINT_STYLES, renderPrintSheet } from '../core/lifeSheets';
import type { PrintSheet, PrintSize, PrintStyle } from '../core/lifeSheets';
import { activePalette, favorites, toast } from '../state';
import type { Palette } from '../core/palette/types';
import { displayName } from '../core/export/exporters';
import { Card, Empty } from '../ui/components';
import { IndependentColors } from '../ui/IndependentColors';
import { downloadBlob } from './download';

export function PrintPage() {
  const [selectedId, setSelectedId] = useState('');
  const [custom, setCustom] = useState<Palette | null>(null);
  const [sheet, setSheet] = useState<PrintSheet>('swatches');
  const [style, setStyle] = useState<PrintStyle>('list');
  const [size, setSize] = useState<PrintSize>('A4');
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const list: Palette[] = [];
  if (activePalette.value) list.push(activePalette.value);
  for (const p of favorites.value) if (!list.some((x) => x.id === p.id)) list.push(p);
  const base = list.find((p) => p.id === selectedId) ?? list[0] ?? null;
  const current = custom ?? base;

  useEffect(() => {
    if (!current) return;
    let canceled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const next = await renderPrintSheet(current, sheet, size, style);
        if (canceled) return;
        setBlob(next);
        const url = URL.createObjectURL(next);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      } catch {
        if (!canceled) toast('打印页生成失败');
      } finally {
        if (!canceled) setBusy(false);
      }
    }, 200);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [current?.id, current?.updatedAt, sheet, style, size]);

  if (!current) {
    return (
      <div class="container page">
        <header class="page-head">
          <h1>打印色卡</h1>
          <p>先在工作台生成一套方案</p>
        </header>
        <Card title="还没有方案">
          <Empty>
            <a class="link" href="#/studio">
              去工作台生成一套
            </a>
          </Empty>
        </Card>
      </div>
    );
  }

  const print = () => {
    if (!preview) return;
    const win = window.open('', '_blank');
    if (!win) {
      toast('浏览器拦截了打印窗口，请允许弹窗');
      return;
    }
    win.document.write(
      `<html><head><title>打印</title><style>body{margin:0}img{width:100%;display:block}@media print{@page{margin:0}}</style></head><body><img src="${preview}" onload="window.print()" /></body></html>`,
    );
    win.document.close();
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>打印色卡</h1>
        <p>150dpi 的 A4 / A5 打印页，带裁切线；色卡四种版式，颜色可独立调，也可以从工作台/收藏载入</p>
      </header>

      <div class="print-layout">
        <Card title="预览">
          {preview ? (
            <img class="print-preview" src={preview} alt="打印页预览" />
          ) : (
            <div class="share-card-placeholder">{busy ? '正在生成…' : '载入或调色后生成'}</div>
          )}
          <div class="card-actions">
            <button
              type="button"
              class="btn primary sm"
              disabled={!blob || busy}
              onClick={() =>
                blob &&
                downloadBlob(
                  blob,
                  sheet === 'swatches'
                    ? `配色工坊-swatches-${style}-${size}.png`
                    : `配色工坊-${sheet}-${size}.png`,
                )
              }
            >
              下载 PNG
            </button>
            <button type="button" class="btn ghost sm" onClick={print}>
              打印
            </button>
          </div>
        </Card>

        <Card title="设置">
          <label class="field">
            <span class="field-label">方案</span>
            <select
              class="text-input"
              value={base?.id ?? ''}
              onChange={(event) => {
                setSelectedId((event.currentTarget as HTMLSelectElement).value);
                setCustom(null);
              }}
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayName(p)}
                </option>
              ))}
            </select>
          </label>

          <IndependentColors
            palette={current}
            onChange={setCustom}
            onLoad={() => {
              if (activePalette.value) {
                setCustom(null);
                setSelectedId(activePalette.value.id);
              }
            }}
          />

          <div class="field">
            <span class="field-label">内容</span>
            <div class="chips">
              <button
                type="button"
                class={`chip ${sheet === 'swatches' ? 'is-on' : ''}`}
                aria-pressed={sheet === 'swatches'}
                onClick={() => setSheet('swatches')}
              >
                色卡
              </button>
              <button
                type="button"
                class={`chip ${sheet === 'room' ? 'is-on' : ''}`}
                aria-pressed={sheet === 'room'}
                onClick={() => setSheet('room')}
              >
                房间清单
              </button>
            </div>
          </div>

          {sheet === 'swatches' && (
            <div class="field">
              <span class="field-label">版式</span>
              <div class="chips">
                {PRINT_STYLES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    class={`chip ${style === item.id ? 'is-on' : ''}`}
                    aria-pressed={style === item.id}
                    title={item.desc}
                    onClick={() => setStyle(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div class="field">
            <span class="field-label">纸张</span>
            <div class="chips">
              {(['A4', 'A5'] as PrintSize[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  class={`chip ${size === id ? 'is-on' : ''}`}
                  aria-pressed={size === id}
                  onClick={() => setSize(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <p class="hint">CMYK 为近似值，正式印刷请以打样为准</p>
        </Card>
      </div>
    </div>
  );
}
