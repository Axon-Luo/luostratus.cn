import { el } from "../utils/dom.js";
import {
  resolveImageSource,
  storeImageBlob
} from "../utils/imageStore.js";
import { openImageCropper } from "./imageCropper.js";
import { showToast } from "./toast.js";

export function createImageUploader({
  label,
  value,
  onChange,
  aspectRatio = 16 / 9,
  aspectLabel = "16:9",
  help = "支持 PNG、JPEG、WebP；图片保存在当前浏览器的本地图片库中。"
}) {
  const source = resolveImageSource(value);
  const preview = el("div", { className: "image-preview" });
  if (source) preview.append(el("img", { src: source, alt: `${label}预览` }));
  else if (value) preview.append(el("span", { text: "图片暂时无法读取，可删除后重新上传" }));
  else preview.append(el("span", { text: "尚未选择图片" }));

  const processSource = async (cropSource, title) => {
    try {
      const blob = await openImageCropper(cropSource, { aspectRatio, aspectLabel, title });
      const reference = await storeImageBlob(blob);
      onChange(reference);
      showToast(
        reference.startsWith("idb-image:")
          ? "图片已裁切并保存到本地图片库。"
          : "图片已裁切；当前浏览器使用兼容存储模式。",
        "success"
      );
    } catch (error) {
      if (error?.name !== "AbortError") showToast(error.message, "error", 4200);
    }
  };

  const fileInput = el("input", {
    attrs: { type: "file", accept: "image/*" },
    onChange: async (event) => {
      const [file] = event.target.files;
      event.target.value = "";
      if (!file) return;
      await processSource(file, `裁切${label}`);
    }
  });

  const actions = el("div", { className: "image-upload-actions" }, [
    el("label", { className: "button button-ghost button-small upload-button" }, [
      el("span", { text: value ? "替换图片" : "选择图片" }),
      fileInput
    ]),
    source
      ? el("button", {
          className: "button button-ghost button-small",
          type: "button",
          text: "重新裁切",
          onClick: () => processSource(source, `重新裁切${label}`)
        })
      : null,
    value
      ? el("button", {
          className: "button button-danger button-small",
          type: "button",
          text: "删除",
          onClick: () => onChange("")
        })
      : null
  ]);

  return el("div", { className: "field" }, [
    el("span", { text: label }),
    el("div", { className: "image-uploader" }, [
      preview,
      actions,
      el("small", { className: "field-help", text: help })
    ])
  ]);
}
