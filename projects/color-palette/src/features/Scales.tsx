import { useState } from 'preact/hooks';
import { activePalette, favorites } from '../state';
import type { Palette } from '../core/palette/types';
import { ROLES } from '../core/palette/types';
import { SCALE_STEPS, buildSemanticTokens } from '../core/palette/scale';
import { TOKEN_FORMATS, buildTokens, tokenText } from '../core/export/tokens';
import type { TokenFormat } from '../core/export/tokens';
import { displayName } from '../core/export/exporters';
import { paletteWithColors } from '../core/palette/custom';
import { Card, Empty, Tabs } from '../ui/components';
import { copyText, downloadText } from './fileExport';

function paletteLabel(p: Palette): string {
  return `${displayName(p)} · ${p.scene}`;
}

export function Scales() {
  const [format, setFormat] = useState<TokenFormat>('css');
  const [selectedId, setSelectedId] = useState('');
  const [custom, setCustom] = useState<Palette | null>(null);
  const active = activePalette.value;
  const list: Palette[] = [];
  if (active) list.push(active);
  for (const p of favorites.value) {
    if (!list.some((x) => x.id === p.id)) list.push(p);
  }
  const base = list.find((p) => p.id === selectedId) ?? list[0] ?? null;
  const current = custom ?? base;

  if (!current) {
    return (
      <div class="container page">
        <header class="page-head">
          <h1>色阶与令牌</h1>
          <p>先在工作台生成或收藏一套方案</p>
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

  const tokens = buildTokens(current);
  const semantic = buildSemanticTokens(current.colors.find((c) => c.role === 'bg')?.hex ?? '#FFFFFF');
  const code = tokenText(current, format);
  const info = TOKEN_FORMATS.find((f) => f.id === format) ?? TOKEN_FORMATS[0];

  return (
    <div class="container page">
      <header class="page-head">
        <h1>色阶与令牌</h1>
        <p>6 个颜色 × 11 档色阶 + 语义色，可直接复制或导出到设计/开发工具</p>
      </header>

      <Card
        title="色阶与基色"
        hint="6 个基色可独立调色"
        actions={
          <div class="card-actions">
            <select
              class="text-input library-mode"
              value={base?.id ?? ''}
              aria-label="载入已有方案"
              onChange={(event) => {
                setSelectedId((event.currentTarget as HTMLSelectElement).value);
                setCustom(null);
              }}
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {paletteLabel(p)}
                </option>
              ))}
            </select>
            <a class="btn ghost sm" href="#/gradient">
              渐变
            </a>
            <a class="btn ghost sm" href="#/studio">
              回工作台
            </a>
          </div>
        }
      >
        <div class="scale-custom">
          <span class="hint">独立调色，不影响工作台</span>
          <div class="scale-colors">
            {ROLES.map((role) => {
              const hex = current.colors.find((c) => c.role === role.id)?.hex ?? '#000000';
              return (
                <label class="scale-color" key={role.id}>
                  <span>{role.label}</span>
                  <input
                    type="color"
                    value={hex.toLowerCase()}
                    aria-label={`${role.label}基色`}
                    onInput={(event) =>
                      setCustom(
                        paletteWithColors(current, {
                          [role.id]: (event.currentTarget as HTMLInputElement).value,
                        }),
                      )
                    }
                  />
                  <em class="mono">{hex}</em>
                </label>
              );
            })}
          </div>
        </div>

        <div class="scale-list">
          <div class="scale-row scale-head" aria-hidden="true">
            <span class="scale-label" />
            <div class="scale-steps">
              {SCALE_STEPS.map((step) => (
                <span key={step} class="scale-num">
                  {step}
                </span>
              ))}
            </div>
          </div>
          {ROLES.map((role) => {
            const scale = tokens.scales[role.id];
            return (
              <div class="scale-row" key={role.id}>
                <span class="scale-label">{role.label}</span>
                <div class="scale-steps">
                  {SCALE_STEPS.map((step) => {
                    const hex = scale[step];
                    return (
                      <button
                        type="button"
                        key={step}
                        class="scale-step"
                        style={{ background: hex }}
                        title={`${hex} · 点击复制`}
                        aria-label={`${role.label} ${step} ${hex}`}
                        onClick={() => copyText(hex, `已复制 ${hex}`)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div class="scale-row">
            <span class="scale-label">语义色</span>
            <div class="semantic-row">
              {(['success', 'warning', 'danger', 'info'] as const).map((key) => (
                <button
                  type="button"
                  key={key}
                  class="semantic-swatch"
                  style={{ background: semantic[key] }}
                  title={`${key} ${semantic[key]}`}
                  onClick={() => copyText(semantic[key], `已复制 ${semantic[key]}`)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="设计令牌"
        hint="复制或下载整套令牌，含色阶、语义色与深色块"
        actions={
          <div class="card-actions">
            <button type="button" class="btn ghost sm" onClick={() => copyText(code, '令牌已复制')}>
              复制
            </button>
            <button
              type="button"
              class="btn ghost sm"
              onClick={() =>
                downloadText(
                  `配色工坊-${displayName(current)}-${format}.${info.ext}`,
                  code,
                  info.ext === 'json' ? 'application/json' : 'text/plain',
                )
              }
            >
              下载 {info.label}
            </button>
          </div>
        }
      >
        <Tabs
          small
          options={TOKEN_FORMATS.map((f) => ({ id: f.id, label: f.label }))}
          value={format}
          onChange={(id) => setFormat(id as TokenFormat)}
        />
        <pre class="token-code" tabIndex={0}>{code}</pre>
      </Card>
    </div>
  );
}
