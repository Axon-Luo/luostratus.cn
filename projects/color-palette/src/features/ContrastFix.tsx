import { useState } from 'preact/hooks';
import { CONTRAST_TARGETS, fixContrast, maxContrast } from '../core/contrastFix';
import type { ContrastTarget } from '../core/contrastFix';
import { contrastRatio, deltaE2000 } from '../core/color';
import { toast } from '../state';
import { Card, Chip, ColorField } from '../ui/components';
import { copyText } from './fileExport';

function FixRow(props: {
  label: string;
  original: string;
  against: string;
  fixed: string | null;
  onApply: (hex: string) => void;
}) {
  const fixed = props.fixed;
  return (
    <div class="fix-row">
      <span class="fix-label">{props.label}</span>
      {fixed ? (
        <>
          <i style={{ background: fixed }} aria-hidden="true" />
          <span class="mono">{fixed}</span>
          <em class="hint">ΔE ≈ {deltaE2000(props.original, fixed).toFixed(1)}</em>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => {
              props.onApply(fixed);
              toast(`已应用${props.label}`);
            }}
          >
            应用
          </button>
          <button type="button" class="btn ghost sm" onClick={() => copyText(fixed)}>
            复制
          </button>
        </>
      ) : (
        <span class="hint">不可达：这一侧理论上限 {maxContrast(props.against).toFixed(2)} : 1</span>
      )}
    </div>
  );
}

export function ContrastFix() {
  const [fg, setFg] = useState('#8A8A93');
  const [bg, setBg] = useState('#FFFFFF');
  const [target, setTarget] = useState<ContrastTarget>(CONTRAST_TARGETS[0]);
  const ratio = contrastRatio(fg, bg);
  const fixedFg = fixContrast(fg, bg, target.ratio);
  const fixedBg = fixContrast(bg, fg, target.ratio);

  return (
    <div class="container page">
      <header class="page-head">
        <h1>对比度修复器</h1>
        <p>先判 WCAG 达不达标，再给「离原色最近」的达标修正色；色相彩度不动，只推移明度</p>
      </header>

      <Card
        title="前景与背景"
        actions={
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => {
              setFg(bg);
              setBg(fg);
            }}
          >
            交换
          </button>
        }
      >
        <div class="mix-inputs">
          <ColorField label="前景 / 文字" value={fg} onChange={setFg} />
          <ColorField label="背景" value={bg} onChange={setBg} />
        </div>
      </Card>

      <Card title="当前对比度" hint={`修复目标：${target.label} ≥ ${target.ratio} : 1`}>
        <div class="contrast-score">
          <strong class="mono">{ratio.toFixed(2)} : 1</strong>
          <div class="contrast-badges">
            {CONTRAST_TARGETS.map((t) => (
              <span class={`badge ${ratio >= t.ratio ? 'ok' : 'bad'}`} key={t.id}>
                {t.label} {ratio >= t.ratio ? '过' : '不过'}
              </span>
            ))}
          </div>
        </div>
        <div class="contrast-preview" style={{ background: bg, color: fg }} aria-hidden="true">
          <p class="contrast-large">大字示例：把生活调成喜欢的颜色</p>
          <p>正文示例：配色工坊 · 生活调色盘，30 秒从照片到一套能用的配色</p>
        </div>
        <div class="chips" role="group" aria-label="修复目标">
          {CONTRAST_TARGETS.map((t) => (
            <Chip key={t.id} active={target.id === t.id} onClick={() => setTarget(t)}>
              {t.label} {t.ratio}
            </Chip>
          ))}
        </div>
      </Card>

      <Card title="一键修复" hint="保持色相与彩度，只把明度推到最近的达标点">
        <div class="fix-rows">
          <FixRow label="修前景" original={fg} against={bg} fixed={fixedFg} onApply={setFg} />
          <FixRow label="修背景" original={bg} against={fg} fixed={fixedBg} onApply={setBg} />
        </div>
      </Card>
    </div>
  );
}