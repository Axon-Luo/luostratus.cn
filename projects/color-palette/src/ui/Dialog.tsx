import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export function Dialog(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  footer?: ComponentChildren;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (props.open && !el.open) el.showModal();
    if (!props.open && el.open) el.close();
  }, [props.open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      props.onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [props.onClose]);

  return (
    <dialog
      ref={ref}
      class={`dialog ${props.wide ? 'is-wide' : ''}`}
      onClick={(event) => {
        if (event.target === ref.current) props.onClose();
      }}
      onClose={() => {
        if (props.open) props.onClose();
      }}
    >
      <div class="dialog-box">
        <header class="dialog-head">
          <h2>{props.title}</h2>
          <button type="button" class="icon-btn" aria-label="关闭" onClick={props.onClose}>
            ×
          </button>
        </header>
        <div class="dialog-body">{props.children}</div>
        {props.footer && <footer class="dialog-foot">{props.footer}</footer>}
      </div>
    </dialog>
  );
}
