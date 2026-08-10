export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "attrs") {
      Object.entries(value).forEach(([name, attrValue]) => {
        if (attrValue !== false && attrValue != null) node.setAttribute(name, String(attrValue));
      });
    } else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node) {
      node[key] = value;
    }
  });
  const normalized = Array.isArray(children) ? children : [children];
  normalized.filter(Boolean).forEach((child) => node.append(child));
  return node;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function appendText(parent, tag, text, className = "") {
  if (!text) return null;
  const node = el(tag, { className, text });
  parent.append(node);
  return node;
}

export function fieldValue(project, path) {
  return path.reduce((value, key) => value?.[key], project);
}
