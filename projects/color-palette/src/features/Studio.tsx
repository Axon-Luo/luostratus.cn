import { useEffect, useRef, useState } from 'preact/hooks';
import {
  hexToHsl,
  hexToRgb,
  hslToHex,
  parseColor,
  rgbToHex,
  textOn,
  withAlpha,
} from '../core/color/convert';
import type { RGB } from '../core/color/convert';
import { CVD_OPTIONS } from '../core/color/cvd';
import { extractColors, pickBaseColor } from '../core/image/quantize';
import { pickScreenColor, supportsEyeDropper } from '../core/capture';
import { cmykLabel } from '../core/cmyk';
import { paletteForTheme } from '../core/palette/generate';
import { toColorMap } from '../core/palette/types';
import type { Palette, Role } from '../core/palette/types';
import { shareUrl } from '../core/share';
import { displayName } from '../core/export/exporters';
import { HARMONIES, HARMONY_LABEL, MOODS, ROLES, SCENES, SCENE_MAP, STYLES } from '../content/presets';
import type { ColorFormat } from '../content/presets';
import {
  activeId,
  activePalette,
  applyPaletteToStudio,
  cvdType,
  favorites,
  generateNow,
  history,
  imageColors,
  imageUrl,
  lockMap,
  palettes,
  previewTheme,
  regenerateAroundLocks,
  repairActive,
  restorePalette,
  renamePalette,
  selectPalette,
  setBaseColor,
  setCvd,
  settings,
  setPreview,
  setSetting,
  sharedFrom,
  storageWarning,
  toast,
  toggleFavorite,
  toggleLock,
  deleteFavorite,
  undoState,
  undoWorkspace,
  redoWorkspace,
  updatePaletteColor,
} from '../state';
import type { PreviewMode } from '../core/storage';
import { Card, Chip, Empty, Icon, Switch, Tabs } from '../ui/components';
import { Preview, applyCvd } from './previews';
import { copyText, exportPalette } from './fileExport';
import { ColorEditor } from './studio/ColorEditor';
import { ImportDialog } from './studio/ImportDialog';
import { ShareCardDialog } from './studio/ShareCardDialog';
import { CameraDialog } from './studio/CameraDialog';
import { MoodboardDialog } from './studio/MoodboardDialog';
import { SceneChecklistDialog } from './studio/SceneChecklistDialog';
import { AuditReportDialog } from './studio/AuditReportDialog';

/* ---------- 小工具 ---------- */

function formatValue(hex: string, format: ColorFormat): string {
  if (format === 'RGB') {
    const c = hexToRgb(hex);
    return `${c.r}, ${c.g}, ${c.b}`;
  }
  if (format === 'HSL') {
    const c = hexToHsl(hex);
    return `${c.h}, ${c.s}, ${c.l}`;
  }
  return hex;
}

function parseByFormat(text: string, format: ColorFormat): RGB | null {
  const raw = text.trim();
  if (!raw) return null;
  if (format === 'RGB') {
    const m = raw.match(/^(\d{1,3})\s*[,，\s]\s*(\d{1,3})\s*[,，\s]\s*(\d{1,3})$/);
    if (!m) return null;
    const rgb = { r: +m[1], g: +m[2], b: +m[3] };
    if ([rgb.r, rgb.g, rgb.b].some((v) => v < 0 || v > 255)) return null;
    return rgb;
  }
  if (format === 'HSL') {
    const m = raw.match(/^(\d{1,3})\s*[,，\s]\s*(\d{1,3})\s*[,，\s]\s*(\d{1,3})$/);
    if (!m) return null;
    const h = +m[1];
    const s = +m[2];
    const l = +m[3];
    if (h > 360 || s > 100 || l > 100) return null;
    return parseColor(`hsl(${h}, ${s}%, ${l}%)`);
  }
  return parseColor(raw);
}

function sceneLabel(id: string): string {
  return SCENES.find((s) => s.id === id)?.label ?? '生活';
}

/* ---------- 图片取色 ---------- */

// 同一张图只在首次加载时自动提取主色；离开再回来不重置用户后来选的颜色。
let extractedCache: { url: string; colors: string[] } | null = null;

