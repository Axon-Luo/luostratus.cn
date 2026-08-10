import {
  createDefaultProject,
  createHeaderCharacter,
  createTimelineNode,
  SCHEMA_VERSION
} from "../defaults.js";
import {
  safeImage,
  toSafeBoolean,
  toSafeNumber,
  toSafeString
} from "./sanitize.js";

const HEADER_TYPES = new Set(["world", "person", "event"]);
const HEADER_TEMPLATES = new Set(["centered", "split", "archive"]);
const TIMELINE_TEMPLATES = new Set(["left", "alternating", "archive", "checkerboard"]);
const CARD_TEMPLATES = new Set(["standard", "minimal", "archive"]);
const FOOTER_TYPES = new Set(["quote", "summary", "watermark"]);
const FOOTER_TEMPLATES = new Set(["quote", "archive", "copyright"]);
const IMPORTANCE = new Set(["normal", "important", "critical"]);
const PRESETS = new Set([
  "minimal",
  "parchment",
  "archive",
  "scifi",
  "ink",
  "gothic",
  "forest",
  "celestial"
]);
const FONT_TYPES = new Set(["serif", "sans-serif", "vintage", "monospace"]);

function enumValue(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

function normalizeFields(defaultFields, incoming) {
  const source = incoming && typeof incoming === "object" ? incoming : {};
  return Object.fromEntries(
    Object.keys(defaultFields).map((key) => [key, toSafeString(source[key], defaultFields[key])])
  );
}

function normalizeCharacter(character) {
  const base = createHeaderCharacter();
  const source = character && typeof character === "object" ? character : {};
  return {
    ...base,
    id: toSafeString(source.id, base.id).slice(0, 100),
    name: toSafeString(source.name),
    foreignName: toSafeString(source.foreignName),
    alias: toSafeString(source.alias),
    birthDate: toSafeString(source.birthDate),
    deathDate: toSafeString(source.deathDate),
    identity: toSafeString(source.identity),
    faction: toSafeString(source.faction),
    biography: toSafeString(source.biography),
    quote: toSafeString(source.quote),
    avatar: safeImage(source.avatar)
  };
}

function normalizeNode(node) {
  const base = createTimelineNode();
  const source = node && typeof node === "object" ? node : {};
  return {
    ...base,
    id: toSafeString(source.id, base.id).slice(0, 100),
    date: toSafeString(source.date),
    age: toSafeString(source.age),
    title: toSafeString(source.title),
    summary: toSafeString(source.summary),
    content: toSafeString(source.content),
    location: toSafeString(source.location),
    participants: toSafeString(source.participants),
    tags: Array.isArray(source.tags)
      ? source.tags.slice(0, 30).map((tag) => toSafeString(tag).slice(0, 60)).filter(Boolean)
      : [],
    image: safeImage(source.image),
    imageCaption: toSafeString(source.imageCaption),
    importance: enumValue(source.importance, IMPORTANCE, "normal"),
    visible: toSafeBoolean(source.visible, true),
    collapsed: toSafeBoolean(source.collapsed, false),
    cardTemplate: source.cardTemplate === null
      ? null
      : enumValue(source.cardTemplate, CARD_TEMPLATES, null)
  };
}

export function validateProject(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "文件内容不是有效的项目对象。" };
  }
  if (!data.header || !data.timeline || !data.footer || !data.theme || !data.canvas) {
    return { valid: false, error: "项目缺少 header、timeline、footer、theme 或 canvas 基础字段。" };
  }
  if (data.timeline.nodes != null && !Array.isArray(data.timeline.nodes)) {
    return { valid: false, error: "timeline.nodes 必须是数组。" };
  }
  if (Array.isArray(data.timeline.nodes) && data.timeline.nodes.length > 500) {
    return { valid: false, error: "节点数量超过基础版上限（500个）。" };
  }
  if (data.header.characters != null && !Array.isArray(data.header.characters)) {
    return { valid: false, error: "header.characters 必须是数组。" };
  }
  return { valid: true };
}

