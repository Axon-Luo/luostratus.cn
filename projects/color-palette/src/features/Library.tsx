import { useRef, useState } from 'preact/hooks';
import { SCENES } from '../content/presets';
import { displayName } from '../core/export/exporters';
import { shareUrl } from '../core/share';
import type { Palette } from '../core/palette/types';
import {
  applyPaletteToStudio,
  clearAllData,
  deleteFavorite,
  deleteHistory,
  exportLibraryData,
  favorites,
  history,
  importLibraryData,
  toast,
} from '../state';
import { Card, Empty, Tabs } from '../ui/components';
import { copyText, downloadText } from './fileExport';
import { CompareDialog } from './CompareDialog';

function sceneLabel(id: string): string {
  return SCENES.find((s) => s.id === id)?.label ?? '生活';
}

function Item({
  p,
  tab,
  comparing,
  onCompare,
}: {
  p: Palette;
  tab: 'favorites' | 'history';
  comparing: boolean;
  onCompare: () => void;
}) {
  return (
    <li>
      <div class="saved-strips" aria-hidden="true">
        {p.colors.map((c) => (
          <i key={c.role} style={{ background: c.hex }} />
        ))}
      </div>
      <div class="saved-meta">
        <strong>{displayName(p)}</strong>
        <span>
          {sceneLabel(p.scene)} · {p.a11y.textOnBg.toFixed(2)}:1 · {p.colors[0]?.hex}
        </span>
      </div>
      <div class="saved-acts">
        <button
          type="button"
          class={`btn ghost sm ${comparing ? 'is-on' : ''}`}
          aria-pressed={comparing}
          title={comparing ? '取消对比' : '选择两套方案自动并排对比'}
          onClick={onCompare}
        >
          {comparing ? '已选对比' : '对比'}
        </button>
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => {
            applyPaletteToStudio(p);
            toast('已带回工作台');
          }}
        >
          恢复
        </button>
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => copyText(shareUrl(p), '分享链接已复制')}
        >
          分享
        </button>
        <button
          type="button"
          class="btn ghost sm"
          onClick={() => {
            if (tab === 'favorites') deleteFavorite(p.id);
            else deleteHistory(p.id);
          }}
        >
          删除
        </button>
      </div>
    </li>
  );
}

export function Library() {
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [compare, setCompare] = useState<Palette[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleCompare = (p: Palette) => {
    setCompare((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 2) return [prev[1], p];
      return [...prev, p];
    });
  };

  const list = tab === 'favorites' ? favorites.value : history.value;
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? list.filter(
        (p) =>
          displayName(p).toLowerCase().includes(keyword) ||
          p.colors.some((c) => c.hex.toLowerCase().includes(keyword)),
      )
    : list;

  const exportBackup = () => {
    downloadText('配色工坊-方案库.json', exportLibraryData(), 'application/json');
    toast('方案库已导出');
  };

  const readImport = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('备份文件超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = importLibraryData(String(reader.result ?? ''), mode);
      toast(result.message);
    };
    reader.onerror = () => toast('备份文件读取失败');
    reader.readAsText(file);
  };

  return (
    <div class="container page">
      <header class="page-head">
        <h1>我的方案</h1>
        <p>收藏、历史与备份都在本地浏览器里，不上传服务器</p>
      </header>

      <Card
        title="方案库"
        hint={`收藏 ${favorites.value.length} · 历史 ${history.value.length}`}
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
        <div class="library-toolbar">
          <input
            class="text-input library-search"
            type="search"
            value={query}
            placeholder="搜名称或色值，如 米白 / #F6F2F0"
            aria-label="搜索方案"
            onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
          />
          <div class="library-actions">
            <button type="button" class="btn ghost sm" onClick={exportBackup}>
              导出备份
            </button>
            <select
              class="text-input library-mode"
              value={mode}
              aria-label="导入方式"
              onChange={(event) => setMode((event.currentTarget as HTMLSelectElement).value as 'merge' | 'replace')}
            >
              <option value="merge">合并导入</option>
              <option value="replace">替换导入</option>
            </select>
            <button type="button" class="btn ghost sm" onClick={() => fileRef.current?.click()}>
              导入备份
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              class="hidden-input"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const input = event.currentTarget as HTMLInputElement;
                readImport(input.files?.[0]);
                input.value = '';
              }}
            />
            <button
              type="button"
              class="btn ghost sm danger"
              onClick={() => {
                if (confirm('确定清空收藏、历史与本地设置？此操作不可撤销')) clearAllData();
              }}
            >
              清空数据
            </button>
          </div>
        </div>

        {compare.length > 0 && (
          <p class="hint compare-hint">
            已选 {compare.length} 套用于对比{compare.length === 1 ? '，再选一套自动打开并排对比' : ''}
            <button type="button" class="link" onClick={() => setCompare([])}>
              清除选择
            </button>
          </p>
        )}

        {filtered.length === 0 ? (
          <Empty>
            {keyword
              ? '没有匹配的方案'
              : tab === 'favorites'
                ? '还没有收藏，点方案卡片右上角的星标'
                : '生成过的方案会自动记录在这里'}
          </Empty>
        ) : (
          <ul class="saved-list library-list">
            {filtered.map((p) => (
              <Item
                key={`${tab}-${p.id}`}
                p={p}
                tab={tab}
                comparing={compare.some((x) => x.id === p.id)}
                onCompare={() => toggleCompare(p)}
              />
            ))}
          </ul>
        )}
      </Card>

      {compare.length === 2 && (
        <CompareDialog open a={compare[0]} b={compare[1]} onClose={() => setCompare([])} />
      )}
    </div>
  );
}
