import { createTimelineNode } from "../defaults.js";
import { getProject, updatePath, updateProject } from "../state.js";
import { clear, el } from "../utils/dom.js";
import {
  createSegmented,
  createSelectField,
  createSwitch,
  createTextField,
  editorBlock
} from "../components/form.js";
import { createImageUploader } from "../components/imageUploader.js";
import { confirmDialog } from "../components/confirmDialog.js";
import { showToast } from "../components/toast.js";
import { compareTimelineDates } from "../utils/dateSort.js";

let sortableInstance = null;

function nodeAction(index, action) {
  const project = getProject();
  const nodes = project.timeline.nodes;
  if (action === "copy") {
    updateProject((draft) => {
      const source = draft.timeline.nodes[index];
      const copy = createTimelineNode({
        ...source,
        id: undefined,
        title: source.title ? `${source.title}（副本）` : "未命名节点（副本）",
        tags: [...source.tags],
        collapsed: false
      });
      draft.timeline.nodes.splice(index + 1, 0, copy);
    }, { editor: "timeline", structural: true });
  }
  if (action === "up" && index > 0) {
    updateProject((draft) => {
      [draft.timeline.nodes[index - 1], draft.timeline.nodes[index]] =
        [draft.timeline.nodes[index], draft.timeline.nodes[index - 1]];
    }, { editor: "timeline", structural: true });
  }
  if (action === "down" && index < nodes.length - 1) {
    updateProject((draft) => {
      [draft.timeline.nodes[index], draft.timeline.nodes[index + 1]] =
        [draft.timeline.nodes[index + 1], draft.timeline.nodes[index]];
    }, { editor: "timeline", structural: true });
  }
}

function renderTags(container, node, index) {
  const chips = el("div", { className: "tag-chip-row" });
  node.tags.forEach((tag, tagIndex) => {
    chips.append(el("span", { className: "tag-chip" }, [
      el("span", { text: tag }),
      el("button", {
        type: "button",
        text: "×",
        attrs: { "aria-label": `删除标签 ${tag}` },
        onClick: () => {
          updateProject((draft) => {
            draft.timeline.nodes[index].tags.splice(tagIndex, 1);
          }, { editor: "timeline", structural: true });
        }
      })
    ]));
  });

  const input = el("input", {
    placeholder: "输入标签后回车",
    maxLength: 60,
    attrs: { type: "text" }
  });
  const addTag = () => {
    const value = input.value.trim();
    if (!value || node.tags.includes(value)) return;
    updateProject((draft) => {
      draft.timeline.nodes[index].tags.push(value);
    }, { editor: "timeline", structural: true });
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  });
  container.append(el("div", { className: "field" }, [
    el("span", { text: "标签" }),
    chips,
    el("div", { className: "tag-input-row" }, [
      input,
      el("button", { className: "button button-ghost button-small", type: "button", text: "添加", onClick: addTag })
    ])
  ]));
}

