import { useState } from 'preact/hooks';
import { paletteFromColors } from '../core/import/parse';
import { mixLight, mixPigment } from '../core/mix';
import { applyPaletteToStudio, toast } from '../state';
import { Card, Chip, ColorField } from '../ui/components';
import { copyText } from './fileExport';

const PRESETS = [0, 25, 50, 75, 100];

export function MixLab() {
  const [a, setA] = useState('#E4572E');
  const [b, setB] = useState('#2E6FE4');
  const [t, setT] = useState(50);
  const pigment = mixPigment(a, b, t / 100);
  const light = mixLight(a, b, t / 100);

  const bring = () => {
    const palette = paletteFromColors([a, pigment, b, light], { name: '混色实验' });
    if (!palette) return;
    applyPaletteToStudio(palette);
    toast('已带回工作台');
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>混色实验室</h1>
        <p>同两个颜色、同一条比例，颜料和光会混出完全不同的结果；动手看看差在哪</p>
      </header>

      <Card
        title="两种颜色"
        actions={
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => {
              setA(b);
              setB(a);
            }}
          >
            交换
          </button>
        }
      >
        <div class="mix-inputs">
          <ColorField label="颜色 A" value={a} onChange={setA} />
          <ColorField label="颜色 B" value={b} onChange={setB} />
        </div>
        <div class="mix-ratio">
          <label class="hint" for="mix-ratio">
            混合比例：A {100 - t}% ／ B {t}%
          </label>
          <input
            id="mix-ratio"
            type="range"
            min={0}
            max={100}
            step={1}
            value={t}
            onInput={(event) => setT(Number((event.currentTarget as HTMLInputElement).value))}
          />
          <div class="chips">
            {PRESETS.map((v) => (
              <Chip key={v} active={t === v} onClick={() => setT(v)}>
                B {v}%
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <div class="mix-results">
        {[
          { name: '颜料混合', hex: pigment, hint: '减色：每加一种颜料，就多吸收一段光，越混越暗越浊' },
          { name: '光混合', hex: light, hint: '加色：两束光在线性亮度里叠加，越混越亮' },
        ].map((item) => (
          <article class="mix-card" key={item.name}>
            <div class="mix-swatch" style={{ background: item.hex }} aria-hidden="true" />
            <div class="mix-body">
              <div class="mix-title">
                <strong>{item.name}</strong>
                <span class="mono">{item.hex}</span>
              </div>
              <p class="hint">{item.hint}</p>
              <button type="button" class="btn ghost sm" onClick={() => copyText(item.hex)}>
                复制色值
              </button>
            </div>
          </article>
        ))}
      </div>

      <Card title="和渐变有什么不同">
        <p class="hint">
          渐变生成器做的是两色插值（中途经过灰浊的中间色）；这里颜料混合走 Kubelka-Munk
          吸收/散射近似，光混合走线性亮度加权，三者中点各不相同，课堂「色彩模型」一篇有推导
        </p>
        <button type="button" class="btn primary" onClick={bring}>
          带回工作台
        </button>
      </Card>
    </div>
  );
}