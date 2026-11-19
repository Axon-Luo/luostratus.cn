import { useMemo, useState } from 'preact/hooks';
import { buildRoomSchemes } from '../core/lifePlans';
import { renderRoomImage } from '../core/lifeSheets';
import { activePalette, applyPaletteToStudio, toast } from '../state';
import type { Palette } from '../core/palette/types';
import { Card, Empty } from '../ui/components';
import { IndependentColors } from '../ui/IndependentColors';
import { downloadBlob } from './download';

export function Room() {
  const [base, setBase] = useState<Palette | null>(() => activePalette.value);
  const schemes = useMemo(() => (base ? buildRoomSchemes(base) : []), [base]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const scheme = schemes[selected] ?? schemes[0];

  if (!base || !scheme) {
    return (
      <div class="container page">
        <header class="page-head">
          <h1>房间刷色</h1>
          <p>先在工作台生成一套方案，再分配墙面、地面和家具</p>
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

  const exportPng = async () => {
    setBusy(true);
    try {
      downloadBlob(await renderRoomImage(scheme), `配色工坊-房间清单-${scheme.name}.png`);
    } catch {
      toast('图片生成失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>房间刷色</h1>
        <p>按 45/25/15/10/5 的面积比例分配颜色，先看小面积，再决定要不要刷墙</p>
      </header>

      <Card
        title="方案"
        hint="独立调色，可切三套分配"
        actions={
          <div class="card-actions">
            <button type="button" class="btn ghost sm" onClick={() => setSelected((v) => (v + 1) % schemes.length)}>
              换一套
            </button>
            <button type="button" class="btn primary sm" disabled={busy} onClick={exportPng}>
              导出 A4 清单
            </button>
          </div>
        }
      >
        <IndependentColors
          palette={base}
          onChange={setBase}
          onLoad={() => {
            if (activePalette.value) setBase(activePalette.value);
          }}
        />
        <div class="room-tabs">
          {schemes.map((item, index) => (
            <button
              type="button"
              key={item.id}
              class={`chip ${selected === index ? 'is-on' : ''}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div class="room-preview" aria-hidden="true">
          <div class="room-wall" style={{ background: scheme.surfaces[0].hex }} />
          <div class="room-floor" style={{ background: scheme.surfaces[1].hex }} />
          <div class="room-sofa" style={{ background: scheme.surfaces[2].hex }} />
          <div class="room-curtain" style={{ background: scheme.surfaces[3].hex }} />
          <div class="room-decor" style={{ background: scheme.surfaces[4].hex }} />
        </div>

        <div class="room-list">
          {scheme.surfaces.map((surface) => (
            <div class="room-row" key={surface.id}>
              <i style={{ background: surface.hex }} />
              <span class="room-label">{surface.label}</span>
              <span class="mono">{surface.hex}</span>
              <span class="room-area">{surface.area}%</span>
            </div>
          ))}
        </div>

        <div class="card-actions room-actions">
          <button
            type="button"
            class="btn primary sm"
            onClick={() => {
              applyPaletteToStudio(scheme.palette);
              toast('已带回工作台');
            }}
          >
            用这套去工作台
          </button>
          <span class="hint">小面积先试：抱枕、窗帘、床品比整面墙更容易验证</span>
        </div>
      </Card>
    </div>
  );
}
