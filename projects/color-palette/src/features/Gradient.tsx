import { useRef, useState } from 'preact/hooks';
import { activePalette, toast } from '../state';
import {
  GRADIENT_PRESETS,
  buildGradientCss,
  gradientStopsFromPalette,
  gradientTextSuggestion,
  normalizeGradient,
  randomGradientSpec,
  reverseStops,
  stopColorAt,
} from '../core/gradient';
import type { GradientStop, GradientType } from '../core/gradient';
import { GRADIENT_EXPORT_SIZES, exportGradientPng, gradientCssFile } from '../core/export/gradientPng';
import { Card, Chip, Switch } from '../ui/components';
import { copyText, downloadText } from './fileExport';

const FALLBACK_STOPS: GradientStop[] = [
  { id: 'a', hex: '#4A6CF7', pos: 0 },
  { id: 'b', hex: '#E8A33D', pos: 50 },
  { id: 'c', hex: '#2FA36B', pos: 100 },
];

const MAX_STOPS = 6;

export function Gradient() {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [cx, setCx] = useState(50);
  const [cy, setCy] = useState(50);
  const [stops, setStops] = useState<GradientStop[]>(() =>
    activePalette.value ? gradientStopsFromPalette(activePalette.value) : FALLBACK_STOPS,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [withText, setWithText] = useState(true);
  const [sizeId, setSizeId] = useState(GRADIENT_EXPORT_SIZES[0].id);
  const [exporting, setExporting] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const dialDrag = useRef(false);
  const seq = useRef(0);

  const value = normalizeGradient({ type, angle, cx, cy, stops });
  const css = buildGradientCss(value);
  const suggestion = gradientTextSuggestion(value);
  const railCss = `linear-gradient(90deg, ${value.stops.map((s) => `${s.hex} ${s.pos}%`).join(', ')})`;
  const size = GRADIENT_EXPORT_SIZES.find((s) => s.id === sizeId) ?? GRADIENT_EXPORT_SIZES[0];

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    setStops((old) => old.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));
  };

  const posFromClientX = (clientX: number): number => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
  };

  const addStopAt = (pos: number) => {
    if (stops.length >= MAX_STOPS) {
      toast(`最多 ${MAX_STOPS} 个色标`);
      return;
    }
    seq.current += 1;
    const id = `s${seq.current}`;
    setStops((old) => [...old, { id, hex: stopColorAt(value.stops, pos), pos }]);
    setSelected(id);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      toast('至少保留 2 个色标');
      return;
    }
    setStops((old) => old.filter((x) => x.id !== id));
    if (selected === id) setSelected(null);
  };

  const addAtLargestGap = () => {
    let pos = 50;
    let gap = -1;
    for (let i = 0; i < value.stops.length - 1; i += 1) {
      const d = value.stops[i + 1].pos - value.stops[i].pos;
      if (d > gap) {
        gap = d;
        pos = Math.round((value.stops[i].pos + value.stops[i + 1].pos) / 2);
      }
    }
    addStopAt(pos);
  };

  const applySpec = (spec: { type: GradientType; angle: number; cx?: number; cy?: number; stops: GradientStop[] }) => {
    setType(spec.type);
    setAngle(spec.angle);
    setCx(spec.cx ?? 50);
    setCy(spec.cy ?? 50);
    setStops(spec.stops.map((s) => ({ ...s })));
    setSelected(null);
  };

  const angleFromPointer = (clientX: number, clientY: number) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const deg = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
    setAngle((deg + 360) % 360);
  };

  const nudgeAngle = (delta: number) => setAngle((a) => (((a + delta) % 360) + 360) % 360);

  const onDialKey = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 15 : 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nudgeAngle(step);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nudgeAngle(-step);
    else if (event.key === 'Home') setAngle(0);
    else if (event.key === 'End') setAngle(359);
    else return;
    event.preventDefault();
  };

  const onHandleKey = (event: KeyboardEvent, stop: GradientStop) => {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') updateStop(stop.id, { pos: Math.min(100, stop.pos + step) });
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') updateStop(stop.id, { pos: Math.max(0, stop.pos - step) });
    else if (event.key === 'Home') updateStop(stop.id, { pos: 0 });
    else if (event.key === 'End') updateStop(stop.id, { pos: 100 });
    else if (event.key === 'Delete' || event.key === 'Backspace') removeStop(stop.id);
    else return;
    event.preventDefault();
  };

  const loadFromWorkbench = () => {
    if (activePalette.value) {
      setStops(gradientStopsFromPalette(activePalette.value));
      setSelected(null);
      toast('已载入工作台配色');
    }
  };

  const doExport = async () => {
    setExporting(true);
    const ok = await exportGradientPng(value, `配色工坊-渐变-${size.w}x${size.h}.png`, {
      width: size.w,
      height: size.h,
      withText,
    });
    setExporting(false);
    toast(ok ? 'PNG 已导出' : '导出失败：当前浏览器不支持画布');
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>渐变生成器</h1>
        <p>颜色完全独立，不会改动工作台方案；拖动色标轨、旋钮与滑杆即时预览，导出与所见一致</p>
      </header>

      <div class="gradient-layout">
        <Card
          title="预览"
          actions={
            <div class="card-actions">
              <button
                type="button"
                class="btn ghost sm"
                disabled={!activePalette.value}
                onClick={loadFromWorkbench}
              >
                从工作台载入
              </button>
              <a class="btn ghost sm" href="#/scales">
                色阶
              </a>
            </div>
          }
        >
          <div class="gradient-preview" style={{ background: css }}>
            {withText && (
              <>
                <strong style={{ color: suggestion.color }}>把生活调成喜欢的颜色</strong>
                <span style={{ color: suggestion.color }}>{css}</span>
              </>
            )}
          </div>

          <div
            class="gradient-rail"
            ref={railRef}
            style={{ background: railCss }}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('.gradient-handle')) return;
              addStopAt(posFromClientX(event.clientX));
            }}
          >
            {value.stops.map((stop) => (
              <button
                type="button"
                key={stop.id}
                class={`gradient-handle ${selected === stop.id ? 'is-selected' : ''}`}
                style={{ left: `${stop.pos}%`, background: stop.hex }}
                role="slider"
                aria-label={`色标 ${stop.hex} 位置`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stop.pos}
                aria-valuetext={`${stop.pos}%`}
                title={`${stop.hex} · ${stop.pos}%`}
                onClick={() => setSelected(stop.id)}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragId.current = stop.id;
                  setSelected(stop.id);
                }}
                onPointerMove={(event) => {
                  if (dragId.current === stop.id) updateStop(stop.id, { pos: posFromClientX(event.clientX) });
                }}
                onPointerUp={() => {
                  dragId.current = null;
                }}
                onKeyDown={(event) => onHandleKey(event, stop)}
              />
            ))}
          </div>
          <p class="hint gradient-rail-hint">拖动圆点改位置 · 点空白处加色标 · 选中后方向键微调、Delete 删除</p>

          <p class={`gradient-contrast ${suggestion.min >= 4.5 ? 'ok' : 'warn'}`}>
            推荐文字色 {suggestion.color === '#FFFFFF' ? '白色' : '深色'}，最差对比度 {suggestion.min.toFixed(2)}:1
            {suggestion.min < 4.5 ? '，小字建议加半透明底' : ''}
          </p>

          <Switch checked={withText} onChange={setWithText} label="文字叠加" desc="预览与导出 PNG 上的标语" />

          <div class="card-actions gradient-actions">
            <button type="button" class="btn ghost sm" onClick={() => copyText(css, '渐变 CSS 已复制')}>
              复制 CSS
            </button>
            <button type="button" class="btn ghost sm" disabled={exporting} onClick={() => void doExport()}>
              {exporting ? '导出中…' : '导出 PNG'}
            </button>
            <button
              type="button"
              class="btn ghost sm"
              onClick={() => downloadText('渐变.css', gradientCssFile(css), 'text/css')}
            >
              下载 CSS
            </button>
            <select
              aria-label="导出尺寸"
              value={sizeId}
              onChange={(event) => setSizeId((event.currentTarget as HTMLSelectElement).value)}
            >
              {GRADIENT_EXPORT_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div class="gradient-side">
          <Card title="调整" hint={`2–${MAX_STOPS} 个色标，颜色独立可改`}>
            <div class="field">
              <span class="field-label">类型</span>
              <div class="chips">
                {(
                  [
                    ['linear', '线性'],
                    ['radial', '径向'],
                    ['conic', '锥形'],
                  ] as Array<[GradientType, string]>
                ).map(([id, label]) => (
                  <Chip key={id} active={type === id} onClick={() => setType(id)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {type !== 'radial' && (
              <div class="field">
                <span class="field-label">角度</span>
                <div class="gradient-angle">
                  <div
                    class="gradient-dial"
                    ref={dialRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="渐变角度旋钮"
                    aria-valuemin={0}
                    aria-valuemax={359}
                    aria-valuenow={angle}
                    aria-valuetext={`${angle}°`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      dialDrag.current = true;
                      angleFromPointer(event.clientX, event.clientY);
                    }}
                    onPointerMove={(event) => {
                      if (dialDrag.current) angleFromPointer(event.clientX, event.clientY);
                    }}
                    onPointerUp={() => {
                      dialDrag.current = false;
                    }}
                    onKeyDown={onDialKey}
                  >
                    <span class="gradient-dial-needle" style={{ transform: `rotate(${angle}deg)` }} />
                  </div>
                  <div class="gradient-angle-controls">
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={angle}
                      aria-label="渐变角度"
                      onInput={(event) => setAngle(Number((event.currentTarget as HTMLInputElement).value))}
                    />
                    <div class="gradient-angle-read">
                      <input
                        type="number"
                        class="text-input num"
                        min="0"
                        max="359"
                        value={angle}
                        aria-label="渐变角度数值"
                        onInput={(event) => {
                          const n = Number((event.currentTarget as HTMLInputElement).value);
                          if (Number.isFinite(n)) setAngle(((Math.round(n) % 360) + 360) % 360);
                        }}
                      />
                      <span class="mono">deg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type !== 'linear' && (
              <div class="field">
                <span class="field-label">中心</span>
                <div class="gradient-center">
                  <label class="gradient-center-row">
                    <span class="mono">X</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cx}
                      aria-label="中心横向位置"
                      onInput={(event) => setCx(Number((event.currentTarget as HTMLInputElement).value))}
                    />
                    <span class="mono">{cx}%</span>
                  </label>
                  <label class="gradient-center-row">
                    <span class="mono">Y</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cy}
                      aria-label="中心纵向位置"
                      onInput={(event) => setCy(Number((event.currentTarget as HTMLInputElement).value))}
                    />
                    <span class="mono">{cy}%</span>
                  </label>
                </div>
              </div>
            )}

            <div class="gradient-stops">
              {stops.map((stop, index) => (
                <div
                  class={`gradient-stop ${selected === stop.id ? 'is-selected' : ''}`}
                  key={stop.id}
                  onClick={() => setSelected(stop.id)}
                >
                  <input
                    type="color"
                    value={stop.hex}
                    aria-label={`色标 ${index + 1} 颜色`}
                    onInput={(event) =>
                      updateStop(stop.id, { hex: (event.currentTarget as HTMLInputElement).value.toUpperCase() })
                    }
                  />
                  <div class="gradient-stop-meta">
                    <span class="mono">{stop.hex}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.pos}
                      aria-label={`色标 ${index + 1} 位置`}
                      onInput={(event) =>
                        updateStop(stop.id, { pos: Number((event.currentTarget as HTMLInputElement).value) })
                      }
                    />
                    <input
                      type="number"
                      class="text-input num"
                      min="0"
                      max="100"
                      value={stop.pos}
                      aria-label={`色标 ${index + 1} 位置数值`}
                      onInput={(event) => {
                        const n = Number((event.currentTarget as HTMLInputElement).value);
                        if (Number.isFinite(n)) updateStop(stop.id, { pos: Math.max(0, Math.min(100, Math.round(n))) });
                      }}
                    />
                  </div>
                  {stops.length > 2 && (
                    <button
                      type="button"
                      class="icon-btn"
                      aria-label={`删除色标 ${index + 1}`}
                      onClick={() => removeStop(stop.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div class="gradient-stop-actions">
              <button type="button" class="btn ghost" disabled={stops.length >= MAX_STOPS} onClick={addAtLargestGap}>
                + 添加色标
              </button>
              <button
                type="button"
                class="btn ghost"
                onClick={() => {
                  setStops((old) => reverseStops(old));
                  toast('色标位置已反转');
                }}
              >
                反转
              </button>
              <button
                type="button"
                class="btn ghost"
                onClick={() => {
                  applySpec(randomGradientSpec());
                  toast('已随机一套渐变');
                }}
              >
                随机灵感
              </button>
            </div>
          </Card>

          <Card title="快捷预设" hint="点一下整套载入，再微调">
            <div class="gradient-presets">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  class="preset-btn"
                  onClick={() => {
                    applySpec(preset.spec);
                    toast(`已载入预设「${preset.name}」`);
                  }}
                >
                  <span class="preset-strip" style={{ background: buildGradientCss(preset.spec) }} />
                  <span class="preset-name">{preset.name}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}