function ImagePicker(props: {
  url: string;
  onExtract: (colors: string[]) => void;
  onPick: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number; hex: string } | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !props.url) return;
    let canceled = false;
    const img = new Image();
    img.onload = () => {
      if (canceled) return;
      const max = 1100;
      const scale = Math.min(1, max / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      const q = document.createElement('canvas');
      q.width = Math.min(160, w);
      q.height = Math.max(1, Math.round((q.width * h) / w));
      const qc = q.getContext('2d');
      if (qc) {
        if (extractedCache?.url === props.url) {
          imageColors.value = extractedCache.colors;
          return;
        }
        qc.drawImage(img, 0, 0, q.width, q.height);
        const data = qc.getImageData(0, 0, q.width, q.height);
        const colors = extractColors(data.data, q.width, q.height);
        extractedCache = { url: props.url, colors };
        props.onExtract(colors);
      }
    };
    img.src = props.url;
    return () => {
      canceled = true;
    };
  }, [props.url]);

  const readAt = (clientX: number, clientY: number) => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const rect = cv.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * cv.width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * cv.height);
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return null;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { hex: rgbToHex({ r: d[0], g: d[1], b: d[2] }), x, y };
  };

  return (
    <div class="picker">
      <div
        class="picker-frame"
        onPointerMove={(e) => {
          const hit = readAt(e.clientX, e.clientY);
          if (!hit) {
            setLoupe(null);
            return;
          }
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setLoupe({ x: e.clientX - rect.left, y: e.clientY - rect.top, hex: hit.hex });
        }}
        onPointerLeave={() => setLoupe(null)}
        onClick={(e) => {
          const hit = readAt(e.clientX, e.clientY);
          if (hit) props.onPick(hit.hex);
        }}
      >
        <canvas ref={canvasRef} />
        {loupe && (
          <span class="loupe" style={{ left: `${loupe.x}px`, top: `${loupe.y}px` }}>
            <i style={{ background: loupe.hex }} />
            {loupe.hex}
          </span>
        )}
      </div>
      <p class="hint">点击图片任意位置取色，主色已自动提取到下方</p>
    </div>
  );
}

/* ---------- 取材 ---------- */

