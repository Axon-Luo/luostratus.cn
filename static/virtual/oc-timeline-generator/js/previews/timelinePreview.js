import { clear, el } from "../utils/dom.js";
import { resolveImageSource } from "../utils/imageStore.js";

function addText(parent, tag, className, text) {
  if (!text) return null;
  const node = el(tag, { className, text });
  parent.append(node);
  return node;
}

function createMedia(node) {
  const source = resolveImageSource(node.image);
  if (!source) return null;
  return el("figure", { className: "card-media" }, [
    el("img", { src: source, alt: node.imageCaption || node.title || "时间节点图片" }),
    node.imageCaption ? el("figcaption", { text: node.imageCaption }) : null
  ]);
}

function createTags(tags) {
  if (!tags.length) return null;
  return el("div", { className: "card-tags" },
    tags.map((tag) => el("span", { className: "card-tag", text: tag }))
  );
}

function createCard(node, index, cardTemplate) {
  const card = el("article", { className: `timeline-card card-${cardTemplate}` });

  if (node.importance !== "normal") {
    card.append(el("p", {
      className: "card-archive-number",
      text: node.importance === "critical" ? "◆ KEY EVENT / 关键事件" : "● IMPORTANT / 重要事件"
    }));
  }

  if (cardTemplate === "archive") {
    card.append(el("p", {
      className: "card-archive-number",
      text: `RECORD ${String(index + 1).padStart(3, "0")} / ${node.id.slice(0, 8).toUpperCase()}`
    }));
    addText(card, "h3", "", node.title);
    const meta = el("div", { className: "card-meta" });
    if (node.location) meta.append(el("span", { text: `地点：${node.location}` }));
    if (node.participants) meta.append(el("span", { text: `参与者：${node.participants}` }));
    if (node.age) meta.append(el("span", { text: `年龄：${node.age}` }));
    if (meta.children.length) card.append(meta);
    addText(card, "p", "card-content", node.content || node.summary);
    const media = createMedia(node);
    const tags = createTags(node.tags);
    if (media) card.append(media);
    if (tags) card.append(tags);
    return card;
  }

  addText(card, "h3", "", node.title);
  addText(card, "p", "card-summary", node.summary);

  if (cardTemplate === "standard") {
    addText(card, "p", "card-content", node.content);
    const media = createMedia(node);
    if (media) card.append(media);
    const meta = el("div", { className: "card-meta" });
    if (node.location) meta.append(el("span", { text: `地点：${node.location}` }));
    if (node.participants) meta.append(el("span", { text: `参与者：${node.participants}` }));
    if (node.age) meta.append(el("span", { text: `年龄：${node.age}` }));
    if (meta.children.length) card.append(meta);
    const tags = createTags(node.tags);
    if (tags) card.append(tags);
  } else if (node.age) {
    card.append(el("div", { className: "card-meta" }, [
      el("span", { text: `年龄：${node.age}` })
    ]));
  }
  return card;
}

function createCheckerboardEntry(node, index, cardTemplate) {
  const imageSource = resolveImageSource(node.image);
  const dateTile = el("div", { className: "checkerboard-date-tile" }, [
    el("span", {
      className: "checkerboard-tile-index",
      text: String(index + 1).padStart(2, "0")
    }),
    el("time", {
      className: "checkerboard-date",
      text: node.date || "时间不明"
    })
  ]);

  const eventCard = el("article", {
    className: `checkerboard-event-card card-${cardTemplate}${imageSource ? " has-image" : ""}`
  }, [
    imageSource
      ? el("img", {
        className: "checkerboard-event-image",
        src: imageSource,
        alt: node.imageCaption || node.title || "事件图片"
      })
      : el("span", {
        className: "checkerboard-event-placeholder",
        text: `EVENT ${String(index + 1).padStart(2, "0")}`
      }),
    el("div", { className: "checkerboard-event-copy" }, [
      el("p", {
        className: "checkerboard-event-kicker",
        text: [
          node.location || `EVENT ${String(index + 1).padStart(2, "0")}`,
          node.age ? `年龄 ${node.age}` : ""
        ].filter(Boolean).join(" · ")
      }),
      el("h3", { text: node.title || "未命名事件" }),
      node.summary
        ? el("p", { className: "checkerboard-event-summary", text: node.summary })
        : null
    ])
  ]);

  return el("section", {
    className: `timeline-entry checkerboard-entry importance-${node.importance}`
  }, [eventCard, dateTile]);
}

export function renderTimelinePreview(project) {
  const root = document.querySelector("#timeline-preview");
  if (!root) return;
  clear(root);
  const visibleNodes = project.timeline.nodes.filter((node) => node.visible);

  root.append(el("header", { className: "timeline-heading" }, [
    el("div", {}, [
      el("p", { className: "canvas-kicker", text: "CHRONOLOGY" }),
      el("h2", { text: "事件年表" })
    ]),
    el("span", {
      className: "timeline-count",
      text: `${visibleNodes.length} VISIBLE / ${project.timeline.nodes.length} TOTAL`
    })
  ]));

  if (!visibleNodes.length) {
    root.append(el("p", {
      className: "timeline-empty",
      text: "当前没有可见的时间节点。"
    }));
    return;
  }

  const list = el("div", {
    className: `timeline-list template-${project.timeline.template}`
  });
  visibleNodes.forEach((node, index) => {
    if (project.timeline.template === "checkerboard") {
      list.append(createCheckerboardEntry(node, index, project.timeline.cardTemplate));
      return;
    }

    const date = el("div", {
      className: "timeline-date",
      text: node.date || "时间不明"
    });
    list.append(el("section", {
      className: `timeline-entry importance-${node.importance}`
    }, [
      date,
      el("span", { className: "timeline-marker", attrs: { "aria-hidden": "true" } }),
      createCard(node, index, project.timeline.cardTemplate)
    ]));
  });
  root.append(list);
}


