import { clear, el } from "../utils/dom.js";
import { resolveImageSource } from "../utils/imageStore.js";

function getHeaderView(header) {
  const fields = header.fields;
  if (header.type === "event") {
    return {
      kicker: "INCIDENT RECORD",
      title: fields.eventName,
      foreign: fields.eventCode,
      subtitle: [fields.startDate, fields.endDate].filter(Boolean).join(" — "),
      description: fields.eventDescription,
      media: header.mainImage,
      meta: [
        ["地点", fields.location],
        ["参与者", fields.participants],
        ["最终结果", fields.result]
      ]
    };
  }
  return {
    kicker: "WORLD CHRONICLE",
    title: fields.title,
    foreign: fields.foreignTitle,
    subtitle: fields.subtitle,
    description: fields.description,
    media: header.emblem,
    meta: [
      ["纪年法", fields.calendarName],
      ["时间范围", fields.dateRange],
      ["编纂者", fields.author]
    ]
  };
}

function createMeta(items, className = "header-meta-grid") {
  const list = el("dl", { className });
  items.filter(([, value]) => value).forEach(([label, value]) => {
    list.append(el("div", {}, [
      el("dt", { text: label }),
      el("dd", { text: value })
    ]));
  });
  return list.children.length ? list : null;
}

function createTextContent(view) {
  const content = el("div", { className: "header-content" });
  if (view.kicker) content.append(el("p", { className: "header-kicker", text: view.kicker }));
  if (view.title) content.append(el("h1", { className: "header-title", text: view.title }));
  if (view.foreign) content.append(el("p", { className: "header-foreign", text: view.foreign }));
  if (view.subtitle) content.append(el("p", { className: "header-subtitle", text: view.subtitle }));
  if (view.description) content.append(el("p", { className: "header-description", text: view.description }));
  const meta = createMeta(view.meta);
  if (meta) content.append(meta);
  return content;
}

function createMedia(view) {
  const media = el("div", { className: "header-media" });
  const source = resolveImageSource(view.media);
  if (source) {
    media.append(el("img", { src: source, alt: "" }));
  } else {
    media.append(el("span", {
      className: "header-media-placeholder",
      text: (view.title || "纪").trim().slice(0, 1)
    }));
  }
  return media;
}

function createPersonCard(character, index, header) {
  const portrait = el("div", {
    className: `person-portrait${header.portraitShape === "round" ? " is-round" : ""}`
  });
  const avatarSource = resolveImageSource(character.avatar);
  if (avatarSource) {
    portrait.append(el("img", {
      src: avatarSource,
      alt: character.name ? `${character.name}的头像` : `人物${index + 1}头像`
    }));
  } else {
    portrait.append(el("span", {
      text: (character.name || `人物${index + 1}`).trim().slice(0, 1)
    }));
  }

  const copy = el("div", { className: "person-card-copy" });
  copy.append(el("p", {
    className: "person-number",
    text: `PERSON ${String(index + 1).padStart(2, "0")}`
  }));
  copy.append(el("h2", { text: character.name || `未命名人物 ${index + 1}` }));
  if (character.foreignName) copy.append(el("p", { className: "person-foreign", text: character.foreignName }));
  if (character.alias) copy.append(el("p", { className: "person-alias", text: character.alias }));

  const meta = createMeta([
    ["身份", character.identity],
    ["阵营", character.faction],
    ["出生", character.birthDate],
    ["死亡", character.deathDate]
  ], "person-meta");
  if (meta) copy.append(meta);
  if (character.biography) copy.append(el("p", { className: "person-biography", text: character.biography }));
  if (character.quote) copy.append(el("blockquote", { className: "person-quote", text: character.quote }));

  return el("article", { className: "person-card" }, [portrait, copy]);
}

function createPersonPreview(header, project) {
  const count = header.characterCount;
  const characters = header.characters.slice(0, count);
  const wrapper = el("div", {
    className: `person-header person-count-${count} person-template-${header.template}`
  });

  if (header.template === "archive") {
    wrapper.append(el("div", { className: "archive-code person-archive-code" }, [
      el("span", { text: `GROUP FILE / ${project.id.slice(0, 8).toUpperCase()}` }),
      el("span", { text: `${count} SUBJECT${count > 1 ? "S" : ""}` })
    ]));
  }

  const heading = el("header", { className: "person-header-heading" }, [
    el("p", { className: "header-kicker", text: count > 1 ? "GROUP PROFILE" : "PERSONAL CHRONICLE" }),
    count > 1 && header.relationship
      ? el("h1", { text: header.relationship })
      : null,
    count > 1
      ? el("p", { className: "person-count-label", text: `${count} PEOPLE · RELATIONSHIP RECORD` })
      : null
  ]);
  wrapper.append(heading);

  const gallery = el("div", { className: "person-gallery" });
  characters.forEach((character, index) => {
    gallery.append(createPersonCard(character, index, header));
  });
  wrapper.append(gallery);
  if (header.template === "archive") {
    wrapper.append(el("span", { className: "archive-stamp person-archive-stamp", text: "GROUP FILE" }));
  }
  return wrapper;
}

export function renderHeaderPreview(project) {
  const root = document.querySelector("#header-preview");
  if (!root) return;
  const { header } = project;
  clear(root);
  root.hidden = !header.enabled;
  if (!header.enabled) return;

  root.className = "canvas-section header-preview";
  root.style.backgroundImage = "";
  const backgroundSource = resolveImageSource(header.backgroundImage);
  if (backgroundSource) {
    root.classList.add("has-background");
    if (header.overlayEnabled) {
      root.classList.add("has-overlay", `overlay-${header.overlayColor}`);
    }
    root.style.backgroundImage = `url("${backgroundSource}")`;
  }

  if (header.type === "person") {
    root.append(createPersonPreview(header, project));
    return;
  }

  const view = getHeaderView(header);
  if (header.template === "split") {
    root.append(el("div", { className: "header-template-split" }, [
      createMedia(view),
      createTextContent(view)
    ]));
    return;
  }

  if (header.template === "archive") {
    const content = createTextContent(view);
    content.classList.add("header-template-archive");
    content.prepend(el("div", { className: "archive-code" }, [
      el("span", { text: `FILE / ${project.id.slice(0, 8).toUpperCase()}` }),
      el("span", { text: header.type.toUpperCase() })
    ]));
    content.append(el("span", { className: "archive-stamp", text: "ARCHIVED" }));
    root.append(content);
    return;
  }

  const content = createTextContent(view);
  content.classList.add("header-template-centered");
  root.append(content);
}

