/**
 * 通用撤销栈：undo/redo 之外支持「同 key 短时间合并」，
 * 让拖动滑杆、连按空格这类连续操作只占用一条历史。
 */
export class UndoStack<T> {
  private past: T[] = [];
  private future: T[] = [];
  private lastKey = '';
  private lastTime = 0;

  constructor(
    private limit = 50,
    private mergeWindow = 600,
  ) {}

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  push(snapshot: T, key = 'default', now = Date.now()): void {
    if (key === this.lastKey && now - this.lastTime < this.mergeWindow) {
      this.lastTime = now;
      return;
    }
    this.lastKey = key;
    this.lastTime = now;
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: T): T | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(current);
    this.lastKey = '';
    return prev;
  }

  redo(current: T): T | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    this.lastKey = '';
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.lastKey = '';
  }
}
