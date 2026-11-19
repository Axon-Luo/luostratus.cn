import { useEffect, useRef, useState } from 'preact/hooks';
import { extractFromImages } from '../../core/image/moodboard';
import { Dialog } from '../../ui/Dialog';
import { toast } from '../../state';

interface Item {
  id: string;
  url: string;
}

export function MoodboardDialog(props: {
  open: boolean;
  onClose: () => void;
  onPick: (hex: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (props.open) return;
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setItems([]);
    setColors([]);
  }, [props.open]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = 6 - items.length;
    if (room <= 0) {
      toast('最多 6 张，先移除一张再加');
      return;
    }
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      if (next.length >= room) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 12 * 1024 * 1024) continue;
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      next.push({ id: `${file.name}-${file.size}-${Date.now()}-${next.length}`, url });
    }
    if (next.length === 0) {
      toast('没有可用的图片');
      return;
    }
    if (next.length === room && files.length > room) toast('最多 6 张，多余的已忽略');
    setItems((old) => [...old, ...next].slice(0, 6));
    setColors([]);
  };

  const remove = (id: string) => {
    const target = items.find((x) => x.id === id);
    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
    }
    setItems((old) => old.filter((x) => x.id !== id));
    setColors([]);
  };

  const extract = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const next = await extractFromImages(items.map((item) => item.url));
      setColors(next);
      if (next.length === 0) toast('没有提取到明显颜色');
    } catch {
      toast('提取失败，请换几张图');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="多图情绪板"
      wide
      footer={
        <>
          <span class="hint">2–6 张图，提取后点任意颜色设为基础色</span>
          <button type="button" class="btn ghost" onClick={props.onClose}>
            取消
          </button>
          <button type="button" class="btn primary" disabled={items.length === 0 || busy} onClick={extract}>
            {busy ? '提取中…' : '提取颜色'}
          </button>
        </>
      }
    >
      <div class="input-row">
        <button type="button" class="btn ghost sm" onClick={() => fileRef.current?.click()}>
          选择图片
        </button>
        <span class="hint">{items.length}/6</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          class="hidden-input"
          tabIndex={-1}
          aria-hidden="true"
          aria-label="选择情绪板图片"
          onChange={(event) => {
            const input = event.currentTarget as HTMLInputElement;
            addFiles(input.files);
            input.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <div class="moodboard-thumbs">
          {items.map((item) => (
            <div class="moodboard-thumb" key={item.id}>
              <img src={item.url} alt="情绪板素材" />
              <button
                type="button"
                class="icon-btn"
                aria-label="移除这张图片"
                onClick={() => remove(item.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {colors.length > 0 && (
        <div class="moodboard-colors">
          {colors.map((hex) => (
            <button
              type="button"
              key={hex}
              style={{ background: hex }}
              title={`使用 ${hex}`}
              aria-label={`使用 ${hex}`}
              onClick={() => {
                props.onPick(hex);
                props.onClose();
              }}
            >
              <span>{hex}</span>
            </button>
          ))}
        </div>
      )}
    </Dialog>
  );
}
