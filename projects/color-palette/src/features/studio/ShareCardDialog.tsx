import { useEffect, useRef, useState } from 'preact/hooks';
import { displayName, paletteSubtitle } from '../../core/export/exporters';
import { shareUrl } from '../../core/share';
import {
  SHARE_FORMATS,
  renderShareCard,
  shareCardFileName,
  shareCardSize,
} from '../../core/shareCard';
import type { ShareCardSpec } from '../../core/shareCard';
import type { Palette } from '../../core/palette/types';
import type { ShareFormat } from '../../core/storage';
import { setSetting, settings, toast } from '../../state';
import { Dialog } from '../../ui/Dialog';
import { copyText } from '../fileExport';

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function ShareCardDialog(props: { open: boolean; palette: Palette; onClose: () => void }) {
  const [format, setFormat] = useState<ShareFormat>(settings.value.shareFormat);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState(today);
  const [showQr, setShowQr] = useState(true);
  const [includeHex, setIncludeHex] = useState(true);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const blobKeyRef = useRef('');

  // 缓存 blob 必须和当前选项一致，否则防抖窗口内快速下载会拿到旧图
  const blobKey = JSON.stringify([
    format,
    theme,
    title,
    subtitle,
    date,
    showQr,
    includeHex,
    props.palette.id,
    props.palette.colors.map((c) => c.hex).join(','),
  ]);

  useEffect(() => {
    if (!props.open) return;
    setTitle(displayName(props.palette));
    setSubtitle(paletteSubtitle(props.palette));
    setDate(today());
    setFormat(settings.value.shareFormat);
  }, [props.open, props.palette.id]);

  useEffect(() => {
    if (!props.open) return;
    let canceled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      const spec: ShareCardSpec = {
        format,
        theme,
        title: title || displayName(props.palette),
        subtitle,
        date,
        showQr,
        includeHex,
        palette: props.palette,
      };
      try {
        const blob = await renderShareCard(spec);
        if (canceled) return;
        blobRef.current = blob;
        blobKeyRef.current = blobKey;
        const url = URL.createObjectURL(blob);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      } catch {
        if (!canceled) toast('分享卡生成失败');
      } finally {
        if (!canceled) setBusy(false);
      }
    }, 180);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [props.open, format, theme, title, subtitle, date, showQr, includeHex, props.palette]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const spec: ShareCardSpec = {
    format,
    theme,
    title: title || displayName(props.palette),
    subtitle,
    date,
    showQr,
    includeHex,
    palette: props.palette,
  };

  const ensureBlob = async (): Promise<Blob | null> => {
    if (blobRef.current && blobKeyRef.current === blobKey) return blobRef.current;
    try {
      const blob = await renderShareCard(spec);
      blobRef.current = blob;
      blobKeyRef.current = blobKey;
      return blob;
    } catch {
      toast('分享卡生成失败');
      return null;
    }
  };

  const download = async () => {
    const blob = await ensureBlob();
    if (!blob) return;
    downloadBlob(blob, shareCardFileName(props.palette, format));
    toast('已导出分享卡');
  };

  const systemShare = async () => {
    const blob = await ensureBlob();
    if (!blob) return;
    const file = new File([blob], shareCardFileName(props.palette, format), { type: 'image/png' });
    const data = { files: [file], title: title || displayName(props.palette), text: '来自配色工坊的配色' };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
        // 其它失败（如文件类型被拒）落到下面的下载兜底
      }
    }
    toast('当前浏览器不支持系统分享，已改为下载');
    downloadBlob(blob, shareCardFileName(props.palette, format));
  };

  const size = shareCardSize(format);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="分享卡"
      wide
      footer={
        <>
          <span class="hint">
            {size.w} × {size.h} · PNG
          </span>
          <button
            type="button"
            class="btn ghost"
            onClick={() => copyText(shareUrl(props.palette), '分享链接已复制')}
          >
            复制链接
          </button>
          <button type="button" class="btn ghost" onClick={systemShare}>
            系统分享
          </button>
          <button type="button" class="btn primary" disabled={busy} onClick={download}>
            下载 PNG
          </button>
        </>
      }
    >
      <div class="share-card-layout">
        <div class="share-card-preview">
          {preview ? (
            <img src={preview} alt="分享卡预览" />
          ) : (
            <div class="share-card-placeholder">{busy ? '正在生成…' : '选择格式后生成'}</div>
          )}
        </div>

        <div class="share-card-form">
          <div class="field">
            <span class="field-label">比例</span>
            <div class="chips">
              {SHARE_FORMATS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  class={`chip ${format === item.id ? 'is-on' : ''}`}
                  title={item.hint}
                  onClick={() => {
                    setFormat(item.id);
                    setSetting('shareFormat', item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div class="field">
            <span class="field-label">主题</span>
            <div class="chips">
              <button
                type="button"
                class={`chip ${theme === 'light' ? 'is-on' : ''}`}
                onClick={() => setTheme('light')}
              >
                浅色
              </button>
              <button
                type="button"
                class={`chip ${theme === 'dark' ? 'is-on' : ''}`}
                onClick={() => setTheme('dark')}
              >
                深色
              </button>
            </div>
          </div>

          <label class="field">
            <span class="field-label">标题</span>
            <input
              class="text-input"
              value={title}
              maxLength={40}
              onInput={(event) => setTitle((event.currentTarget as HTMLInputElement).value)}
            />
          </label>

          <label class="field">
            <span class="field-label">副标题</span>
            <input
              class="text-input"
              value={subtitle}
              maxLength={60}
              onInput={(event) => setSubtitle((event.currentTarget as HTMLInputElement).value)}
            />
          </label>

          <label class="field">
            <span class="field-label">日期</span>
            <input
              class="text-input"
              value={date}
              maxLength={20}
              onInput={(event) => setDate((event.currentTarget as HTMLInputElement).value)}
            />
          </label>

          <div class="share-card-checks">
            <label class="check-row">
              <input
                type="checkbox"
                checked={showQr}
                onChange={(event) => setShowQr((event.currentTarget as HTMLInputElement).checked)}
              />
              <span>显示二维码</span>
            </label>
            <label class="check-row">
              <input
                type="checkbox"
                checked={includeHex}
                onChange={(event) => setIncludeHex((event.currentTarget as HTMLInputElement).checked)}
              />
              <span>显示色值</span>
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
