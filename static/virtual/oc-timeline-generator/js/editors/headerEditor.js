import { createHeaderCharacter } from "../defaults.js";
import { createDefaultExample } from "../projectPresets.js";
import { getProject, updatePath, updateProject } from "../state.js";
import { clear, el } from "../utils/dom.js";
import {
  createSegmented,
  createSwitch,
  createTextField,
  editorBlock
} from "../components/form.js";
import { createImageUploader } from "../components/imageUploader.js";

const TYPE_FIELDS = {
  world: [
    ["中文标题", "title", false],
    ["外文标题", "foreignTitle", false],
    ["副标题", "subtitle", false],
    ["纪年法名称", "calendarName", false],
    ["时间范围", "dateRange", false],
    ["简介", "description", true],
    ["作者名称", "author", false]
  ],
  event: [
    ["事件名称", "eventName", false],
    ["事件代号", "eventCode", false],
    ["起始日期", "startDate", false],
    ["结束日期", "endDate", false],
    ["发生地点", "location", false],
    ["参与者", "participants", false],
    ["事件简介", "eventDescription", true],
    ["最终结果", "result", true]
  ]
};

const TYPE_IMAGES = {
  world: [["徽章图片", "emblem", 1, "1:1"], ["背景图片", "backgroundImage", 16 / 9, "16:9"]],
  event: [["主视觉图片", "mainImage", 4 / 5, "4:5"], ["背景图片", "backgroundImage", 16 / 9, "16:9"]]
};

const CHARACTER_FIELDS = [
  ["人物姓名", "name", false],
  ["外文名", "foreignName", false],
  ["别名", "alias", false],
  ["出生日期", "birthDate", false],
  ["死亡日期", "deathDate", false],
  ["身份", "identity", false],
  ["所属阵营", "faction", false],
  ["人物简介", "biography", true],
  ["人物引用", "quote", true]
];

function renderCharacterEditor(header, character, index) {
  const details = el("details", {
    className: "character-editor",
    open: index === 0
  });
  details.append(el("summary", {}, [
    el("span", { className: "character-index", text: String(index + 1).padStart(2, "0") }),
    el("span", {}, [
      el("strong", { text: character.name || `人物 ${index + 1}` }),
      el("small", { text: character.identity || character.faction || "点击展开人物资料" })
    ])
  ]));

  const body = el("div", { className: "character-editor-body" });
  const grid = el("div", { className: "field-grid" });
  CHARACTER_FIELDS.forEach(([label, key, multiline]) => {
    grid.append(createTextField({
      label,
      value: character[key],
      path: ["header", "characters", index, key],
      editor: "header",
      multiline,
      tall: multiline,
      placeholder: `填写${label}`
    }));
  });
  body.append(grid);
  body.append(createImageUploader({
    label: `人物 ${index + 1} 头像或立绘`,
    value: character.avatar,
    aspectRatio: header.portraitShape === "round" ? 1 : 4 / 5,
    aspectLabel: header.portraitShape === "round" ? "1:1" : "4:5",
    onChange: (value) => updatePath(["header", "characters", index, "avatar"], value, {
      editor: "header",
      structural: true
    })
  }));
  details.append(body);
  return details;
}

function renderPersonContent(root, header) {
  if (header.characterCount >= 2) {
    const relationBlock = editorBlock("群组关系", "RELATION");
    relationBlock.append(createTextField({
      label: "人物关系",
      value: header.relationship,
      path: ["header", "relationship"],
      editor: "header",
      placeholder: "例如：双生姐妹、宿敌、同盟、师徒",
      multiline: true,
      help: "这段关系说明会显示在多人物头图上。"
    }));
    root.append(relationBlock);
  }

  const peopleBlock = editorBlock("人物资料", `${header.characterCount} PEOPLE`);
  peopleBlock.append(el("p", {
    className: "field-help character-count-help",
    text: "每个人物资料独立保存。减少显示人数不会删除已填写的其他人物。"
  }));
  const list = el("div", { className: "character-editor-list" });
  header.characters.slice(0, header.characterCount).forEach((character, index) => {
    list.append(renderCharacterEditor(header, character, index));
  });
  peopleBlock.append(list);
  root.append(peopleBlock);

  const backgroundBlock = editorBlock("共享背景", "BACKGROUND");
  backgroundBlock.append(createImageUploader({
    label: "头图背景图片",
    value: header.backgroundImage,
    aspectRatio: 16 / 9,
    aspectLabel: "16:9",
    onChange: (value) => updatePath(["header", "backgroundImage"], value, {
      editor: "header",
      structural: true
    })
  }));
  root.append(backgroundBlock);
}