function SourceCard() {
  const s = settings.value;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const display = formatValue(s.baseColor, s.format);
  const hsl = hexToHsl(s.baseColor);

  const screenPick = async () => {
    if (!supportsEyeDropper()) {
      toast('当前浏览器不支持屏幕吸管，可以上传或粘贴截图');
      return;
    }
    try {
      const hex = await pickScreenColor();
      if (hex) {
        setBaseColor(hex, true);
        toast(`已取色 ${hex}`);
      }
    } catch {
      toast('取色失败，请重试');
    }
  };

  const apply = () => {
    const rgb = parseByFormat(draft, s.format);
    if (!rgb) {
      setError('格式不正确，试试 ' + (s.format === 'HEX' ? '#4A6CF7' : s.format === 'RGB' ? '74, 108, 247' : '229, 73, 63'));
      return;
    }
    setError('');
    setEditing(false);
    setBaseColor(rgbToHex(rgb), true);
  };

  const loadFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件（JPG / PNG / WebP）');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast('图片超过 12MB，换一张小一点的');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imageColors.value = [];
      imageUrl.value = String(reader.result);
    };
    reader.onerror = () => toast('图片读取失败，换一张试试');
    reader.readAsDataURL(file);
  };

  return (
    <Card title="取材" hint="一个颜色、一张照片，都可以是起点">
      <div
        class="source-base"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          loadFile(e.dataTransfer?.files?.[0]);
        }}
      >
        <button
          type="button"
          class="swatch-big"
          style={{ background: s.baseColor }}
          title="打开取色器"
          onClick={() => pickerRef.current?.click()}
        >
          <span>{s.baseColor}</span>
        </button>
        <div class="source-meta">
          <strong>{formatValue(s.baseColor, 'HEX')}</strong>
          <span>{formatValue(s.baseColor, 'RGB')}</span>
        </div>
        <input
          type="color"
          ref={pickerRef}
          class="hidden-input"
          value={s.baseColor.toLowerCase()}
          aria-label="基础色"
          onInput={(e) => setBaseColor((e.currentTarget as HTMLInputElement).value, false)}
          onChange={() => generateNow()}
        />
      </div>

      <div class="field">
        <span class="field-label">格式</span>
        <Tabs
          small
          options={[
            { id: 'HEX', label: 'HEX' },
            { id: 'RGB', label: 'RGB' },
            { id: 'HSL', label: 'HSL' },
          ]}
          value={s.format}
          onChange={(id) => {
            setSetting('format', id as ColorFormat);
            setEditing(false);
            setError('');
          }}
        />
      </div>

      <div class="field">
        <span class="field-label">色值</span>
        <div class="input-row">
          <input
            type="text"
            class="text-input"
            spellcheck={false}
            autocomplete="off"
            value={editing ? draft : display}
            aria-label="输入颜色值"
            onFocus={() => {
              setEditing(true);
              setDraft(display);
            }}
            onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
            onBlur={() => setEditing(false)}
          />
          <button type="button" class="btn ghost sm" onClick={apply}>
            应用
          </button>
        </div>
        {error && <p class="error">{error}</p>}
      </div>

      <div class="field">
        <span class="field-label">色相</span>
        <div class="hue-row">
          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(hsl.h)}
            aria-label="调整色相"
            onInput={(e) => {
              const h = Number((e.currentTarget as HTMLInputElement).value);
              setBaseColor(hslToHex({ h, s: hsl.s, l: hsl.l }), false);
            }}
            onChange={() => generateNow()}
          />
          <span class="mono">{Math.round(hsl.h)}°</span>
        </div>
      </div>

      <div class="field">
        <span class="field-label">图片</span>
        <div class="upload-row">
          <button type="button" class="btn ghost sm" onClick={() => fileRef.current?.click()}>
            <Icon name="image" /> 上传图片
          </button>
          <button type="button" class="btn ghost sm" onClick={screenPick} title="从屏幕上任意位置取色（Chrome / Edge）">
            屏幕吸管
          </button>
          <button type="button" class="btn ghost sm" onClick={() => setCameraOpen(true)}>
            摄像头
          </button>
          <button type="button" class="btn ghost sm" onClick={() => setMoodOpen(true)}>
            情绪板
          </button>
          <button type="button" class="btn ghost sm" onClick={() => setImportOpen(true)}>
            导入配色
          </button>
          <span class="hint">支持拖入与粘贴</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          class="hidden-input"
          aria-label="上传图片"
          onChange={(e) => {
            const input = e.currentTarget as HTMLInputElement;
            loadFile(input.files?.[0]);
            input.value = '';
          }}
        />
      </div>

      {imageUrl.value && (
        <>
          <ImagePicker
            url={imageUrl.value}
            onExtract={(colors) => {
              imageColors.value = colors;
              if (colors.length) {
                setBaseColor(pickBaseColor(colors), true);
                toast(`提取到 ${colors.length} 个主色`);
              }
            }}
            onPick={(hex) => {
              setBaseColor(hex, true);
              toast(`已取色 ${hex}`);
            }}
          />
          <div class="mini-swatches">
            {imageColors.value.map((hex) => (
              <button
                type="button"
                key={hex}
                style={{ background: hex }}
                title={hex}
                aria-label={`使用 ${hex}`}
                onClick={() => setBaseColor(hex, true)}
              />
            ))}
          </div>
          <button
            type="button"
            class="link"
            onClick={() => {
              imageUrl.value = '';
              imageColors.value = [];
            }}
          >
            清除图片
          </button>
        </>
      )}

      <CameraDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(url) => {
          imageUrl.value = url;
          imageColors.value = [];
          toast('已拍下，正在提取主色');
        }}
      />

      <MoodboardDialog
        open={moodOpen}
        onClose={() => setMoodOpen(false)}
        onPick={(hex) => {
          setBaseColor(hex, true);
          toast(`已取色 ${hex}`);
        }}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={(palette) => {
          applyPaletteToStudio(palette);
          toast('已应用导入的配色');
        }}
      />
    </Card>
  );
}

