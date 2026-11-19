import { displayName } from '../core/export/exporters';
import type { Palette } from '../core/palette/types';
import { applyPaletteToStudio, toast } from '../state';
import { Dialog } from '../ui/Dialog';

function metricRows(): Array<{ label: string; value: (p: Palette) => string }> {
  return [
    { label: '文字 / 背景', value: (p) => `${p.a11y.textOnBg.toFixed(2)}:1` },
    { label: '主色 / 背景', value: (p) => `${p.a11y.primaryOnBg.toFixed(2)}:1` },
    { label: '辅助色 / 背景', value: (p) => `${p.a11y.secondaryOnBg.toFixed(2)}:1` },
    { label: '强调色 / 背景', value: (p) => `${p.a11y.accentOnBg.toFixed(2)}:1` },
    { label: 'APCA Lc', value: (p) => p.a11y.apca.toFixed(1) },
    {
      label: '深色版 文字/背景',
      value: (p) => (p.darkA11y ? `${p.darkA11y.textOnBg.toFixed(2)}:1` : '未生成'),
    },
    {
      label: '色弱可分辨性',
      value: (p) => (p.cvd ? (p.cvd.safe ? '可分辨' : '偏近') : '未检测'),
    },
  ];
}

export function CompareDialog(props: {
  open: boolean;
  a: Palette;
  b: Palette;
  onClose: () => void;
}) {
  const sides = [props.a, props.b];

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="配色对比"
      wide
      footer={<span class="hint">指标来自各自的对比度检测，数值越高正文越易读</span>}
    >
      <div class="compare-grid">
        {sides.map((p) => (
          <section class="compare-side" key={p.id}>
            <h3>{displayName(p)}</h3>
            <div class="compare-strip" aria-hidden="true">
              {p.colors.map((c) => (
                <i key={c.role} style={{ background: c.hex }} />
              ))}
            </div>
            <button
              type="button"
              class="btn ghost sm"
              onClick={() => {
                props.onClose();
                applyPaletteToStudio(p);
                toast('已带回工作台');
              }}
            >
              带这套去工作台
            </button>
          </section>
        ))}
      </div>

      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">指标</th>
            <th scope="col">{displayName(props.a)}</th>
            <th scope="col">{displayName(props.b)}</th>
          </tr>
        </thead>
        <tbody>
          {metricRows().map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td class="mono">{row.value(props.a)}</td>
              <td class="mono">{row.value(props.b)}</td>
            </tr>
          ))}
          {props.a.colors.map((c, i) => (
            <tr key={c.role}>
              <th scope="row">{c.label}色值</th>
              <td class="mono">
                <i class="compare-dot" style={{ background: c.hex }} /> {c.hex}
              </td>
              <td class="mono">
                <i class="compare-dot" style={{ background: props.b.colors[i]?.hex ?? '#fff' }} />{' '}
                {props.b.colors[i]?.hex ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