export function renderHeaderEditor() {
  const root = document.querySelector("#header-editor");
  if (!root) return;
  const project = getProject();
  const { header } = project;
  clear(root);

  const settings = editorBlock("头图设置", "HEADER");
  settings.append(createSwitch({
    label: "显示头图",
    checked: header.enabled,
    path: ["header", "enabled"],
    editor: "header"
  }));
  settings.append(el("div", { className: "field", style: "margin-top:12px", dataset: { tour: "content-type" } }, [
    el("span", { className: "field-label", text: "内容类型" }),
    createSegmented({
      value: header.type,
      items: [["world", "世界观"], ["person", "人物"], ["event", "事件"]],
      onChange: (value) => {
        const currentProject = getProject();
        const example = createDefaultExample(value);
        example.theme = { ...currentProject.theme };
        example.canvas = { ...currentProject.canvas };
        updateProject((draft) => {
          const identity = { id: draft.id, createdAt: draft.createdAt };
          Object.assign(draft, example, identity);
        }, { editor: "all", structural: true, source: `type-example:${value}` });
      }
    })
  ]));

  if (header.type === "person") {
    settings.append(el("div", { className: "field", style: "margin-top:12px" }, [
      el("span", { className: "field-label", text: "头图人物数量" }),
      createSegmented({
        value: String(header.characterCount),
        items: [["1", "1人"], ["2", "2人"], ["3", "3人"], ["4", "4人"]],
        onChange: (value) => updateProject((draft) => {
          const count = Number(value);
          draft.header.characterCount = count;
          while (draft.header.characters.length < count) {
            draft.header.characters.push(createHeaderCharacter());
          }
        }, { editor: "header", structural: true })
      })
    ]));
  }

  settings.append(el("div", { className: "field", style: "margin-top:12px", dataset: { tour: "header-layout" } }, [
    el("span", { className: "field-label", text: "头图模板" }),
    createSegmented({
      value: header.template,
      items: [["centered", "居中标题"], ["split", "左图右文"], ["archive", "档案封面"]],
      onChange: (value) => updatePath(["header", "template"], value, { editor: "header", structural: true })
    })
  ]));

  if (header.type === "person") {
    settings.append(el("div", { className: "field", style: "margin-top:12px" }, [
      el("span", { className: "field-label", text: "人物图片形状" }),
      createSegmented({
        value: header.portraitShape,
        items: [["square", "方形"], ["round", "圆形"]],
        onChange: (value) => updatePath(["header", "portraitShape"], value, { editor: "header", structural: true })
      })
    ]));
  }

  settings.append(el("div", { className: "header-overlay-controls" }, [
    createSwitch({
      label: "启用背景蒙版",
      checked: header.overlayEnabled,
      path: ["header", "overlayEnabled"],
      editor: "header",
      structural: true
    }),
    header.overlayEnabled
      ? el("div", { className: "field", style: "margin-top:10px" }, [
          el("span", { className: "field-label", text: "蒙版颜色" }),
          createSegmented({
            value: header.overlayColor,
            items: [["black", "黑色蒙版"], ["white", "白色蒙版"]],
            onChange: (value) => updatePath(["header", "overlayColor"], value, { editor: "header", structural: true })
          })
        ])
      : null
  ]));
  root.append(settings);

  if (header.type === "person") {
    renderPersonContent(root, header);
    return;
  }

  const fields = editorBlock("文字内容", header.type.toUpperCase());
  const fieldGrid = el("div", { className: "field-grid" });
  TYPE_FIELDS[header.type].forEach(([label, key, multiline]) => {
    fieldGrid.append(createTextField({
      label,
      value: header.fields[key],
      path: ["header", "fields", key],
      editor: "header",
      multiline,
      tall: multiline,
      placeholder: `填写${label}`
    }));
  });
  fields.append(fieldGrid);
  root.append(fields);

  const images = editorBlock("本地图片", "MEDIA");
  const imageGrid = el("div", { className: "field-grid" });
  TYPE_IMAGES[header.type].forEach(([label, key, aspectRatio, aspectLabel]) => {
    imageGrid.append(createImageUploader({
      label,
      value: header[key],
      aspectRatio,
      aspectLabel,
      onChange: (value) => updatePath(["header", key], value, {
        editor: "header",
        structural: true
      })
    }));
  });
  images.append(imageGrid);
  root.append(images);
}