/* ---------- 生成设置 ---------- */

function GenerateCard() {
  const s = settings.value;
  const p = activePalette.value;
  const map = p ? toColorMap(p) : null;
  const locks = lockMap.value;
  const hasLocks = Object.keys(locks).length > 0;

  return (
    <Card title="生成设置" hint="先选场景，再挑语气">
      <div class="field">
        <span class="field-label">场景</span>
        <div class="chips">
          {SCENES.map((scene) => (
            <Chip
              key={scene.id}
              active={s.scene === scene.id}
              title={scene.desc}
              onClick={() => setSetting('scene', scene.id as typeof s.scene)}
            >
              {scene.label}
            </Chip>
          ))}
        </div>
      </div>

      <div class="field">
        <span class="field-label">风格</span>
        <div class="chips">
          <Chip active={s.style === 'none'} onClick={() => setSetting('style', 'none')}>
            通用
          </Chip>
          {STYLES.map((st) => (
            <Chip
              key={st.id}
              active={s.style === st.id}
              onClick={() => setSetting('style', st.id as typeof s.style)}
            >
              {st.label}
            </Chip>
          ))}
        </div>
      </div>

      <div class="field">
        <span class="field-label">情绪</span>
        <div class="chips">
          <Chip active={s.mood === 'none'} onClick={() => setSetting('mood', 'none')}>
            不限
          </Chip>
          {MOODS.map((m) => (
            <Chip
              key={m.id}
              active={s.mood === m.id}
              onClick={() => setSetting('mood', m.id as typeof s.mood)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
      </div>

      <div class="field">
        <span class="field-label">关系</span>
        <div class="chips">
          {HARMONIES.map((h) => (
            <Chip
              key={h.id}
              active={s.harmony === h.id}
              title={h.hint}
              onClick={() => setSetting('harmony', h.id as typeof s.harmony)}
            >
              {h.label}
            </Chip>
          ))}
        </div>
      </div>

      <div class="field">
        <span class="field-label">锁定</span>
        <div class="chips">
          {ROLES.map((r) => (
            <Chip
              key={r.id}
              active={!!locks[r.id]}
              title={locks[r.id] ? `已锁定 ${locks[r.id]}，点击解锁` : '锁定后重新生成时保持不变'}
              onClick={() => toggleLock(r.id)}
            >
              <i class="dot" style={{ background: map?.[r.id] ?? '#ccc' }} />
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      <Switch
        checked={s.strict}
        onChange={(v) => setSetting('strict', v)}
        label="严格无障碍"
        desc="彩色也要求 3:1，文字 4.5:1"
      />

      <Switch
        checked={s.pairMode}
        onChange={(v) => setSetting('pairMode', v)}
        label="深色成对"
        desc="同时生成浅色与深色两套，分别检查"
      />

      <Switch
        checked={s.cvdSafe}
        onChange={(v) => setSetting('cvdSafe', v)}
        label="色弱友好"
        desc="三种色弱模拟下，主/辅/强调仍可分辨"
      />

      <p class="scene-tip">{SCENE_MAP[s.scene]?.tip}</p>

      <button type="button" class="btn primary wide" onClick={() => generateNow()}>
        <Icon name="refresh" /> 换一批配色
      </button>
      <p class="hint shortcut-hint">空格换一批 · ↑/↓ 微调亮度（Shift 大步）· Ctrl+Z 撤销</p>
      {hasLocks && (
        <button
          type="button"
          class="link center"
          onClick={() => {
            lockMap.value = {};
            generateNow();
          }}
        >
          清除全部锁定
        </button>
      )}
    </Card>
  );
}

/* ---------- 方案卡片 ---------- */

function PaletteCard({ p, active }: { p: Palette; active: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName(p));
  const [colorEdit, setColorEdit] = useState<{ role: Role; hex: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const fav = favorites.value.some((x) => x.id === p.id);
  const meta = `${sceneLabel(p.scene)} · ${HARMONY_LABEL[p.harmony] ?? '和谐'}`;

  const cancelRename = useRef(false);

  const commit = () => {
    if (cancelRename.current) {
      cancelRename.current = false;
      setEditing(false);
      return;
    }
    renamePalette(p, draft);
    setEditing(false);
  };

  return (
    <article
      class={`palette ${active ? 'is-active' : ''}`}
      onClick={() => selectPalette(p.id)}
      aria-label={`配色方案 ${displayName(p)}`}
    >
      <header class="palette-head">
        <div class="palette-title">
          {editing ? (
            <input
              class="rename-input"
              value={draft}
              autoFocus
              maxLength={40}
              aria-label="方案名称"
              onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  cancelRename.current = true;
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div class="palette-name-row">
              <h3>{displayName(p)}</h3>
              <button
                type="button"
                class="link"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelRename.current = false;
                  setDraft(displayName(p));
                  setEditing(true);
                }}
              >
                重命名
              </button>
            </div>
          )}
          <p class="palette-meta">
            {meta} · 文字/背景 {p.a11y.textOnBg.toFixed(2)}:1
          </p>
        </div>
        <div class="palette-tools" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            class={`icon-btn star ${fav ? 'is-on' : ''}`}
            aria-label={fav ? '取消收藏' : '收藏方案'}
            title={fav ? '取消收藏' : '收藏方案'}
            onClick={() => toggleFavorite(p)}
          >
            <Icon name="star" filled={fav} />
          </button>
          <button
            type="button"
            class="btn ghost sm"
            onClick={() => copyText(shareUrl(p), '分享链接已复制')}
          >
            <Icon name="share" /> 分享
          </button>
          <button type="button" class="btn ghost sm" onClick={() => setShareOpen(true)}>
            分享卡
          </button>
          <details class="menu">
            <summary class="btn ghost sm">
              <Icon name="download" /> 导出
            </summary>
            <div class="menu-panel">
              {(['css', 'json', 'svg', 'png'] as const).map((kind) => (
                <button
                  type="button"
                  key={kind}
                  onClick={(e) => {
                    exportPalette(kind, p);
                    (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
                  }}
                >
                  导出 {kind.toUpperCase()}
                </button>
              ))}
            </div>
          </details>
        </div>
      </header>

      <div class="palette-colors">
        {p.colors.map((c) => (
          <div key={c.role} class="swatch">
            <button
              type="button"
              class="swatch-chip-btn"
              title={`调整${c.label}颜色`}
              aria-label={`调整${c.label}颜色`}
              onClick={(e) => {
                e.stopPropagation();
                selectPalette(p.id);
                setColorEdit({ role: c.role, hex: c.hex });
              }}
            >
              <span class="swatch-chip" style={{ background: c.hex }} />
            </button>
            <span class="swatch-name">{c.label}</span>
            <button
              type="button"
              class="swatch-hex"
              title={`复制 ${c.hex}`}
              onClick={(e) => {
                e.stopPropagation();
                copyText(c.hex, `已复制 ${c.hex}`);
              }}
            >
              {c.hex}
            </button>
          </div>
        ))}
      </div>

      <div class="ratio-bar" aria-hidden="true">
        {p.colors.map((c) => (
          <span key={c.role} style={{ width: `${c.ratio}%`, background: c.hex }} />
        ))}
      </div>

      <p class="palette-desc">{p.description}</p>

      {p.a11y.warnings.length > 0 && (
        <ul class="warn-list">
          {p.a11y.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <ShareCardDialog open={shareOpen} palette={p} onClose={() => setShareOpen(false)} />

      <ColorEditor
        open={!!colorEdit}
        palette={p}
        role={colorEdit?.role ?? 'primary'}
        initialHex={colorEdit?.hex ?? p.colors[0].hex}
        onClose={() => setColorEdit(null)}
        onChange={(hex) => {
          if (colorEdit) updatePaletteColor(p.id, colorEdit.role, hex);
        }}
        onRegenerate={() => {
          regenerateAroundLocks();
          setColorEdit(null);
        }}
      />
    </article>
  );
}

function PalettesCard() {
  const list = palettes.value;
  return (
    <Card
      title="配色方案"
      hint="点色块调色 · 点色值复制 · 点卡片设为当前预览"
      actions={
        <>
          <button
            type="button"
            class="btn ghost sm"
            disabled={!undoState.value.canUndo}
            title="撤销（Ctrl+Z）"
            onClick={undoWorkspace}
          >
            撤销
          </button>
          <button
            type="button"
            class="btn ghost sm"
            disabled={!undoState.value.canRedo}
            title="重做（Ctrl+Shift+Z / Ctrl+Y）"
            onClick={redoWorkspace}
          >
            重做
          </button>
          <button type="button" class="btn ghost sm" onClick={() => generateNow()}>
            <Icon name="refresh" /> 换一批
          </button>
        </>
      }
    >
      {list.length === 0 ? (
        <Empty>还没有方案，点左侧「换一批配色」</Empty>
      ) : (
        <div class="palette-list">
          {list.map((p) => (
            <PaletteCard key={p.id} p={p} active={p.id === activeId.value} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------- 预览 ---------- */

const PREVIEW_OPTIONS: Array<{ id: PreviewMode; label: string }> = [
  { id: 'phone', label: '手机' },
  { id: 'web', label: '网页' },
  { id: 'poster', label: '海报' },
  { id: 'wallpaper', label: '壁纸' },
  { id: 'outfit', label: '穿搭' },
];

function PreviewCard() {
  const p = activePalette.value;
  if (!p) return null;
  const base = paletteForTheme(p, previewTheme.value);
  const map = applyCvd(base, cvdType.value);

  return (
    <Card
      title="实时预览"
      hint="浅色 / 深色成对，色觉模拟即时生效"
      actions={
        <div class="preview-tools">
          <Tabs
            small
            options={PREVIEW_OPTIONS}
            value={settings.value.preview}
            onChange={(id) => setPreview(id as PreviewMode)}
          />
          <Tabs
            small
            options={[
              { id: 'light', label: '浅色' },
              { id: 'dark', label: '深色' },
            ]}
            value={previewTheme.value}
            onChange={(id) => {
              previewTheme.value = id as 'light' | 'dark';
            }}
          />
          <div class="preview-cvd">
            <span class="preview-cvd-label">色觉</span>
            <Tabs
              small
              options={CVD_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
              value={cvdType.value}
              onChange={(id) => setCvd(id as typeof cvdType.value)}
            />
          </div>
        </div>
      }
    >
      <div class="preview-shell" aria-hidden="true">
        <Preview mode={settings.value.preview} map={map} />
      </div>
      <p class="sr-only">
        当前方案：主色 {map.primary}，辅助色 {map.secondary}，强调色 {map.accent}，背景{' '}
        {map.bg}，文字 {map.text}，预览为视觉模拟，色值与对比度见上方方案卡与对比度检测
      </p>
    </Card>
  );
}

/* ---------- 对比度 ---------- */

function AccessCard() {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const p = activePalette.value;
  if (!p) return null;
  const map = toColorMap(p);
  const sim = cvdType.value;

  const rows = [
    { label: '文字 / 背景', role: 'text' as Role, target: 4.5, ratio: p.a11y.textOnBg },
    { label: '主色 / 背景', role: 'primary' as Role, target: 3, ratio: p.a11y.primaryOnBg },
    { label: '辅助色 / 背景', role: 'secondary' as Role, target: 3, ratio: p.a11y.secondaryOnBg },
    { label: '强调色 / 背景', role: 'accent' as Role, target: 3, ratio: p.a11y.accentOnBg },
  ];
  const simMap = applyCvd(map, sim);
  const textOk = rows[0].ratio >= 4.5;
  const colorsOk = rows.slice(1).every((r) => r.ratio >= r.target);

  return (
    <Card
      title="对比度检测"
      hint="WCAG 2.2 与 APCA 同时给出"
      actions={
        <>
          <button type="button" class="btn ghost sm" onClick={() => setAuditOpen(true)}>
            审计报告
          </button>
          <button type="button" class="btn ghost sm" onClick={() => setChecklistOpen(true)}>
            场景清单
          </button>
          <a class="btn ghost sm" href="#/scales">
            色阶 / 令牌
          </a>
          <button type="button" class="btn ghost sm" onClick={repairActive}>
            <Icon name="check" /> 一键修复
          </button>
        </>
      }
    >
      <ul class="access-list">
        {rows.map((r) => {
          const level = r.ratio >= 7 ? 'AAA' : r.ratio >= r.target ? (r.target >= 4.5 ? 'AA' : 'AA 图形') : '未通过';
          const ok = r.ratio >= r.target;
          return (
            <li key={r.label}>
              <i class="access-dot" style={{ background: simMap[r.role] }} />
              <span class="access-label">{r.label}</span>
              <span class="mono">{r.ratio.toFixed(2)}:1</span>
              <span class={`badge ${ok ? 'ok' : 'bad'}`}>{level}</span>
            </li>
          );
        })}
      </ul>

      <div class="apca-row">
        <span>APCA Lc</span>
        <strong>{p.a11y.apca.toFixed(1)}</strong>
        <span class="hint">{p.a11y.apca >= 90 ? '优秀，适合正文' : p.a11y.apca >= 75 ? '正文可用' : p.a11y.apca >= 60 ? '仅适合大字' : '对比不足'}</span>
      </div>

      {p.darkA11y && (
        <div class="apca-row">
          <span>深色版 文字/背景</span>
          <strong>{p.darkA11y.textOnBg.toFixed(2)}:1</strong>
          <span class={`badge ${p.darkA11y.textOnBg >= 4.5 ? 'ok' : 'bad'}`}>
            {p.darkA11y.textOnBg >= 4.5 ? 'AA' : '未通过'}
          </span>
        </div>
      )}

      {p.cvd && (
        <div class="apca-row">
          <span>色弱分离</span>
          <strong>
            {p.cvd.protan.toFixed(0)} / {p.cvd.deutan.toFixed(0)} / {p.cvd.tritan.toFixed(0)}
          </strong>
          <span class={`badge ${p.cvd.safe ? 'ok' : 'bad'}`}>{p.cvd.safe ? '可分辨' : '偏近'}</span>
          <span class="hint">红绿 / 绿蓝 / 蓝黄 模拟下的最小 ΔE</span>
        </div>
      )}

      <div class="apca-row">
        <span>主色印刷近似</span>
        <strong>{cmykLabel(p.colors.find((c) => c.role === 'primary')?.hex ?? '#000000')}</strong>
        <span class="hint">屏幕色与印刷色存在差异</span>
      </div>

      {p.a11y.warnings.length > 0 ? (
        <ul class="warn-list">
          {p.a11y.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : textOk && colorsOk ? (
        <p class="pass-note">
          <Icon name="check" /> 四项对比度全部达标，可以直接使用
        </p>
      ) : textOk ? (
        <p class="pass-note warn-note">
          正文可读；彩色与背景还有不足，点「一键修复」可按最小改动调整
        </p>
      ) : (
        <p class="pass-note warn-note">正文对比度不足，建议点「一键修复」</p>
      )}

      <SceneChecklistDialog
        open={checklistOpen}
        palette={p}
        onClose={() => setChecklistOpen(false)}
      />
      <AuditReportDialog open={auditOpen} palette={p} onClose={() => setAuditOpen(false)} />
    </Card>
  );
}

/* ---------- 我的方案 ---------- */

function SavedCard() {
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites');
  const list = tab === 'favorites' ? favorites.value : history.value;

  return (
    <Card
      title="我的方案"
      actions={
        <Tabs
          small
          options={[
            { id: 'favorites', label: `收藏 ${favorites.value.length}` },
            { id: 'history', label: `历史 ${history.value.length}` },
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'favorites' | 'history')}
        />
      }
    >
      {list.length === 0 ? (
        <Empty>{tab === 'favorites' ? '还没有收藏，点方案卡片右上角的星标' : '生成过的方案会自动记录在这里'}</Empty>
      ) : (
        <ul class="saved-list">
          {list.map((p) => (
            <li key={`${tab}-${p.id}`}>
              <div class="saved-strips" aria-hidden="true">
                {p.colors.map((c) => (
                  <i key={c.role} style={{ background: c.hex }} />
                ))}
              </div>
              <div class="saved-meta">
                <strong>{displayName(p)}</strong>
                <span>
                  {sceneLabel(p.scene)} · {p.a11y.textOnBg.toFixed(2)}:1
                </span>
              </div>
              <div class="saved-acts">
                <button type="button" class="btn ghost sm" onClick={() => restorePalette(p)}>
                  恢复
                </button>
                <button
                  type="button"
                  class="btn ghost sm"
                  onClick={() => copyText(shareUrl(p), '分享链接已复制')}
                >
                  分享
                </button>
                {tab === 'favorites' && (
                  <button type="button" class="btn ghost sm" onClick={() => deleteFavorite(p.id)}>
                    删除
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- 工作台 ---------- */

export function Studio() {
  const gridRef = useRef<HTMLDivElement>(null);

  // 外层撑到内容自然高度供 sticky 吸附；高视口下某列不足一屏时挡掉滚轮链到整页
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const mq = window.matchMedia('(min-width: 961px)');
    const cols = Array.from(grid.querySelectorAll<HTMLElement>('.studio-col'));
    const syncHeight = () => {
      if (!mq.matches) {
        cols.forEach((col) => {
          col.style.height = '';
        });
        return;
      }
      // 两列外层取同一自然高度，短列也能吸附到整页滚动结束
      const natural = Math.max(
        ...cols.map((col) => (col.firstElementChild as HTMLElement | null)?.scrollHeight ?? 0),
      );
      cols.forEach((col) => {
        col.style.height = `${natural}px`;
      });
    };
    const ro = new ResizeObserver(syncHeight);
    for (const col of cols) {
      const scroller = col.firstElementChild;
      if (scroller) Array.from(scroller.children).forEach((child) => ro.observe(child));
    }
    syncHeight();
    mq.addEventListener('change', syncHeight);
    const onWheel = (e: WheelEvent) => {
      if (!mq.matches) return;
      const col = (e.target as HTMLElement | null)?.closest('.side, .main');
      if (col && col.scrollHeight <= col.clientHeight + 1) e.preventDefault();
    };
    grid.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', syncHeight);
      grid.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const nudgeLightness = (delta: number) => {
      const hsl = hexToHsl(settings.value.baseColor);
      const l = Math.min(100, Math.max(0, hsl.l + delta));
      if (l === hsl.l) return;
      setBaseColor(hslToHex({ h: hsl.h, s: hsl.s, l }), true);
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoWorkspace();
        else undoWorkspace();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoWorkspace();
        return;
      }
      if (mod || e.altKey) return;
      // 空格/方向键留给当前聚焦的按钮、链接等控件，避免劫持原生激活
      if (target?.closest('button, a, summary')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        generateNow();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 2);
        nudgeLightness(step);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const image = items.find((i) => i.type.startsWith('image/'));
      if (!image) return;
      const file = image.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        imageColors.value = [];
        imageUrl.value = String(reader.result);
      };
      reader.onerror = () => toast('图片读取失败，换一张试试');
      reader.readAsDataURL(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div class="container page studio-page">
      <header class="page-head">
        <h1>工作台</h1>
        <p>拍一张、选一个场景，30 秒拿到能直接用的配色</p>
      </header>

      {sharedFrom.value && (
        <div class="banner">已载入朋友分享的配色，你可以继续调整、收藏，或者直接导出</div>
      )}
      {storageWarning.value && (
        <div class="banner warn">
          当前浏览器无法保存数据（可能是隐私模式），收藏与历史仅在本次有效
        </div>
      )}

      <div class="studio-grid" ref={gridRef}>
        <div class="studio-col">
          <aside class="side">
            <SourceCard />
            <GenerateCard />
          </aside>
        </div>
        <div class="studio-col">
          <div class="main">
            <PalettesCard />
            <PreviewCard />
            <AccessCard />
            <SavedCard />
          </div>
        </div>
      </div>
    </div>
  );
}
