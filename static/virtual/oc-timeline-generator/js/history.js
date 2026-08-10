export function cloneProject(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export class ProjectHistory {
  constructor(limit = 20) {
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
    this.lastGroup = "";
    this.lastGroupAt = 0;
  }

  capture(snapshot, group = "") {
    const now = Date.now();
    const shouldMerge = group && group === this.lastGroup && now - this.lastGroupAt < 900;
    if (!shouldMerge) {
      this.undoStack.push(cloneProject(snapshot));
      if (this.undoStack.length > this.limit) this.undoStack.shift();
      this.redoStack = [];
    }
    this.lastGroup = group;
    this.lastGroupAt = now;
  }

  undo(current) {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.redoStack.push(cloneProject(current));
    this.resetGrouping();
    return cloneProject(previous);
  }

  redo(current) {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(cloneProject(current));
    this.resetGrouping();
    return cloneProject(next);
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.resetGrouping();
  }

  resetGrouping() {
    this.lastGroup = "";
    this.lastGroupAt = 0;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
