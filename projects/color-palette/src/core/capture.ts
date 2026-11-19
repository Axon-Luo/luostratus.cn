import { normalizeHex } from './color/convert';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open: () => Promise<EyeDropperResult>;
}

type EyeDropperConstructor = new () => EyeDropperInstance;

export type CaptureError = 'unsupported' | 'canceled' | 'denied' | 'no-device' | 'insecure';

export function supportsEyeDropper(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
}

/** 打开系统级屏幕吸管；取消返回 null。 */
export async function pickScreenColor(): Promise<string | null> {
  if (!supportsEyeDropper()) throw Object.assign(new Error('unsupported'), { code: 'unsupported' });
  const Ctor = (window as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper;
  try {
    const result = await new Ctor().open();
    return normalizeHex(result.sRGBHex);
  } catch {
    return null;
  }
}

export function cameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/** 请求后置摄像头；调用方负责在关闭时 stop。 */
export async function openCamera(): Promise<MediaStream> {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    throw Object.assign(new Error('insecure'), { code: 'insecure' });
  }
  if (!cameraSupported()) {
    throw Object.assign(new Error('unsupported'), { code: 'unsupported' });
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    });
  } catch (error) {
    const name = (error as { name?: string })?.name ?? '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw Object.assign(new Error('denied'), { code: 'denied' });
    }
    throw Object.assign(new Error('no-device'), { code: 'no-device' });
  }
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
