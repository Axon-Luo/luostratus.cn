(function initOCExportFonts(global) {
  "use strict";

  const fontDataCache = new Map();
  const URL_PATTERN = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;

  function normalizeFamily(value) {
    return String(value || "").trim().replace(/^["']|["']$/g, "");
  }

  function addComputedFontContext(element, families, textParts) {
    if (!(element instanceof Element)) return;
    const styles = [getComputedStyle(element), getComputedStyle(element, "::before"), getComputedStyle(element, "::after")];
    styles.forEach((style, index) => {
      String(style.fontFamily || "").split(",").forEach((family) => {
        const normalized = normalizeFamily(family);
        if (normalized) families.add(normalized);
      });
      if (index > 0) {
        const content = style.content;
        if (content && content !== "none" && content !== "normal") textParts.push(content.replace(/^["']|["']$/g, ""));
      }
    });
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      textParts.push(element.value || "");
    }
  }

  function collectExportContext(root) {
    const families = new Set();
    const textParts = [root.textContent || ""];
    addComputedFontContext(root, families, textParts);
    root.querySelectorAll("*").forEach((element) => addComputedFontContext(element, families, textParts));
    return {
      families,
      codePoints: new Set(Array.from(textParts.join("\n"), (character) => character.codePointAt(0)))
    };
  }

  function rangeContainsCodePoint(token, codePoint) {
    const body = token.trim().replace(/^U\+/i, "");
    if (!body) return false;
    if (body.includes("?")) {
      const minimum = Number.parseInt(body.replace(/\?/g, "0"), 16);
      const maximum = Number.parseInt(body.replace(/\?/g, "F"), 16);
      return codePoint >= minimum && codePoint <= maximum;
    }
    const [start, end = start] = body.split("-");
    const minimum = Number.parseInt(start, 16);
    const maximum = Number.parseInt(end, 16);
    return Number.isFinite(minimum) && Number.isFinite(maximum) && codePoint >= minimum && codePoint <= maximum;
  }

  function unicodeRangeMatches(value, codePoints) {
    if (!value) return true;
    const ranges = value.split(",").map((range) => range.trim()).filter(Boolean);
    for (const codePoint of codePoints) {
      if (ranges.some((range) => rangeContainsCodePoint(range, codePoint))) return true;
    }
    return false;
  }

  function collectFontFaceRules(root) {
    const { families, codePoints } = collectExportContext(root);
    const selected = [];
    const seen = new Set();

    const walkRules = (rules) => {
      Array.from(rules || []).forEach((rule) => {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          const family = normalizeFamily(rule.style.getPropertyValue("font-family"));
          if (!families.has(family)) return;
          if (!unicodeRangeMatches(rule.style.getPropertyValue("unicode-range"), codePoints)) return;
          const baseUrl = rule.parentStyleSheet?.href || document.baseURI;
          const key = `${baseUrl}\n${rule.cssText}`;
          if (!seen.has(key)) {
            seen.add(key);
            selected.push({ cssText: rule.cssText, baseUrl });
          }
          return;
        }
        if (rule.cssRules) walkRules(rule.cssRules);
      });
    };

    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        walkRules(sheet.cssRules);
      } catch (error) {
        console.warn("跳过无法读取的字体样式表", sheet.href || "inline", error);
      }
    });
    return selected;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("字体文件读取失败"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }

  function fetchFontData(url) {
    if (!fontDataCache.has(url)) {
      fontDataCache.set(url, fetch(url, { cache: "force-cache" }).then((response) => {
        if (!response.ok) throw new Error(`字体请求失败 (${response.status}): ${url}`);
        return response.blob();
      }).then(blobToDataUrl).catch((error) => {
        fontDataCache.delete(url);
        throw error;
      }));
    }
    return fontDataCache.get(url);
  }

  async function inlineFontUrls(cssText, baseUrl) {
    const matches = Array.from(cssText.matchAll(URL_PATTERN));
    if (!matches.length) return cssText;
    const replacements = new Map();
    await Promise.all(matches.map(async (match) => {
      const source = match[2].trim();
      if (/^(data:|blob:)/i.test(source) || replacements.has(source)) return;
      const absoluteUrl = new URL(source, baseUrl).href;
      replacements.set(source, await fetchFontData(absoluteUrl));
    }));
    return cssText.replace(URL_PATTERN, (whole, quote, source) => {
      const dataUrl = replacements.get(source.trim());
      return dataUrl ? `url("${dataUrl}")` : whole;
    }).replace(/font-display\s*:\s*[^;}]+;?/i, "font-display: block;");
  }

  async function getFontEmbedCSS(root) {
    if (!(root instanceof Element)) throw new TypeError("导出字体需要有效的画布节点");
    const rules = collectFontFaceRules(root);
    const embedded = await Promise.all(rules.map((rule) => inlineFontUrls(rule.cssText, rule.baseUrl)));
    return embedded.join("\n");
  }

  global.OCExportFonts = Object.freeze({ getFontEmbedCSS });
})(globalThis);