import { useEffect, useState } from 'preact/hooks';
import { CARD_OCCASIONS, cardTitle } from '../core/lifePlans';
import { CARD_STYLES, renderCardImage } from '../core/lifeSheets';
import type { CardStyle } from '../core/lifeSheets';
import { activePalette, toast } from '../state';
import type { Palette } from '../core/palette/types';
import { IndependentColors } from '../ui/IndependentColors';
import { Card, Empty } from '../ui/components';
import { downloadBlob } from './download';

export function CardPage() {
  const [base, setBase] = useState<Palette | null>(() => activePalette.value);
  const [occasion, setOccasion] = useState<string>(CARD_OCCASIONS[0]);
  const [style, setStyle] = useState<CardStyle>('classic');
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('愿你今天看到喜欢的颜色，也遇到想见的人');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!base) return;
    let canceled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const next = await renderCardImage({
          title: cardTitle(occasion),
          to,
          message,
          palette: base,
          style,
        });
        if (canceled) return;
        setBlob(next);
        const url = URL.createObjectURL(next);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      } catch {
        if (!canceled) toast('贺卡生成失败');
      } finally {
        if (!canceled) setBusy(false);
      }
    }, 200);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [base?.id, base?.updatedAt, occasion, style, to, message]);

  if (!base) {
    return (
      <div class="container page">
        <header class="page-head">
          <h1>礼物贺卡</h1>
          <p>先在工作台生成一套方案，再写祝福</p>
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

  return (
    <div class="container page">
      <header class="page-head">
        <h1>礼物贺卡</h1>
        <p>颜色可独立调，也可以从工作台载入；写一句想说的话，导出 3:4 贺卡</p>
      </header>

      <div class="card-layout">
        <Card title="预览">
          {preview ? (
            <img class="greeting-preview" src={preview} alt="贺卡预览" />
          ) : (
            <div class="share-card-placeholder">{busy ? '正在生成…' : '填写祝福后生成'}</div>
          )}
          <div class="card-actions">
            <button
              type="button"
              class="btn primary sm"
              disabled={!blob || busy}
              onClick={() => {
                if (blob) downloadBlob(blob, `配色工坊-贺卡-${occasion}-${style}.png`);
              }}
            >
              下载 PNG
            </button>

          </div>
        </Card>

        <Card title="内容">
          <IndependentColors
            palette={base}
            onChange={setBase}
            onLoad={() => {
              if (activePalette.value) setBase(activePalette.value);
            }}
          />
          <div class="field">
            <span class="field-label">样式</span>
            <div class="chips">
              {CARD_STYLES.map((item) => (
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
          <div class="field">
            <span class="field-label">场合</span>
            <div class="chips">
              {CARD_OCCASIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  class={`chip ${occasion === item ? 'is-on' : ''}`}
                  aria-pressed={occasion === item}
                  onClick={() => setOccasion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label class="field">
            <span class="field-label">送给</span>
            <input
              class="text-input"
              value={to}
              maxLength={20}
              placeholder="对方的名字"
              onInput={(event) => setTo((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span class="field-label">祝福</span>
            <textarea
              class="text-input card-message"
              rows={5}
              maxLength={120}
              value={message}
              onInput={(event) => setMessage((event.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
          <p class="hint">颜色与样式只作用于本页；需要时点上方「从工作台载入」</p>
        </Card>
      </div>
    </div>
  );
}