function renderNode(node, index, timelineTemplate) {
  const titleText = node.title || "未命名节点";
  const dateText = node.date || "日期未填写";
  const summaryTitle = el("strong", { text: titleText });
  const summaryDate = el("small", { text: dateText });

  const header = el("div", { className: "node-editor-header" }, [
    el("button", {
      className: "drag-handle",
      type: "button",
      text: "⠿",
      attrs: { title: "拖动排序", "aria-label": "拖动排序" }
    }),
    el("div", { className: "node-editor-summary" }, [summaryTitle, summaryDate]),
    el("div", { className: "node-header-actions" }, [
      el("button", {
        type: "button",
        text: node.visible ? "◉" : "○",
        attrs: { title: node.visible ? "隐藏节点" : "显示节点", "aria-label": node.visible ? "隐藏节点" : "显示节点" },
        onClick: () => updatePath(["timeline", "nodes", index, "visible"], !node.visible, {
          editor: "timeline",
          structural: true
        })
      }),
      el("button", {
        type: "button",
        text: node.collapsed ? "＋" : "－",
        attrs: { title: node.collapsed ? "展开编辑" : "折叠编辑", "aria-label": node.collapsed ? "展开编辑" : "折叠编辑" },
        onClick: () => updatePath(["timeline", "nodes", index, "collapsed"], !node.collapsed, {
          editor: "timeline",
          structural: true
        })
      })
    ])
  ]);

  const wrapper = el("article", {
    className: `node-editor${node.visible ? "" : " is-hidden"}`,
    dataset: { nodeId: node.id, ...(index === 0 ? { tour: "event-card" } : {}) }
  }, header);
  if (node.collapsed) return wrapper;

  const body = el("div", { className: "node-editor-body" });
  const basic = el("div", { className: "field-grid" }, [
    createTextField({
      label: "日期",
      value: node.date,
      path: ["timeline", "nodes", index, "date"],
      editor: "timeline",
      placeholder: "如：第三纪元3019年",
      onInput: (value) => { summaryDate.textContent = value || "日期未填写"; }
    }),
    createTextField({
      label: "年龄",
      value: node.age,
      path: ["timeline", "nodes", index, "age"],
      editor: "timeline",
      placeholder: "可选，不自动计算"
    }),
    createTextField({
      label: "标题",
      value: node.title,
      path: ["timeline", "nodes", index, "title"],
      editor: "timeline",
      onInput: (value) => { summaryTitle.textContent = value || "未命名节点"; }
    }),
    createTextField({
      label: "简介",
      value: node.summary,
      path: ["timeline", "nodes", index, "summary"],
      editor: "timeline",
      multiline: true
    }),
    createTextField({
      label: "详细正文",
      value: node.content,
      path: ["timeline", "nodes", index, "content"],
      editor: "timeline",
      multiline: true,
      tall: true
    }),
    createTextField({
      label: "地点",
      value: node.location,
      path: ["timeline", "nodes", index, "location"],
      editor: "timeline"
    }),
    createTextField({
      label: "参与人物",
      value: node.participants,
      path: ["timeline", "nodes", index, "participants"],
      editor: "timeline"
    }),
    createSelectField({
      label: "重要程度",
      value: node.importance,
      path: ["timeline", "nodes", index, "importance"],
      editor: "timeline",
      options: [["normal", "普通"], ["important", "重要"], ["critical", "关键"]],
      structural: false
    })
  ]);
  body.append(basic);
  renderTags(body, node, index);
  const checkerboardImage = timelineTemplate === "checkerboard";
  body.append(createImageUploader({
    label: checkerboardImage ? "事件卡片图片" : "节点图片",
    value: node.image,
    aspectRatio: checkerboardImage ? 1 : 16 / 9,
    aspectLabel: checkerboardImage ? "1:1" : "16:9",
    onChange: (value) => updatePath(["timeline", "nodes", index, "image"], value, {
      editor: "timeline",
      structural: true
    })
  }));
  body.append(createTextField({
    label: "图片说明",
    value: node.imageCaption,
    path: ["timeline", "nodes", index, "imageCaption"],
    editor: "timeline"
  }));
  body.append(el("div", { className: "node-toolbar", style: "margin-top:12px" }, [
    el("button", { className: "button button-ghost button-small", type: "button", text: "复制", onClick: () => nodeAction(index, "copy") }),
    el("button", { className: "button button-ghost button-small", type: "button", text: "上移", disabled: index === 0, onClick: () => nodeAction(index, "up") }),
    el("button", { className: "button button-ghost button-small", type: "button", text: "下移", disabled: index === getProject().timeline.nodes.length - 1, onClick: () => nodeAction(index, "down") }),
    el("button", {
      className: "button button-danger button-small",
      type: "button",
      text: "删除",
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: "删除这个时间节点？",
          message: `“${node.title || node.date || "未命名节点"}”将从项目中删除。此操作可以撤销。`,
          confirmText: "删除节点",
          danger: true
        });
        if (!confirmed) return;
        updateProject((draft) => {
          draft.timeline.nodes.splice(index, 1);
        }, { editor: "timeline", structural: true });
      }
    })
  ]));
  wrapper.append(body);
  return wrapper;
}