export function normalizeProject(data) {
  const base = createDefaultProject();
  const source = data && typeof data === "object" ? data : {};
  const header = source.header && typeof source.header === "object" ? source.header : {};
  const timeline = source.timeline && typeof source.timeline === "object" ? source.timeline : {};
  const footer = source.footer && typeof source.footer === "object" ? source.footer : {};
  const theme = source.theme && typeof source.theme === "object" ? source.theme : {};
  const canvas = source.canvas && typeof source.canvas === "object" ? source.canvas : {};
  const headerFields = normalizeFields(base.header.fields, header.fields);
  const legacyCharacter = createHeaderCharacter({
    name: headerFields.name,
    foreignName: headerFields.foreignName,
    alias: headerFields.alias,
    birthDate: headerFields.birthDate,
    deathDate: headerFields.deathDate,
    identity: headerFields.identity,
    faction: headerFields.faction,
    biography: headerFields.biography,
    quote: headerFields.quote,
    avatar: safeImage(header.avatar)
  });
  const rawCharacters = Array.isArray(header.characters) && header.characters.length
    ? header.characters.slice(0, 4)
    : [legacyCharacter];
  const characterCount = Math.round(toSafeNumber(
    header.characterCount,
    Math.min(4, Math.max(1, rawCharacters.length)),
    1,
    4
  ));
  const characters = rawCharacters.map(normalizeCharacter);
  while (characters.length < characterCount) characters.push(normalizeCharacter({}));


  return {
    schemaVersion: SCHEMA_VERSION,
    id: toSafeString(source.id, base.id).slice(0, 100),
    name: toSafeString(source.name, base.name).slice(0, 80),
    createdAt: toSafeString(source.createdAt, base.createdAt).slice(0, 40),
    updatedAt: toSafeString(source.updatedAt, base.updatedAt).slice(0, 40),
    header: {
      enabled: toSafeBoolean(header.enabled, true),
      type: enumValue(header.type, HEADER_TYPES, "world"),
      template: enumValue(header.template, HEADER_TEMPLATES, "centered"),
      portraitShape: header.portraitShape === "round" ? "round" : "square",
      overlayEnabled: toSafeBoolean(header.overlayEnabled, true),
      overlayColor: header.overlayColor === "white" ? "white" : "black",
      characterCount,
      relationship: toSafeString(header.relationship).slice(0, 300),
      characters,
      fields: headerFields,
      avatar: safeImage(header.avatar),
      emblem: safeImage(header.emblem),
      mainImage: safeImage(header.mainImage),
      backgroundImage: safeImage(header.backgroundImage)
    },
    timeline: {
      template: enumValue(timeline.template, TIMELINE_TEMPLATES, "left"),
      cardTemplate: enumValue(timeline.cardTemplate, CARD_TEMPLATES, "standard"),
      nodes: Array.isArray(timeline.nodes) ? timeline.nodes.slice(0, 500).map(normalizeNode) : []
    },
    footer: {
      enabled: toSafeBoolean(footer.enabled, true),
      type: enumValue(footer.type, FOOTER_TYPES, "quote"),
      template: enumValue(footer.template, FOOTER_TEMPLATES, "quote"),
      fields: normalizeFields(base.footer.fields, footer.fields)
    },
    theme: {
      preset: enumValue(theme.preset, PRESETS, "minimal"),
      primaryColor: normalizeColor(theme.primaryColor, base.theme.primaryColor),
      secondaryColor: normalizeColor(theme.secondaryColor, base.theme.secondaryColor),
      backgroundColor: normalizeColor(theme.backgroundColor, base.theme.backgroundColor),
      textColor: normalizeColor(theme.textColor, base.theme.textColor),
      titleColor: normalizeColor(theme.titleColor, base.theme.titleColor),
      borderColor: normalizeColor(theme.borderColor, base.theme.borderColor),
      titleFont: enumValue(theme.titleFont, FONT_TYPES, "serif"),
      bodyFont: enumValue(theme.bodyFont, FONT_TYPES, "serif"),
      baseFontSize: toSafeNumber(theme.baseFontSize, 16, 12, 28),
      borderRadius: toSafeNumber(theme.borderRadius, 0, 0, 32),
      showTexture: toSafeBoolean(theme.showTexture, false),
      showBorder: toSafeBoolean(theme.showBorder, true)
    },
    canvas: {
      width: toSafeNumber(canvas.width, 800, 560, 1200),
      padding: toSafeNumber(canvas.padding, 48, 20, 100),
      scale: [0.5, 0.75, 1].includes(Number(canvas.scale)) ? Number(canvas.scale) : 0.75
    }
  };
}

function normalizeColor(value, fallback) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}


