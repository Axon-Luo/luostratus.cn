import { el } from "../utils/dom.js";
import { updatePath } from "../state.js";

export function editorBlock(title, subtitle = "") {
  const body = el("div", { className: "editor-block" });
  body.append(el("div", { className: "editor-block-heading" }, [
    el("h3", { text: title }),
    subtitle ? el("small", { text: subtitle }) : null
  ]));
  return body;
}

export function createTextField({
  label,
  value,
  path,
  editor,
  placeholder = "",
  multiline = false,
  tall = false,
  help = "",
  maxLength = 20000,
  onInput
}) {
  const input = el(multiline ? "textarea" : "input", {
    className: tall ? "textarea-tall" : "",
    value: value || "",
    placeholder,
    maxLength,
    attrs: multiline ? {} : { type: "text", autocomplete: "off" },
    onInput: (event) => {
      updatePath(path, event.target.value, {
        group: `input:${path.join(".")}`,
        editor,
        structural: false
      });
      onInput?.(event.target.value);
    }
  });
  const field = el("label", { className: "field" }, [
    el("span", { text: label }),
    input
  ]);
  if (help) field.append(el("small", { className: "field-help", text: help }));
  return field;
}

export function createSelectField({
  label,
  value,
  path,
  editor,
  options,
  structural = true,
  onChange
}) {
  const select = el("select", {
    value,
    onChange: (event) => {
      updatePath(path, event.target.value, { editor, structural });
      onChange?.(event.target.value);
    }
  });
  options.forEach(([optionValue, optionLabel]) => {
    select.append(el("option", { value: optionValue, text: optionLabel }));
  });
  select.value = value;
  return el("label", { className: "field" }, [
    el("span", { text: label }),
    select
  ]);
}

export function createSwitch({
  label,
  checked,
  path,
  editor,
  structural = true,
  onChange
}) {
  const input = el("input", {
    checked,
    attrs: { type: "checkbox" },
    onChange: (event) => {
      updatePath(path, event.target.checked, { editor, structural });
      onChange?.(event.target.checked);
    }
  });
  return el("label", { className: "checkbox-field" }, [
    el("span", { text: label }),
    el("span", { className: "switch" }, [
      input,
      el("span", { className: "switch-track" })
    ])
  ]);
}

export function createSegmented({
  value,
  items,
  onChange
}) {
  const root = el("div", { className: "segmented-control" });
  root.style.setProperty("--segments", String(items.length));
  items.forEach(([itemValue, label]) => {
    root.append(el("button", {
      className: itemValue === value ? "is-active" : "",
      text: label,
      type: "button",
      dataset: { value: itemValue },
      onClick: () => {
        if (itemValue !== value) onChange(itemValue);
      }
    }));
  });
  return root;
}
