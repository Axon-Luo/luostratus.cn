(function (global) {
  "use strict";

  const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i;

  function create(options = {}) {
    const databaseName = String(options.databaseName || "oc-browser-images");
    const storeName = String(options.storeName || "images");
    const referencePrefix = String(options.referencePrefix || "idb-image:");
    const urlCache = new Map();
    let databasePromise = null;
    let persistenceRequested = false;

    function isReference(value) {
      return String(value || "").startsWith(referencePrefix);
    }

    function isDataImage(value) {
      return DATA_IMAGE_PATTERN.test(String(value || ""));
    }

    function normalize(value) {
      const source = String(value || "");
      return isReference(source) || isDataImage(source) ? source : "";
    }

    function referenceId(reference) {
      return String(reference || "").slice(referencePrefix.length);
    }

    function createId() {
      if (global.crypto?.randomUUID) return global.crypto.randomUUID();
      return `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function openDatabase() {
      if (!global.indexedDB) return Promise.reject(new Error("当前浏览器不支持 IndexedDB。"));
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        const request = global.indexedDB.open(databaseName, 1);
        request.onerror = () => reject(request.error || new Error("无法打开图片数据库。"));
        request.onblocked = () => reject(new Error("图片数据库正被其他页面占用。"));
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
      });
      return databasePromise;
    }

    function dataUrlToBlob(dataUrl) {
      const [header, encoded] = String(dataUrl).split(",");
      const mime = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
      const binary = global.atob(encoded || "");
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: mime });
    }

    function blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("图片读取失败。"));
        reader.readAsDataURL(blob);
      });
    }

    async function requestPersistence() {
      if (persistenceRequested || !global.navigator?.storage?.persist) return false;
      persistenceRequested = true;
      try {
        return await global.navigator.storage.persist();
      } catch {
        return false;
      }
    }

    async function putBlob(blob, id = createId()) {
      if (!(blob instanceof Blob) || !String(blob.type).startsWith("image/")) {
        throw new Error("待保存内容不是有效图片。");
      }
      const database = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).put({
          id,
          blob,
          type: blob.type,
          size: blob.size,
          createdAt: new Date().toISOString()
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("图片保存失败。"));
      });
      const previousUrl = urlCache.get(id);
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      urlCache.set(id, URL.createObjectURL(blob));
      requestPersistence();
      return `${referencePrefix}${id}`;
    }

    async function storeDataUrl(dataUrl) {
      if (isReference(dataUrl)) return dataUrl;
      if (!isDataImage(dataUrl)) return "";
      try {
        return await putBlob(dataUrlToBlob(dataUrl));
      } catch {
        return dataUrl;
      }
    }

    async function getRecord(reference) {
      if (!isReference(reference)) return null;
      const database = await openDatabase();
      return new Promise((resolve, reject) => {
        const request = database.transaction(storeName, "readonly")
          .objectStore(storeName)
          .get(referenceId(reference));
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("图片读取失败。"));
      });
    }

    async function preload(references) {
      const uniqueReferences = [...new Set((references || []).filter(isReference))];
      const missing = [];
      await Promise.all(uniqueReferences.map(async (reference) => {
        const id = referenceId(reference);
        if (urlCache.has(id)) return;
        try {
          const record = await getRecord(reference);
          if (!record?.blob) {
            missing.push(reference);
            return;
          }
          urlCache.set(id, URL.createObjectURL(record.blob));
        } catch {
          missing.push(reference);
        }
      }));
      return { loaded: uniqueReferences.length - missing.length, missing };
    }

    function resolve(value) {
      const source = normalize(value);
      if (!isReference(source)) return source;
      return urlCache.get(referenceId(source)) || "";
    }

    async function toDataUrl(value) {
      const source = normalize(value);
      if (!isReference(source)) return source;
      const record = await getRecord(source);
      return record?.blob ? blobToDataUrl(record.blob) : "";
    }

    async function cleanup(usedReferences) {
      const usedIds = new Set((usedReferences || []).filter(isReference).map(referenceId));
      const database = await openDatabase();
      const records = await new Promise((resolve, reject) => {
        const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error("无法读取图片列表。"));
      });
      const unused = records.filter((record) => !usedIds.has(record.id));
      if (!unused.length) return { removed: 0 };
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        unused.forEach((record) => store.delete(record.id));
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("图片清理失败。"));
      });
      unused.forEach((record) => {
        const url = urlCache.get(record.id);
        if (url) URL.revokeObjectURL(url);
        urlCache.delete(record.id);
      });
      return { removed: unused.length };
    }

    global.addEventListener?.("pagehide", () => {
      urlCache.forEach((url) => URL.revokeObjectURL(url));
      urlCache.clear();
    });

    return {
      isReference,
      isDataImage,
      normalize,
      storeDataUrl,
      preload,
      resolve,
      toDataUrl,
      cleanup
    };
  }

  global.OCImageStore = Object.freeze({ create });
})(window);
