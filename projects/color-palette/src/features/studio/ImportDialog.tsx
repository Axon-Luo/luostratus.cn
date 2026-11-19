import { useRef, useState } from 'preact/hooks';
import { parsePaletteInput, paletteFromColors } from '../../core/import/parse';
import type { Palette } from '../../core/palette/types';
import { Dialog } from '../../ui/Dialog';
import { toast } from '../../state';

export function ImportDialog(props: {
  open: boolean;
  onClose: () => void;
  onApply: (palette: Palette) => void;
}) {
  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = (value: string) => {
    const result = parsePaletteInput(value);
    setColors(result.colors);
    setWarnings(result.warnings);
  };

  const readFile = (file?: File) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast('文件超过 1MB，请粘贴文本');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? '');
      setText(value);
      parse(value);
    };
    reader.onerror = () => toast('文件读取失败，请粘贴文本');
    reader.readAsText(file);
  };

  const apply = () => {
    const palette = paletteFromColors(colors);
    if (!palette) {
      toast('没有可应用的配色');
      return;
    }
    props.onApply(palette);
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="导入配色"
      wide
      footer={
        <>
          <span class="hint">{colors.length > 0 ? `识别到 ${colors.length} 个颜色` : '支持 HEX 列表、CSS 变量、设计令牌 JSON'}</span>
          <button type="button" class="btn ghost" onClick={props.onClose}>
            取消
          </button>
          <button type="button" class="btn primary" disabled={colors.length === 0} onClick={apply}>
            应用
          </button>
        </>
      }
    >
      <div class="input-row">
        <button type="button" class="btn ghost sm" onClick={() => fileRef.current?.click()}>
          选择文件
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.css,.txt,text/plain,application/json,text/css"
          class="hidden-input"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const input = event.currentTarget as HTMLInputElement;
            readFile(input.files?.[0]);
            input.value = '';
          }}
        />
        <span class="hint">或在下方粘贴</span>
      </div>

      <textarea
        class="import-text"
        rows={7}
        spellcheck={false}
        placeholder={`#4A6CF7\n#E53935\n#F6D365\n\n或 --color-primary: #4A6CF7;`
        }
        value={text}
        onInput={(event) => {
          const value = (event.currentTarget as HTMLTextAreaElement).value;
          setText(value);
          parse(value);
        }}
      />

      {warnings.length > 0 && (
        <ul class="warn-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {colors.length > 0 && (
        <div class="import-preview">
          {colors.map((hex) => (
            <span key={hex} title={hex}>
              <i style={{ background: hex }} />
              <em class="mono">{hex}</em>
            </span>
          ))}
        </div>
      )}
    </Dialog>
  );
}
