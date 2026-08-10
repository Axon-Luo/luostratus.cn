import { clear, el } from "../utils/dom.js";

function visibleStats(project) {
  const nodes = project.timeline.nodes.filter((node) => node.visible);
  return {
    count: nodes.length,
    first: nodes[0]?.date || "—",
    last: nodes.at(-1)?.date || "—"
  };
}

function createStats(project) {
  const stats = visibleStats(project);
  return el("div", { className: "footer-stats" }, [
    el("div", {}, [
      el("strong", { text: String(stats.count) }),
      el("span", { text: "可见节点" })
    ]),
    el("div", {}, [
      el("strong", { text: stats.first }),
      el("span", { text: "起始记录" })
    ]),
    el("div", {}, [
      el("strong", { text: stats.last }),
      el("span", { text: "最终记录" })
    ])
  ]);
}

function quoteContent(fields) {
  return el("div", {}, [
    fields.quote ? el("blockquote", { text: fields.quote }) : null,
    [fields.speaker, fields.source, fields.date].some(Boolean)
      ? el("p", {
          className: "footer-citation",
          text: [fields.speaker, fields.source, fields.date].filter(Boolean).join(" · ")
        })
      : null
  ]);
}

function summaryContent(fields, project) {
  return el("div", {}, [
    el("p", { className: "canvas-kicker", text: "END OF RECORD" }),
    fields.summaryTitle ? el("h2", { text: fields.summaryTitle }) : null,
    fields.summary ? el("p", { className: "footer-copy", text: fields.summary }) : null,
    fields.nextHint ? el("p", { className: "footer-citation", text: fields.nextHint }) : null,
    createStats(project)
  ]);
}

function watermarkContent(fields, project) {
  const title = fields.projectName || project.name;
  return el("div", {}, [
    fields.watermarkLabel ? el("p", { className: "canvas-kicker", text: fields.watermarkLabel }) : null,
    title ? el("h2", { text: title }) : null,
    fields.copyright ? el("p", { className: "footer-copy", text: fields.copyright }) : null,
    el("div", { className: "copyright-meta" }, [
      fields.author ? el("p", { text: fields.author }) : null,
      fields.social ? el("p", { text: fields.social }) : null,
      fields.website ? el("p", { text: fields.website }) : null,
      [fields.version, fields.productionDate].some(Boolean)
        ? el("p", { text: [fields.version, fields.productionDate].filter(Boolean).join(" · ") })
        : null
    ])
  ]);
}

export function renderFooterPreview(project) {
  const root = document.querySelector("#footer-preview");
  if (!root) return;
  const { footer } = project;
  clear(root);
  root.hidden = !footer.enabled;
  if (!footer.enabled) return;

  const classByTemplate = {
    quote: "footer-template-quote",
    archive: "footer-template-archive",
    copyright: "footer-template-copyright"
  };
  const wrapper = el("div", { className: classByTemplate[footer.template] });
  const content = footer.type === "quote"
    ? quoteContent(footer.fields)
    : footer.type === "summary"
      ? summaryContent(footer.fields, project)
      : watermarkContent(footer.fields, project);
  wrapper.append(...content.childNodes);
  root.append(wrapper);
}

