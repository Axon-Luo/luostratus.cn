import { getProject, updatePath } from "../state.js";
import { clear, el } from "../utils/dom.js";
import {
  createSegmented,
  createSwitch,
  createTextField,
  editorBlock
} from "../components/form.js";

const TYPE_FIELDS = {
  quote: [
    ["引用正文", "quote", true],
    ["引用人物", "speaker", false],
    ["引用出处", "source", false],
    ["引用时间", "date", false]
  ],
  summary: [
    ["总结标题", "summaryTitle", false],
    ["总结正文", "summary", true],
    ["后续提示", "nextHint", false]
  ],
  watermark: [
    ["顶部小字", "watermarkLabel", false],
    ["作者名称", "author", false],
    ["项目名称", "projectName", false],
    ["社交账号", "social", false],
    ["网站", "website", false],
    ["版权说明", "copyright", true],
    ["版本号", "version", false],
    ["制作日期", "productionDate", false]
  ]
};

export function renderFooterEditor() {
  const root = document.querySelector("#footer-editor");
  if (!root) return;
  const { footer } = getProject();
  clear(root);

  const settings = editorBlock("尾图设置", "FOOTER");
  settings.dataset.tour = "footer-settings";
  settings.append(createSwitch({
    label: "显示尾图",
    checked: footer.enabled,
    path: ["footer", "enabled"],
    editor: "footer"
  }));
  settings.append(el("div", { className: "field", style: "margin-top:12px" }, [
    el("span", { className: "field-label", text: "内容类型" }),
    createSegmented({
      value: footer.type,
      items: [["quote", "引用"], ["summary", "总结"], ["watermark", "水印"]],
      onChange: (value) => updatePath(["footer", "type"], value, { editor: "footer", structural: true })
    })
  ]));
  settings.append(el("div", { className: "field", style: "margin-top:12px" }, [
    el("span", { className: "field-label", text: "尾图模板" }),
    createSegmented({
      value: footer.template,
      items: [["quote", "居中引用"], ["archive", "档案结束页"], ["copyright", "简洁版权页"]],
      onChange: (value) => updatePath(["footer", "template"], value, { editor: "footer", structural: true })
    })
  ]));
  root.append(settings);

  const fields = editorBlock("尾图内容", footer.type.toUpperCase());
  const grid = el("div", { className: "field-grid" });
  TYPE_FIELDS[footer.type].forEach(([label, key, multiline]) => {
    grid.append(createTextField({
      label,
      value: footer.fields[key],
      path: ["footer", "fields", key],
      editor: "footer",
      multiline,
      tall: multiline,
      placeholder: `填写${label}`
    }));
  });
  fields.append(grid);
  if (footer.type === "summary") {
    fields.append(el("small", {
      className: "field-help",
      text: "可见节点数量与首尾日期会自动显示，无需手动填写。"
    }));
  }
  root.append(fields);
}



