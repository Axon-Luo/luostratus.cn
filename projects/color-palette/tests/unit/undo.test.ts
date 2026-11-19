import { describe, expect, it } from 'vitest';
import { UndoStack } from '../../src/core/undo';

describe('撤销栈', () => {
  it('undo 返回上一个快照，redo 恢复', () => {
    const stack = new UndoStack<number>();
    expect(stack.canUndo).toBe(false);
    expect(stack.undo(0)).toBeNull();

    stack.push(1, 'a', 0);
    stack.push(2, 'b', 1000);
    expect(stack.canUndo).toBe(true);

    expect(stack.undo(3)).toBe(2);
    expect(stack.canRedo).toBe(true);
    expect(stack.redo(2)).toBe(3);
    expect(stack.canRedo).toBe(false);
    expect(stack.undo(3)).toBe(2);
  });

  it('新操作会清空 redo', () => {
    const stack = new UndoStack<number>();
    stack.push(1, 'a', 0);
    stack.undo(2);
    expect(stack.canRedo).toBe(true);
    stack.push(3, 'b', 1000);
    expect(stack.canRedo).toBe(false);
  });

  it('同 key 短时间合并，不同 key 不合并', () => {
    const stack = new UndoStack<number>();
    stack.push(1, 'drag', 1000);
    stack.push(2, 'drag', 1200);
    stack.push(3, 'drag', 1400);
    expect(stack.undo(4)).toBe(1);
    expect(stack.canUndo).toBe(false);

    stack.push(5, 'a', 5000);
    stack.push(6, 'b', 5100);
    expect(stack.undo(7)).toBe(6);
  });

  it('超出容量丢弃最旧记录', () => {
    const stack = new UndoStack<number>(2);
    stack.push(1, 'a', 0);
    stack.push(2, 'b', 1000);
    stack.push(3, 'c', 2000);
    expect(stack.undo(4)).toBe(3);
    expect(stack.undo(3)).toBe(2);
    expect(stack.undo(2)).toBeNull();
  });

  it('clear 后 undo/redo 均不可用', () => {
    const stack = new UndoStack<number>();
    stack.push(1, 'a', 0);
    stack.undo(2);
    stack.clear();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });
});
