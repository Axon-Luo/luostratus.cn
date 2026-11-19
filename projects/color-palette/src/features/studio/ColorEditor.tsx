import { useEffect, useRef, useState } from 'preact/hooks';
import { clamp, hexToHsl, hexToRgb, hslToHex, normalizeHex } from '../../core/color/convert';
import { Dialog } from '../../ui/Dialog';
import type { Palette, Role } from '../../core/palette/types';

export function ColorEditor(props: {
  open: boolean;
  palette: Palette;
  role: Role;
  initialHex: string;
  onClose: () => void;
  onChange: (hex: string) => void;
  onRegenerate: () => void;
}) {
  const [hex, setHex] = useState(props.initialHex);
  const [text, setText] = useState(props.initialHex);
  const [error, setError] = useState('');
  const initialRef = useRef(props.initialHex);

  useEffect(() => {
    if (!props.open) return;
    initialRef.current = props.initialHex;
    setHex(props.initialHex);
    setText(props.initialHex);
    setError('');
  }, [props.open, props.initialHex, props.role]);

  const entry = props.palette.colors.find((c) => c.role === props.role);
  const hsl = hexToHsl(hex);
  const rgb = hexToRgb(hex);

  const updateLocal = (next: string) => {
    setHex(next);
    setText(next);
    setError('');
  };

  const commit = (next: string) => {
    const normalized = normalizeHex(next);
    if (!normalized) {
      setError('格式不正确');
      return;
    }
    updateLocal(normalized);
    props.onChange(normalized);
  };

  const setChannel = (h: number, s: number, l: number) => {
    const next = hslToHex({ h, s: clamp(s, 0, 100), l: clamp(l, 0, 100) });
    setHex(next);
    setText(next);
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={`调整${entry?.label ?? '颜色'}`}
      footer={
        <>
          <button
            type="button"
            class="btn ghost"
            onClick={() => {
              setHex(initialRef.current);
              setText(initialRef.current);
              props.onChange(initialRef.current);
            }}
          >
            还原
          </button>
          <button
            type="button"
            class="btn ghost"
            onClick={() => {
              props.onChange(hex);
              props.onRegenerate();
            }}
          >
            让其它颜色适配
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => {
              commit(text);
              props.onClose();
            }}
          >
            完成
          </button>
        </>
      }
    >
      <div class="editor-preview">
        <span class="editor-swatch" style={{ background: hex }} />
        <div>
          <strong class="mono">{hex}</strong>
          <span class="hint">
            {entry?.name ?? ''} · 修改后会自动锁定这个颜色
          </span>
        </div>
      </div>

      <div class="field">
        <span class="field-label">HEX</span>
        <div class="input-row">
          <input
            class="text-input"
            value={text}
            spellcheck={false}
            aria-label="颜色值"
            onInput={(event) => setText((event.currentTarget as HTMLInputElement).value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(text);
              }
            }}
            onBlur={() => {
              if (normalizeHex(text)) commit(text);
            }}
          />
          <button type="button" class="btn ghost sm" onClick={() => commit(text)}>
            应用
          </button>
        </div>
        {error && <p class="error">{error}</p>}
      </div>

      <div class="editor-sliders">
        <label>
          <span>色相</span>
          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(hsl.h)}
            onInput={(event) => setChannel(Number((event.currentTarget as HTMLInputElement).value), hsl.s, hsl.l)}
            onChange={(event) => {
              const next = hslToHex({ h: Number((event.currentTarget as HTMLInputElement).value), s: hsl.s, l: hsl.l });
              setHex(next);
              setText(next);
              props.onChange(next);
            }}
          />
          <b class="mono">{Math.round(hsl.h)}°</b>
        </label>
        <label>
          <span>饱和</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(hsl.s)}
            onInput={(event) => setChannel(hsl.h, Number((event.currentTarget as HTMLInputElement).value), hsl.l)}
            onChange={(event) => {
              const next = hslToHex({ h: hsl.h, s: Number((event.currentTarget as HTMLInputElement).value), l: hsl.l });
              setHex(next);
              setText(next);
              props.onChange(next);
            }}
          />
          <b class="mono">{Math.round(hsl.s)}%</b>
        </label>
        <label>
          <span>明度</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(hsl.l)}
            onInput={(event) => setChannel(hsl.h, hsl.s, Number((event.currentTarget as HTMLInputElement).value))}
            onChange={(event) => {
              const next = hslToHex({ h: hsl.h, s: hsl.s, l: Number((event.currentTarget as HTMLInputElement).value) });
              setHex(next);
              setText(next);
              props.onChange(next);
            }}
          />
          <b class="mono">{Math.round(hsl.l)}%</b>
        </label>
      </div>

      <div class="editor-meta mono">
        RGB {rgb.r}, {rgb.g}, {rgb.b}
      </div>
    </Dialog>
  );
}
