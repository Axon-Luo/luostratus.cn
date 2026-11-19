import { useState } from 'preact/hooks';
import { TRADITIONAL_COLORS, TRAD_SERIES } from '../content/traditionalColors';
import { paletteFromColors } from '../core/import/parse';
import { nearestTraditional, searchTraditional } from '../core/traditional';
import { applyPaletteToStudio, toast } from '../state';
import { Card, Chip, ColorField, Empty } from '../ui/components';
import { copyText } from './fileExport';

export function TraditionalColors() {
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState('');
  const [probe, setProbe] = useState('#3B6CFF');
  const list = searchTraditional(query, series || undefined);
  const near = nearestTraditional(probe);

  const bring = () => {
    if (!near) return;
    const palette = paletteFromColors([near.color.hex], { name: near.color.name });
    if (!palette) return;
    applyPaletteToStudio(palette);
    toast('已带回工作台');
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>传统色字典</h1>
        <p>月白、黛蓝、缃色……按名字或色值翻一翻，也能拿任意色值查它最接近的传统叫法</p>
      </header>

      <Card title="查近色" hint="按 ΔE2000 找最接近的传统色">
        <div class="trad-probe">
          <ColorField label="你的颜色" value={probe} onChange={setProbe} />
          {near && (
            <div class="trad-nearest">
              <i style={{ background: near.color.hex }} aria-hidden="true" />
              <div class="trad-nearest-text">
                <strong>{near.color.name}</strong>
                <span class="mono">{near.color.hex}</span>
                <em class="hint">ΔE ≈ {near.distance.toFixed(1)}</em>
              </div>
              <button type="button" class="btn ghost sm" onClick={() => copyText(near.color.hex)}>
                复制
              </button>
              <button type="button" class="btn ghost sm" onClick={bring}>
                带回工作台
              </button>
            </div>
          )}
        </div>
      </Card>

      <div class="trad-tools">
        <input
          class="text-input"
          type="search"
          value={query}
          placeholder="搜名字或色值，如「月白」或 d6ecf0"
          aria-label="搜索传统色"
          onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
        />
        <div class="chips" role="group" aria-label="色系筛选">
          <Chip active={series === ''} onClick={() => setSeries('')}>
            全部 {TRADITIONAL_COLORS.length}
          </Chip>
          {TRAD_SERIES.map((s) => (
            <Chip key={s} active={series === s} onClick={() => setSeries(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty>没有匹配的传统色，换个词或色系试试</Empty>
      ) : (
        <div class="trad-grid">
          {list.map((c) => (
            <button
              type="button"
              class="trad-swatch"
              key={c.name}
              title={`复制 ${c.hex}`}
              onClick={() => copyText(c.hex, `已复制 ${c.name} ${c.hex}`)}
            >
              <i style={{ background: c.hex }} aria-hidden="true" />
              <strong>{c.name}</strong>
              <span class="mono">{c.hex}</span>
            </button>
          ))}
        </div>
      )}
      <p class="hint trad-note">当前 {list.length} 色 · 叫法与色值为流传近似版本，仅供灵感与命名参考</p>
    </div>
  );
}