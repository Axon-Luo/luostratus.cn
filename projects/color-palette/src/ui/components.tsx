import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { normalizeHex } from '../core/color';
import { toastMsg } from '../state';

const ICONS: Record<string, string> = {
  star: 'M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z',
  share: 'M12 3v11m0-11L8 7m4-4l4 4M5 13v6h14v-6',
  download: 'M12 4v10m0 0l-4-4m4 4l4-4M5 19h14',
  upload: 'M12 20V8m0 0L8 12m4-4l4 4M5 4h14',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5',
  check: 'M5 13l4 4L19 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
  unlock: 'M7 11V8a5 5 0 0 1 9.6-2M5 11h14v9H5z',
  sun: 'M12 4v2m0 12v2M4 12h2m12 0h2M6.3 6.3l1.4 1.4m8.6 8.6l1.4 1.4m0-11.4l-1.4 1.4m-8.6 8.6l-1.4 1.4M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5L14 16m-2-2l2.5-2.5L20 17M15.5 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
  arrow: 'M5 12h13m0 0l-5-5m5 5l-5 5',
  close: 'M6 6l12 12M18 6L6 18',
};

export function Icon({
  name,
  size = 16,
  filled = false,
}: {
  name: string;
  size?: number;
  filled?: boolean;
}) {
  const d = ICONS[name] ?? '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function Card(props: {
  title?: string;
  hint?: string;
  actions?: ComponentChildren;
  children: ComponentChildren;
  class?: string;
  id?: string;
}) {
  return (
    <section class={`card ${props.class ?? ''}`} id={props.id}>
      {(props.title || props.actions) && (
        <header class="card-head">
          <div class="card-title">
            {props.title && <h2>{props.title}</h2>}
            {props.hint && <p class="hint">{props.hint}</p>}
          </div>
          {props.actions && <div class="card-actions">{props.actions}</div>}
        </header>
      )}
      {props.children}
    </section>
  );
}

export function Chip(props: {
  active?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  title?: string;
  disabled?: boolean;
  class?: string;
}) {
  return (
    <button
      type="button"
      class={`chip ${props.active ? 'is-on' : ''} ${props.class ?? ''}`}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      aria-pressed={props.active ? 'true' : 'false'}
    >
      {props.children}
    </button>
  );
}

export function ColorField(props: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(props.value);
  useEffect(() => setDraft(props.value), [props.value]);
  const commit = () => {
    const next = normalizeHex(draft);
    if (next) {
      props.onChange(next);
      setDraft(next);
    } else setDraft(props.value);
  };
  return (
    <label class="color-field">
      <span>{props.label}</span>
      <input
        type="color"
        value={props.value.toLowerCase()}
        aria-label={`${props.label}拾色器`}
        onInput={(event) => {
          const next = normalizeHex((event.currentTarget as HTMLInputElement).value);
          if (next) props.onChange(next);
        }}
      />
      <input
        class="mono"
        type="text"
        value={draft}
        maxLength={7}
        spellcheck={false}
        aria-label={`${props.label}色值`}
        onInput={(event) => setDraft((event.currentTarget as HTMLInputElement).value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
      />
    </label>
  );
}

export function Switch(props: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      class={`switch-row ${props.checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={props.checked ? 'true' : 'false'}
      onClick={() => props.onChange(!props.checked)}
    >
      <span class="switch-text">
        <span class="switch-label">{props.label}</span>
        {props.desc && <span class="switch-desc">{props.desc}</span>}
      </span>
      <span class="switch-track" aria-hidden="true">
        <span class="switch-knob" />
      </span>
    </button>
  );
}

export function Tabs(props: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
  small?: boolean;
}) {
  return (
    <div class={`tabs ${props.small ? 'is-small' : ''}`} role="tablist">
      {props.options.map((o) => (
        <button
          type="button"
          key={o.id}
          role="tab"
          aria-selected={props.value === o.id ? 'true' : 'false'}
          class={props.value === o.id ? 'is-on' : ''}
          onClick={() => props.onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToastHost() {
  const message = toastMsg.value;
  return (
    <div class={`toast ${message ? 'is-show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function Empty({ children }: { children: ComponentChildren }) {
  return <p class="empty">{children}</p>;
}
