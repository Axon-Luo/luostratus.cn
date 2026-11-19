import { useState } from 'preact/hooks';
import { CASES } from '../content/cases';
import { SCENES } from '../content/presets';
import { casePalette } from '../core/cases';
import { applyPaletteToStudio, toast } from '../state';

export function Cases() {
  const [filter, setFilter] = useState('all');
  const scenes = [...new Set(CASES.map((c) => c.scene))];
  const list = filter === 'all' ? CASES : CASES.filter((c) => c.scene === filter);

  return (
    <div class="container page">
      <header class="page-head">
        <h1>生活案例</h1>
        <p>8 个真实场景的配色起点：每个都写了为什么这样配，点「用这个方案」继续改</p>
      </header>

      <div class="case-filters">
        <button
          type="button"
          class={`chip ${filter === 'all' ? 'is-on' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          全部 {CASES.length}
        </button>
        {scenes.map((scene) => (
          <button
            type="button"
            key={scene}
            class={`chip ${filter === scene ? 'is-on' : ''}`}
            aria-pressed={filter === scene}
            onClick={() => setFilter(scene)}
          >
            {SCENES.find((s) => s.id === scene)?.label ?? scene}
          </button>
        ))}
      </div>

      <div class="case-grid">
        {list.map((item) => {
          const p = casePalette(item);
          return (
            <article class="case-card" key={item.id}>
              <div class="case-strip" aria-hidden="true">
                {p.colors.map((c) => (
                  <i key={c.role} style={{ background: c.hex }} />
                ))}
              </div>
              <div class="case-body">
                <div class="case-head">
                  <strong>{item.title}</strong>
                  <span class="case-scene">{SCENES.find((s) => s.id === item.scene)?.label}</span>
                </div>
                <p>{item.story}</p>
                <div class="case-foot">
                  <div class="theme-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    class="btn ghost sm"
                    onClick={() => {
                      applyPaletteToStudio(p);
                      toast('已带回工作台');
                    }}
                  >
                    用这个方案
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
