const DATABASE_NAME = "oc-timeline-generator.assets.v1";
const DATABASE_VERSION = 1;
const IMAGE_STORE = "images";
const REFERENCE_PREFIX = "idb-image:";

let databasePromise = null;
let persistenceRequested = false;
const objectUrlCache = new Map();

function createAssetId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error("当前浏览器不支持 IndexedDB。"));
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error("无法打开图片数据库。"));
    request.onblocked = () => reject(new Error("图片数据库正被其他页面占用，请关闭重复页面后重试。"));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

async function runRequest(mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE, mode);
    const store = transaction.objectStore(IMAGE_STORE);
    let request;
    try {
      request = operation(store);
    } catch (error) {
      reject(error);
      return;
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || transaction.error || new Error("图片数据库操作失败。"));
    transaction.onabort = () => reject(transaction.error || new Error("图片数据库事务已中止。"));
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("无法读取图片数据。"));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("无法转换旧版图片数据。");
  return response.blob();
}

function cacheBlob(id, blob) {
  const previous = objectUrlCache.get(id);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

function projectImageBindings(project) {
  const bindings = [];
  const add = (container, key) => {
    if (container && typeof container === "object" && typeof container[key] === "string") {
      bindings.push({ container, key });
    }
  };

  const header = project?.header;
  if (header) {
    add(header, "avatar");
    add(header, "emblem");
    add(header, "mainImage");
    add(header, "backgroundImage");
    if (Array.isArray(header.characters)) {
      header.characters.forEach((character) => add(character, "avatar"));
    }
  }

  if (Array.isArray(project?.timeline?.nodes)) {
    project.timeline.nodes.forEach((node) => add(node, "image"));
  }
  return bindings;
}

export function isImageAssetReference(value) {
  return typeof value === "string" && value.startsWith(REFERENCE_PREFIX) && value.length > REFERENCE_PREFIX.length;
}

function referenceId(reference) {
  return isImageAssetReference(reference) ? reference.slice(REFERENCE_PREFIX.length) : "";
}

export function resolveImageSource(value) {
  if (!value) return "";
  if (!isImageAssetReference(value)) return value;
  return objectUrlCache.get(referenceId(value)) || "";
}

export async function requestPersistentImageStorage() {
  if (!navigator.storage?.persist) return false;
  try {
    persistenceRequested = true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storeImageBlob(blob, { fallbackToDataUrl = true } = {}) {
  if (!(blob instanceof Blob) || !blob.type.startsWith("image/")) {
    throw new Error("待保存内容不是有效图片。 ");
  }

  try {
    const id = createAssetId();
    await runRequest("readwrite", (store) => store.put({
      id,
      blob,
      type: blob.type,
      size: blob.size,
      createdAt: new Date().toISOString()
    }));
    cacheBlob(id, blob);
    if (!persistenceRequested) requestPersistentImageStorage();
    return `${REFERENCE_PREFIX}${id}`;
  } catch (error) {
    if (!fallbackToDataUrl) throw error;
    return blobToDataUrl(blob);
  }
}

async function getImageRecord(reference) {
  const id = referenceId(reference);
  if (!id) return null;
  return runRequest("readonly", (store) => store.get(id));
}

export async function preloadProjectImages(project) {
  const references = [...new Set(
    projectImageBindings(project)
      .map(({ container, key }) => container[key])
      .filter(isImageAssetReference)
  )];
  const missing = [];

  await Promise.all(references.map(async (reference) => {
    const id = referenceId(reference);
    if (objectUrlCache.has(id)) return;
    try {
      const record = await getImageRecord(reference);
      if (record?.blob) cacheBlob(id, record.blob);
      else missing.push(reference);
    } catch {
      missing.push(reference);
    }
  }));

  return { loaded: references.length - missing.length, missing };
}

export async function migrateProjectImages(project) {
  const converted = new Map();
  let migrated = 0;

  for (const binding of projectImageBindings(project)) {
    const current = binding.container[binding.key];
    if (!/^data:image\//i.test(current)) continue;
    let next = converted.get(current);
    if (!next) {
      const blob = await dataUrlToBlob(current);
      next = await storeImageBlob(blob);
      converted.set(current, next);
    }
    if (isImageAssetReference(next)) {
      binding.container[binding.key] = next;
      migrated += 1;
    }
  }

  return { migrated };
}

export async function createPortableProject(project) {
  const portable = JSON.parse(JSON.stringify(project));
  for (const binding of projectImageBindings(portable)) {
    const current = binding.container[binding.key];
    if (!isImageAssetReference(current)) continue;
    const record = await getImageRecord(current);
    if (!record?.blob) throw new Error("有图片未能从本地图片库读取，请重新上传后再导出项目。 ");
    binding.container[binding.key] = await blobToDataUrl(record.blob);
  }
  return portable;
}

export async function cleanupUnusedImages(project) {
  const usedIds = new Set(
    projectImageBindings(project)
      .map(({ container, key }) => referenceId(container[key]))
      .filter(Boolean)
  );
  const records = await runRequest("readonly", (store) => store.getAll());
  const unused = records.filter((record) => !usedIds.has(record.id));

  for (const record of unused) {
    await runRequest("readwrite", (store) => store.delete(record.id));
    const url = objectUrlCache.get(record.id);
    if (url) URL.revokeObjectURL(url);
    objectUrlCache.delete(record.id);
  }
  return { removed: unused.length, bytes: unused.reduce((sum, record) => sum + (record.size || 0), 0) };
}

export async function getImageStorageStats(project) {
  try {
    const records = await runRequest("readonly", (store) => store.getAll());
    const usedIds = new Set(
      projectImageBindings(project)
        .map(({ container, key }) => referenceId(container[key]))
        .filter(Boolean)
    );
    return {
      supported: true,
      count: records.length,
      usedCount: records.filter((record) => usedIds.has(record.id)).length,
      bytes: records.reduce((sum, record) => sum + (record.size || 0), 0),
      persistent: navigator.storage?.persisted ? await navigator.storage.persisted() : false
    };
  } catch (error) {
    return { supported: false, count: 0, usedCount: 0, bytes: 0, persistent: false, error: error.message };
  }
}
