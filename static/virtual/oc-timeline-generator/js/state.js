import { createDefaultExample } from "./projectPresets.js";
import { ProjectHistory, cloneProject } from "./history.js";
import { loadStoredProject, saveStoredProject } from "./storage.js";
import { normalizeProject } from "./utils/validation.js";

const listeners = new Set();
const history = new ProjectHistory(20);
const loaded = loadStoredProject();
let project = normalizeProject(loaded.project || createDefaultExample("person"));
let saveTimer = 0;
let lastStorageError = loaded.error;

function emit(meta = {}) {
  const detail = {
    ...meta,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    storageError: lastStorageError
  };
  listeners.forEach((listener) => listener(project, detail));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  emit({ type: "saving" });
  saveTimer = window.setTimeout(() => {
    const result = saveStoredProject(project);
    lastStorageError = result.ok ? null : result.error;
    emit({ type: result.ok ? "saved" : "storage-error" });
  }, 400);
}

export function getProject() {
  return project;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateProject(mutator, options = {}) {
  const {
    history: shouldCapture = true,
    group = "",
    editor = "",
    structural = false,
    source = "edit"
  } = options;

  if (shouldCapture) history.capture(project, group);
  mutator(project);
  project.updatedAt = new Date().toISOString();
  project = normalizeProject(project);
  scheduleSave();
  emit({ type: "change", editor, structural, source });
}

export function updatePath(path, value, options = {}) {
  updateProject((draft) => {
    let target = draft;
    path.slice(0, -1).forEach((part) => {
      target = target[part];
    });
    target[path.at(-1)] = value;
  }, options);
}

export function replaceProject(nextProject, options = {}) {
  project = normalizeProject(cloneProject(nextProject));
  history.clear();
  if (options.freshIdentity) {
    project.id = crypto.randomUUID?.() || `oc-${Date.now()}`;
    project.createdAt = new Date().toISOString();
    project.updatedAt = project.createdAt;
  }
  const result = saveStoredProject(project);
  lastStorageError = result.ok ? null : result.error;
  emit({
    type: result.ok ? "replace" : "storage-error",
    structural: true,
    editor: "all",
    source: options.source || "replace"
  });
}

export function saveNow() {
  clearTimeout(saveTimer);
  const result = saveStoredProject(project);
  lastStorageError = result.ok ? null : result.error;
  emit({ type: result.ok ? "saved" : "storage-error" });
  return result;
}

export function undo() {
  const previous = history.undo(project);
  if (!previous) return false;
  project = normalizeProject(previous);
  scheduleSave();
  emit({ type: "history", structural: true, editor: "all", source: "undo" });
  return true;
}

export function redo() {
  const next = history.redo(project);
  if (!next) return false;
  project = normalizeProject(next);
  scheduleSave();
  emit({ type: "history", structural: true, editor: "all", source: "redo" });
  return true;
}

export function clearHistory() {
  history.clear();
  emit({ type: "history-reset", structural: false, editor: "", source: "storage-cleanup" });
}

export function getInitialStorageError() {
  return lastStorageError;
}



