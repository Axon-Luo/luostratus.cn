import { useEffect, useRef, useState } from 'preact/hooks';
import { openCamera, stopStream } from '../../core/capture';
import { extractColors } from '../../core/image/quantize';
import { Dialog } from '../../ui/Dialog';

export function CameraDialog(props: {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!props.open) {
      stopStream(streamRef.current);
      streamRef.current = null;
      setReady(false);
      setColors([]);
      setError('');
      return;
    }

    let canceled = false;
    setError('');
    setColors([]);
    setReady(false);

    void (async () => {
      try {
        const stream = await openCamera();
        if (canceled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          try {
            await video.play();
          } catch {
            /* 用户手势前可能无法自动播放，画面仍会显示 */
          }
        }
        if (!canceled) setReady(true);
      } catch (raw) {
        if (canceled) return;
        const code = (raw as { code?: string })?.code;
        setError(
          code === 'denied'
            ? '摄像头权限被拒绝，请在浏览器设置里允许后重试'
            : code === 'insecure'
              ? '摄像头需要 HTTPS 或 localhost 才能使用'
              : code === 'unsupported'
                ? '当前浏览器不支持摄像头取色，可以改用上传图片'
                : '没有找到可用的摄像头',
        );
      }
    })();

    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = Math.max(1, Math.round((64 * video.videoHeight) / video.videoWidth));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const next = extractColors(data.data, canvas.width, canvas.height, { k: 5 });
      setColors(next.slice(0, 6));
    }, 300);

    return () => {
      canceled = true;
      clearInterval(timer);
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [props.open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    props.onCapture(canvas.toDataURL('image/jpeg', 0.88));
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="摄像头取色"
      wide
      footer={
        <>
          <span class="hint">对准生活里的颜色，快门后自动提取主色</span>
          <button type="button" class="btn ghost" onClick={props.onClose}>
            取消
          </button>
          <button type="button" class="btn primary" disabled={!ready || !!error} onClick={capture}>
            快门
          </button>
        </>
      }
    >
      {error ? (
        <div class="camera-error">
          <p>{error}</p>
          <button type="button" class="btn ghost sm" onClick={props.onClose}>
            改用上传图片
          </button>
        </div>
      ) : (
        <>
          <div class="camera-stage">
            <video ref={videoRef} muted playsInline autoPlay aria-label="摄像头预览" />
            {!ready && <span class="camera-loading">正在打开摄像头…</span>}
          </div>
          <div class="camera-live">
            <span class="field-label">实时主色</span>
            <div class="mini-swatches">
              {(colors.length ? colors : ['#D9D5CC', '#D9D5CC', '#D9D5CC', '#D9D5CC', '#D9D5CC']).map(
                (hex, index) => (
                  <span key={`${hex}-${index}`} style={{ background: hex }} title={hex} aria-hidden="true" />
                ),
              )}
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