function initSortable(list) {
  sortableInstance?.destroy?.();
  if (!globalThis.Sortable) {
    showToast("拖动组件未加载；仍可使用上移和下移排序。", "error", 4500);
    return;
  }
  sortableInstance = new Sortable(list, {
    handle: ".drag-handle",
    animation: 150,
    ghostClass: "is-dragging",
    onEnd: () => {
      const ids = [...list.querySelectorAll("[data-node-id]")].map((item) => item.dataset.nodeId);
      updateProject((draft) => {
        const map = new Map(draft.timeline.nodes.map((node) => [node.id, node]));
        draft.timeline.nodes = ids.map((id) => map.get(id)).filter(Boolean);
      }, { editor: "timeline", structural: true });
    }
  });
}

export function renderTimelineEditor(options = {}) {
  const root = document.querySelector("#timeline-editor");
  if (!root) return;
  const { timeline } = getProject();
  clear(root);

  const settings = editorBlock("时间轴结构", "LAYOUT");
  settings.dataset.tour = "timeline-layout";
  settings.append(el("div", { className: "field" }, [
    el("span", { className: "field-label", text: "结构模板" }),
    createSegmented({
      value: timeline.template,
      items: [["left", "左侧日期"], ["alternating", "左右交错"], ["archive", "档案列表"], ["checkerboard", "棋盘格"]],
      onChange: (value) => updatePath(["timeline", "template"], value, { editor: "timeline", structural: true })
    })
  ]));
  settings.append(el("div", { className: "field", style: "margin-top:12px" }, [
    el("span", { className: "field-label", text: "卡片模板" }),
    createSegmented({
      value: timeline.cardTemplate,
      items: [["standard", "标准"], ["minimal", "极简"], ["archive", "档案"]],
      onChange: (value) => updatePath(["timeline", "cardTemplate"], value, { editor: "timeline", structural: true })
    })
  ]));
  root.append(settings);

  const listBlock = editorBlock("时间节点", `${timeline.nodes.length} NODES`);
  listBlock.append(el("div", { className: "inline-actions", dataset: { tour: "timeline-actions" } }, [
    el("button", {
      className: "button button-primary button-small",
      type: "button",
      text: "＋ 新增节点",
      onClick: () => {
        const node = createTimelineNode({ title: "新的时间节点", collapsed: false });
        updateProject((draft) => {
          draft.timeline.nodes.push(node);
        }, { editor: "timeline", structural: true, source: "add-node" });
        requestAnimationFrame(() => {
          const target = document.querySelector(`[data-node-id="${node.id}"]`);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
          target?.querySelector('input[type="text"]')?.focus();
        });
      }
    }),
    el("button", {
      className: "button button-ghost button-small",
      type: "button",
      text: "按日期文字排序",
      disabled: timeline.nodes.length < 2,
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: "按日期文字排序？",
          message: "将优先提取年份数值排序，其中“元年”视为0年；无法识别年份时使用日期文字排序。结果可以撤销。",
          confirmText: "开始排序"
        });
        if (!confirmed) return;
        updateProject((draft) => {
          draft.timeline.nodes.sort((a, b) => compareTimelineDates(a.date, b.date));
        }, { editor: "timeline", structural: true });
      }
    })
  ]));

  const list = el("div", { className: "timeline-editor-list", attrs: { id: "timeline-editor-list" } });
  timeline.nodes.forEach((node, index) => list.append(renderNode(node, index, timeline.template)));
  if (!timeline.nodes.length) {
    list.append(el("p", {
      className: "empty-editor-note",
      text: "当前没有时间节点。点击“新增节点”开始编写。"
    }));
  }
  listBlock.append(list);
  root.append(listBlock);
  if (timeline.nodes.length) initSortable(list);
}






