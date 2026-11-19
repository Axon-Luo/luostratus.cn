import { ROLES } from '../core/palette/types';
import type { Palette } from '../core/palette/types';
import { paletteWithColors } from '../core/palette/custom';

/**
 * 工具页的独立调色条：只改当前页面，不回写工作台。
 * 需要“从工作台载入”时显式传入 onLoad。
 */
export function IndependentColors(props: {
  palette: Palette;
  onChange: (palette: Palette) => void;
  onLoad?: () => void;
}) {
  return (
    <div class="independent-colors">
      <div class="independent-head">
        <span class="hint">独立调色，不影响工作台</span>
        {props.onLoad && (
          <button type="button" class="btn ghost sm" onClick={props.onLoad}>
            从工作台载入
          </button>
        )}
      </div>
      <div class="independent-grid">
        {ROLES.map((role) => {
          const hex = props.palette.colors.find((c) => c.role === role.id)?.hex ?? '#000000';
          return (
            <label class="independent-color" key={role.id}>
              <span>{role.label}</span>
              <input
                type="color"
                value={hex.toLowerCase()}
                aria-label={`${role.label}独立基色`}
                onInput={(event) =>
                  props.onChange(
                    paletteWithColors(props.palette, {
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
  );
}
