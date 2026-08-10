import { el } from "../utils/dom.js";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const TARGET_BYTES = 2 * 1024 * 1024;

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("请选择有效的图片文件。"));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error("图片超过8MB，请先压缩后再上传。"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("无法读取图片文件。"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片格式无法解析。"));
    image.src = source;
  });
}

function toBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("无法生成裁切图片。"));
    }, "image/webp", quality);
  });
}


export async function openImageCropper(source, {
  aspectRatio = 16 / 9,
  aspectLabel = "16:9",
  title = "调整图片"
} = {}) {
  const sourceUrl = typeof source === "string" ? source : await readFile(source);
  const sourceImage = await loadImage(sourceUrl);

  return new Promise((resolve, reject) => {
    const root = document.querySelector("#dialog-root");
    let stageWidth = 0;
    let stageHeight = 0;
    let baseScale = 1;
    let zoom = 1;
    let left = 0;
    let top = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const image = el("img", {
      src: sourceUrl,
      alt: "待裁切图片",
      draggable: false
    });
    const stage = el("div", {
      className: "crop-stage",
      attrs: { role: "application", "aria-label": "拖动图片调整裁切位置" }
    }, image);
    stage.style.setProperty("--crop-aspect", String(aspectRatio));

    const zoomValue = el("strong", { text: "100%" });
    const zoomInput = el("input", {
      attrs: { type: "range", min: "1", max: "3", step: "0.01", "aria-label": "图片缩放" },
      value: "1"
    });
    const applyButton = el("button", {
      className: "button button-primary",
      type: "button",
      text: "应用裁切"
    });

    const clampPosition = () => {
      const width = sourceImage.naturalWidth * baseScale * zoom;
      const height = sourceImage.naturalHeight * baseScale * zoom;
      left = Math.min(0, Math.max(stageWidth - width, left));
      top = Math.min(0, Math.max(stageHeight - height, top));
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      image.style.left = `${left}px`;
      image.style.top = `${top}px`;
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
    };

    const reset = () => {
      stageWidth = stage.clientWidth;
      stageHeight = stage.clientHeight;
      baseScale = Math.max(
        stageWidth / sourceImage.naturalWidth,
        stageHeight / sourceImage.naturalHeight
      );
      zoom = 1;
      zoomInput.value = "1";
      left = (stageWidth - sourceImage.naturalWidth * baseScale) / 2;
      top = (stageHeight - sourceImage.naturalHeight * baseScale) / 2;
      clampPosition();
    };

    const close = () => {
      document.removeEventListener("keydown", onKeyDown);
      backdrop.remove();
    };

    const cancel = () => {
      close();
      reject(new DOMException("已取消图片裁切。", "AbortError"));
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") cancel();
    };

    stage.addEventListener("pointerdown", (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = left;
      startTop = top;
      stage.classList.add("is-dragging");
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      left = startLeft + event.clientX - startX;
      top = startTop + event.clientY - startY;
      clampPosition();
    });
    const stopDragging = () => {
      dragging = false;
      stage.classList.remove("is-dragging");
    };
    stage.addEventListener("pointerup", stopDragging);
    stage.addEventListener("pointercancel", stopDragging);

    zoomInput.addEventListener("input", (event) => {
      const previousScale = baseScale * zoom;
      const sourceCenterX = (stageWidth / 2 - left) / previousScale;
      const sourceCenterY = (stageHeight / 2 - top) / previousScale;
      zoom = Number(event.target.value);
      const nextScale = baseScale * zoom;
      left = stageWidth / 2 - sourceCenterX * nextScale;
      top = stageHeight / 2 - sourceCenterY * nextScale;
      clampPosition();
    });

    const exportCrop = async () => {
      const displayScale = baseScale * zoom;
      const sourceX = Math.max(0, -left / displayScale);
      const sourceY = Math.max(0, -top / displayScale);
      const sourceWidth = Math.min(sourceImage.naturalWidth - sourceX, stageWidth / displayScale);
      const sourceHeight = Math.min(sourceImage.naturalHeight - sourceY, stageHeight / displayScale);
      const maxOutputWidth = aspectRatio >= 1 ? 1800 : Math.round(1800 * aspectRatio);
      const outputWidth = Math.max(1, Math.min(maxOutputWidth, Math.round(sourceWidth)));
      const outputHeight = Math.max(1, Math.round(outputWidth / aspectRatio));
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      let blob;
      for (const quality of [0.9, 0.78, 0.64]) {
        blob = await toBlob(canvas, quality);
        if (blob.size <= TARGET_BYTES) break;
      }
      if (blob.size > TARGET_BYTES) {
        throw new Error("裁切后的图片仍超过2MB，请放大裁切范围或更换图片。 ");
      }
      return blob;
    };

    applyButton.addEventListener("click", async () => {
      applyButton.disabled = true;
      applyButton.textContent = "正在处理…";
      try {
        const result = await exportCrop();
        close();
        resolve(result);
      } catch (error) {
        applyButton.disabled = false;
        applyButton.textContent = "应用裁切";
        const errorText = dialog.querySelector(".crop-error");
        errorText.textContent = error.message;
        errorText.hidden = false;
      }
    });

    const dialog = el("section", {
      className: "dialog crop-dialog",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "crop-dialog-title" }
    }, [
      el("div", { className: "crop-heading" }, [
        el("div", {}, [
          el("h2", { id: "crop-dialog-title", text: title }),
          el("p", { text: `裁切比例 ${aspectLabel} · 拖动图片调整位置` })
        ]),
        el("button", {
          className: "icon-button",
          type: "button",
          text: "×",
          attrs: { "aria-label": "取消裁切" },
          onClick: cancel
        })
      ]),
      stage,
      el("div", { className: "crop-zoom-row" }, [
        el("span", { text: "缩放" }),
        zoomInput,
        zoomValue
      ]),
      el("p", { className: "crop-error", hidden: true }),
      el("div", { className: "dialog-actions" }, [
        el("button", { className: "button button-ghost", type: "button", text: "取消", onClick: cancel }),
        el("button", { className: "button button-ghost", type: "button", text: "居中复位", onClick: reset }),
        applyButton
      ])
    ]);
    const backdrop = el("div", { className: "dialog-backdrop crop-backdrop" }, dialog);
    root.replaceChildren(backdrop);
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(reset);
  });
}


