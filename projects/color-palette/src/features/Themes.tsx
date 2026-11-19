import { useState } from 'preact/hooks';
import { CITY_THEMES, SOLAR_THEMES } from '../content/themes';
import type { ThemePreset } from '../content/themes';
import { blindTheme, themePalette } from '../core/themes';
import { applyPaletteToStudio, toast } from '../state';
import { Card } from '../ui/components';

type Group = 'solar' | 'city' | 'blind';

function ThemeCard({ preset, onUse }: { preset: ThemePreset; onUse: () => void }) {
  const p = themePalette(preset);
  return (
    <article class="theme-card">
      <div class="theme-strip" aria-hidden="true">
        {p.colors.map((c) => (
          <i key={c.role} style={{ background: c.hex }} />
        ))}
      </div>
      <div class="theme-body">
        <div class="theme-title">
          <strong>{preset.name}</strong>
          <span>{p.colors[0]?.hex}</span>
        </div>
        <p class="theme-story">{preset.story}</p>
        <div class="theme-foot">
          <div class="theme-tags">
            {preset.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <button type="button" class="btn ghost sm" onClick={onUse}>
            用这套
          </button>
        </div>
      </div>
    </article>
  );
}

export function Themes() {
  const [group, setGroup] = useState<Group>('solar');
  const [blind, setBlind] = useState<ThemePreset>(() => blindTheme());
  const list = group === 'solar' ? SOLAR_THEMES : group === 'city' ? CITY_THEMES : [blind];

  return (
    <div class="container page">
      <header class="page-head">
        <h1>主题配色</h1>
        <p>从节气、城市或一个随机盲盒开始；每一套都能直接带回工作台继续调</p>
      </header>

      <div class="theme-tabs" role="tablist" aria-label="主题分组">
        {(
          [
            ['solar', `节气 ${SOLAR_THEMES.length}`],
            ['city', `城市 ${CITY_THEMES.length}`],
            ['blind', '盲盒'],
          ] as Array<[Group, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={group === id}
            class={`chip ${group === id ? 'is-on' : ''}`}
            onClick={() => setGroup(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {group === 'blind' && (
        <Card
          title="今天抽到什么"
          actions={
            <button type="button" class="btn ghost sm" onClick={() => setBlind(blindTheme())}>
              换一个
            </button>
          }
        >
          <p class="theme-blind-hint">随机也是一次练习：先看它像什么，再决定要不要用</p>
        </Card>
      )}

      <div class="theme-grid">
        {list.map((preset) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            onUse={() => {
              applyPaletteToStudio(themePalette(preset));
              toast('已带回工作台');
            }}
          />
        ))}
      </div>
    </div>
  );
}
