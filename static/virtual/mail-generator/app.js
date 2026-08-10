(function () {
  "use strict";

  const STORAGE_KEY = "oc-mail-archive-project-v1";
  const MOBILE_SPLIT_KEY = "oc-mail-archive-mobile-preview-ratio";
  const IMAGE_DATABASE_NAME = "oc-mail-archive-assets-v1";
  const MAX_HISTORY = 30;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix = "item") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const imageStore = window.OCImageStore.create({ databaseName: IMAGE_DATABASE_NAME });
  const safeImageSource = (value = "") => imageStore.normalize(value);
  const imageSource = (value = "") => imageStore.resolve(value);

  const THEMES = {
    archive: {
      name: "学术档案",
      english: "ACADEMIC ARCHIVE",
      colors: {
        background: "#dfe3dd",
        accountBg: "#ecece4",
        listBg: "#f8f7f1",
        messageBg: "#fffef9",
        ink: "#20231f",
        muted: "#70756f",
        accent: "#31594c",
        line: "#d2d3cb"
      }
    },
    soft: {
      name: "柔光玻璃",
      english: "SOFT GLASS",
      colors: {
        background: "#e8dfed",
        accountBg: "#f1e9f2",
        listBg: "#faf4fa",
        messageBg: "#fffafd",
        ink: "#2d2830",
        muted: "#776e7d",
        accent: "#865c8c",
        line: "#ddd1df"
      }
    },
    pixel: {
      name: "像素邮件",
      english: "PIXEL MAIL",
      colors: {
        background: "#cbd4b9",
        accountBg: "#dbe1c8",
        listBg: "#edf0dc",
        messageBg: "#f5f4df",
        ink: "#1f2a20",
        muted: "#5f685b",
        accent: "#38543e",
        line: "#7f8c78"
      }
    },
    editorial: {
      name: "编辑部黑金",
      english: "EDITORIAL NOIR",
      colors: {
        background: "#1d1e1c",
        accountBg: "#171816",
        listBg: "#eee8dc",
        messageBg: "#f8f2e7",
        ink: "#242019",
        muted: "#746d62",
        accent: "#9b7138",
        line: "#cfc5b4"
      }
    },
    office: {
      name: "复古办公软件",
      english: "RETRO OFFICE",
      colors: {
        background: "#b8b49f",
        accountBg: "#d4d0ba",
        listBg: "#e4e0ca",
        messageBg: "#f3efdc",
        ink: "#292b24",
        muted: "#65675c",
        accent: "#786b39",
        line: "#858473"
      }
    },
    corporate: {
      name: "蓝白企业邮件",
      english: "CORPORATE BLUE",
      colors: {
        background: "#dce8f4",
        accountBg: "#e7f0fa",
        listBg: "#f3f7fb",
        messageBg: "#ffffff",
        ink: "#1e2d3d",
        muted: "#66788b",
        accent: "#2563a6",
        line: "#c8d6e5"
      }
    }
  };

  function createDefaultState() {
    return {
      version: 2,
      projectName: "未命名邮件档案",
      activeFolder: "inbox",
      selectedMailId: "mail-1",
      account: {
        name: "林默",
        email: "linmo@northarchive.example",
        bio: "北境档案室研究员\n负责私人信件与口述史整理",
        status: "正在整理第七码箱",
        avatar: ""
      },
      contacts: [],
      folders: [
        { id: "inbox", name: "收件箱", icon: "▣" },
        { id: "sent", name: "已发送", icon: "↗" },
        { id: "drafts", name: "草稿箱", icon: "◇" },
        { id: "important", name: "重要邮件", icon: "★" },
        { id: "deleted", name: "已删除", icon: "×" }
      ],
      mails: [
        {
          id: "mail-1",
          folder: "inbox",
          senderName: "周栖",
          senderEmail: "qizhou@fieldnotes.example",
          senderAvatar: "",
          to: "林默 <linmo@northarchive.example>",
          cc: "阿澄 <chen@northarchive.example>",
          subject: "关于七码箱中未登记的冬季信件",
          preview: "我在最底层发现了一封没有日期的信，纸张和其他档案不太一样。",
          date: "2026年7月28日",
          time: "09:42",
          body: "早上好，林默：\n\n我在七码箱最底层发现了一封没有日期的信。它被夹在两份航运记录之间，纸张比同批档案新，但墨水已经明显褪色。\n\n信里反复提到“灯塔熄灭后的第三个清晨”。我暂时没有在现有时间线中找到对应事件，想请你确认是否需要把它列为独立条目。",
          bodyImage: "",
          signature: "周栖\n田野记录组",
          attachments: "七码箱_信件正面.jpg\n纸张纤维记录.pdf",
          read: false,
          starred: true,
          replies: [
            {
              id: "reply-1",
              senderName: "林默",
              senderEmail: "linmo@northarchive.example",
              to: "周栖",
              date: "2026年7月28日",
              time: "10:16",
              body: "先不要归入正式时间线。请把信封、纸张水印和背面的铅笔编号分别拍照，我会和旧港口的档案做一次比对。"
            },
            {
              id: "reply-2",
              senderName: "周栖",
              senderEmail: "qizhou@fieldnotes.example",
              to: "林默",
              date: "2026年7月28日",
              time: "10:31",
              body: "收到。我已经补拍，并把原件暂时放进无酸纸袋。背面编号看起来像“L-03”，稍后一起发给你。"
            }
          ]
        },
        {
          id: "mail-2",
          folder: "inbox",
          senderName: "阿澄",
          senderEmail: "chen@northarchive.example",
          to: "林默",
          cc: "",
          subject: "周五访谈的提纲已经更新",
          preview: "我补上了关于旧港迁移路线的三个问题，请在出发前看一下。",
          date: "2026年7月27日",
          time: "18:05",
          body: "林默：\n\n访谈提纲已经更新。我补上了旧港迁移路线、冬季物资和第三次停航的相关问题。\n\n如果你觉得顺序没有问题，我明天会打印两份。",
          signature: "阿澄",
          attachments: "访谈提纲_v3.docx",
          read: true,
          starred: false,
          replies: []
        },
        {
          id: "mail-3",
          folder: "inbox",
          senderName: "档案室系统",
          senderEmail: "notice@northarchive.example",
          to: "林默",
          cc: "",
          subject: "七月访问记录摘要",
          preview: "本月共有14次档案调阅，新增影像记录37份。",
          date: "2026年7月26日",
          time: "08:00",
          body: "这是七月访问记录的自动摘要。\n\n档案调阅：14次\n新增影像：37份\n待复核条目：6项",
          signature: "北境档案室自动通知",
          attachments: "",
          read: true,
          starred: false,
          replies: []
        },
        {
          id: "mail-4",
          folder: "sent",
          senderName: "林默",
          senderEmail: "linmo@northarchive.example",
          to: "旧港博物馆资料部",
          cc: "",
          subject: "申请查阅L系列航运登记册",
          preview: "希望申请查阅L系列航运登记册及相关的灯塔维护记录。",
          date: "2026年7月25日",
          time: "14:20",
          body: "您好：\n\n我代表北境档案室申请查阅L系列航运登记册，以及同期灯塔维护记录。研究仅用于非商业档案整理。\n\n如需补充介绍信或身份证明，请随时告知。",
          signature: "林默\n北境档案室",
          attachments: "查阅申请函.pdf",
          read: true,
          starred: false,
          replies: []
        }
      ],
      style: {
        theme: "archive",
        colors: clone(THEMES.archive.colors),
        canvasSize: "wide",
        accountWidth: 250,
        listWidth: 360,
        fontScale: 1,
        radius: 0,
        exportMode: "screen",
        exportScale: 2,
        showSearch: true,
        showToolbar: true,
        showMockup: true
      }
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;
    const result = {
      ...base,
      ...raw,
      account: { ...base.account, ...(raw.account || {}) },
      style: {
        ...base.style,
        ...(raw.style || {}),
        colors: { ...base.style.colors, ...(raw.style?.colors || {}) }
      }
    };
    result.version = 2;
    result.account.avatar = safeImageSource(result.account.avatar);
    result.contacts = Array.isArray(raw.contacts)
      ? raw.contacts.map((contact) => ({
        id: String(contact.id || uid("contact")),
        name: String(contact.name || ""),
        email: String(contact.email || ""),
        avatar: safeImageSource(contact.avatar)
      }))
      : base.contacts;
    result.folders = Array.isArray(raw.folders) && raw.folders.length
      ? raw.folders.map((folder, index) => ({
        id: String(folder.id || `folder-${index}`),
        name: String(folder.name || `文件夹 ${index + 1}`),
        icon: String(folder.icon || "□")
      }))
      : base.folders;
    result.mails = Array.isArray(raw.mails)
      ? raw.mails.map((mail) => ({
        ...base.mails[0],
        ...mail,
        id: String(mail.id || uid("mail")),
        senderAvatar: safeImageSource(mail.senderAvatar),
        bodyImage: safeImageSource(mail.bodyImage),
        replies: Array.isArray(mail.replies)
          ? mail.replies.map((reply) => ({
            id: String(reply.id || uid("reply")),
            senderName: String(reply.senderName || ""),
            senderEmail: String(reply.senderEmail || ""),
            to: String(reply.to || ""),
            date: String(reply.date || ""),
            time: String(reply.time || ""),
            body: String(reply.body || "")
          }))
          : []
      }))
      : base.mails;
    if (!result.folders.some((folder) => folder.id === result.activeFolder)) {
      result.activeFolder = result.folders[0]?.id || "inbox";
    }
    if (!result.mails.some((mail) => mail.id === result.selectedMailId)) {
      result.selectedMailId = result.mails.find((mail) => mail.folder === result.activeFolder)?.id || result.mails[0]?.id || "";
    }
    return result;
  }

  function imageBindings(project) {
    const bindings = [{ container: project.account, key: "avatar" }];
    project.contacts.forEach((contact) => bindings.push({ container: contact, key: "avatar" }));
    project.mails.forEach((mail) => {
      bindings.push({ container: mail, key: "senderAvatar" });
      bindings.push({ container: mail, key: "bodyImage" });
    });
    return bindings;
  }

  function imageValues(project) {
    return imageBindings(project).map(({ container, key }) => container[key]).filter(Boolean);
  }

  async function migrateStateImages(project) {
    let migrated = 0;
    for (const { container, key } of imageBindings(project)) {
      const current = container[key];
      if (!imageStore.isDataImage(current)) continue;
      const next = await imageStore.storeDataUrl(current);
      if (next !== current) {
        container[key] = next;
        migrated += 1;
      }
    }
    return migrated;
  }

  async function createPortableState(project) {
    const portable = clone(project);
    for (const { container, key } of imageBindings(portable)) {
      container[key] = await imageStore.toDataUrl(container[key]);
    }
    return portable;
  }

  function loadState() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
    } catch {
      return createDefaultState();
    }
  }

  let state = loadState();
  let history = [];
  let future = [];
  let inputCheckpoint = null;
  let saveTimer = null;
  let toastTimer = null;
  let exporting = false;
  const avatarCrop = { source: "", targetType: "account", contactId: "", naturalWidth: 0, naturalHeight: 0, baseScale: 1, zoom: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
  const TOUR_STEPS = [
    { target: ".content-panel .editor-card", panel: "content", title: "建立账户资料", copy: "先填写账户名称、邮箱、简介并上传头像。画布会即时更新，不需要手动保存。" },
    { target: "#contacts-card", panel: "content", title: "建立通讯录", copy: "联系人只需录入一次姓名、邮箱和头像。之后编辑邮件时，可以直接选择联系人自动填入发件人、收件人或抄送。" },
    { target: "#mail-editor-list", panel: "content", title: "组织邮件与回复", copy: "在这里新增或选择邮件，再编辑发件人、主题、正文、附件和回复线程。" },
    { target: ".preview-panel", title: "检查实时画布", copy: "上方画布会同步显示结果。手机上可以拖动分隔条，调整预览与编辑区的高度。" },
    { target: ".style-panel .editor-card", panel: "style", title: "选择主题与版式", copy: "从六套主题中选择风格，也可以继续调整颜色、栏宽、字号、圆角和导出清晰度。" },
    { target: "[data-style-field=\"exportMode\"]", panel: "style", title: "理解完整导出模式", copy: "固定画布会保持 1440 × 900 或 1200 × 900，并裁切超出画布的正文；完整线程会让画布随正文和回复自动增加高度，适合保存长邮件对话。" },
    { target: "#export-all", title: "完成并导出", copy: "可导出完整 PNG，也能在画布工具栏中单独导出账户栏、邮件列表、正文或回复线程。" }
  ];
  let tourIndex = -1;
  let tourPreviousMobilePanel = "content";

  const canvas = $("#mail-canvas");
  const stage = $("#canvas-stage");
  const viewport = $("#preview-viewport");
  const saveStateLabel = $("#save-state");

  function getSelectedMail() {
    return state.mails.find((mail) => mail.id === state.selectedMailId) || null;
  }

  function initials(value) {
    const clean = String(value || "OC").trim();
    return clean.slice(0, 2).toUpperCase();
  }

  function paragraphs(value) {
    const text = String(value || "").trim();
    if (!text) return "<p>（无正文）</p>";
    return text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
      .join("");
  }

  function splitLines(value) {
    return String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  async function persistState() {
    await migrateStateImages(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function scheduleSave() {
    saveStateLabel?.classList.add("is-saving");
    if (saveStateLabel) saveStateLabel.lastChild.textContent = "保存中";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await persistState();
        saveStateLabel?.classList.remove("is-saving");
        if (saveStateLabel) saveStateLabel.lastChild.textContent = "已保存";
      } catch {
        saveStateLabel?.classList.remove("is-saving");
        if (saveStateLabel) saveStateLabel.lastChild.textContent = "保存失败";
        showToast("浏览器存储失败，请保存 JSON 备份");
      }
    }, 260);
  }

  async function initializeImageStorage() {
    try {
      const migrated = await migrateStateImages(state);
      const preload = await imageStore.preload(imageValues(state));
      if (migrated) await persistState();
      renderAll();
      if (preload.missing.length) showToast("部分本地图片已丢失，请重新上传");
      imageStore.cleanup(imageValues(state)).catch(() => {});
    } catch {
      renderAll();
    }
  }

  function pushHistorySnapshot(snapshot) {
    history.push(clone(snapshot));
    if (history.length > MAX_HISTORY) history.shift();
    future = [];
    updateHistoryButtons();
  }

  function pushHistory() {
    pushHistorySnapshot(state);
  }

  function updateHistoryButtons() {
    const undo = $("#undo-button");
    const redo = $("#redo-button");
    if (undo) undo.disabled = history.length === 0;
    if (redo) redo.disabled = future.length === 0;
  }

  function undo() {
    if (!history.length) return;
    future.push(clone(state));
    state = normalizeState(history.pop());
    renderAll();
    scheduleSave();
  }

  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    state = normalizeState(future.pop());
    renderAll();
    scheduleSave();
  }

  function renderThemeGrid() {
    const grid = $("#theme-grid");
    grid.innerHTML = Object.entries(THEMES).map(([id, theme]) => `
      <button class="theme-button ${state.style.theme === id ? "active" : ""}" type="button" data-theme="${id}">
        <span class="theme-swatch" style="--swatch-a:${theme.colors.accountBg};--swatch-b:${theme.colors.messageBg}"></span>
        <span><strong>${theme.name}</strong><small>${theme.english}</small></span>
      </button>
    `).join("");
  }

  function formatContact(contact) {
    const name = String(contact?.name || "").trim();
    const email = String(contact?.email || "").trim();
    if (name && email) return `${name} <${email}>`;
    return email || name;
  }

  function renderContactEditors() {
    const container = $("#contact-editor-list");
    if (!state.contacts.length) {
      container.innerHTML = '<p class="empty-contact-list">通讯录为空，点击“联系人”开始录入。</p>';
      return;
    }
    container.innerHTML = state.contacts.map((contact, index) => `
      <article class="contact-editor" data-contact-id="${escapeHtml(contact.id)}">
        <div class="contact-editor-head">
          <div class="contact-avatar-preview" data-contact-avatar-preview="${escapeHtml(contact.id)}">
            ${imageSource(contact.avatar) ? `<img src="${escapeHtml(imageSource(contact.avatar))}" alt="">` : escapeHtml(initials(contact.name || `联系人${index + 1}`))}
          </div>
          <div class="contact-identity">
            <strong>${escapeHtml(contact.name || `联系人 ${index + 1}`)}</strong>
            <span>${escapeHtml(contact.email || "尚未填写邮箱")}</span>
          </div>
          <div class="contact-actions">
            <label class="button compact file-button">上传头像<input type="file" accept="image/*" data-contact-avatar-input="${escapeHtml(contact.id)}"></label>
            ${contact.avatar ? `<button type="button" data-remove-contact-avatar="${escapeHtml(contact.id)}">移除头像</button>` : ""}
            <button type="button" data-delete-contact="${escapeHtml(contact.id)}">删除</button>
          </div>
        </div>
        <div class="field-grid">
          <label class="field"><span>姓名</span><input data-contact-id="${escapeHtml(contact.id)}" data-contact-field="name" value="${escapeHtml(contact.name)}" type="text"></label>
          <label class="field"><span>邮箱</span><input data-contact-id="${escapeHtml(contact.id)}" data-contact-field="email" value="${escapeHtml(contact.email)}" type="email"></label>
        </div>
      </article>
    `).join("");
  }

  function renderContactSelectors() {
    const mail = getSelectedMail();
    const placeholder = state.contacts.length ? "选择联系人…" : "通讯录为空";
    const options = `<option value="">${placeholder}</option>${state.contacts.map((contact) => `
      <option value="${escapeHtml(contact.id)}">${escapeHtml(contact.name || "未命名")} · ${escapeHtml(contact.email || "无邮箱")}</option>
    `).join("")}`;
    $$('[data-contact-fill]').forEach((select) => {
      select.innerHTML = options;
      select.value = "";
      select.disabled = !mail || !state.contacts.length;
    });
  }
  function renderFolderEditor() {
    $("#folder-editor").innerHTML = state.folders.map((folder, index) => `
      <label class="folder-row">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <input data-folder-id="${escapeHtml(folder.id)}" data-folder-field="name" value="${escapeHtml(folder.name)}" aria-label="文件夹名称">
        <input data-folder-id="${escapeHtml(folder.id)}" data-folder-field="icon" value="${escapeHtml(folder.icon)}" maxlength="2" aria-label="文件夹图标">
        <button type="button" data-delete-folder="${escapeHtml(folder.id)}" aria-label="删除文件夹">×</button>
      </label>
    `).join("");

    $("#active-folder").innerHTML = state.folders
      .map((folder) => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`)
      .join("");
    $("#active-folder").value = state.activeFolder;
    const mailFolderField = $("#mail-folder-field");
    mailFolderField.innerHTML = state.folders
      .map((folder) => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`)
      .join("");
  }

  function renderMailEditorList() {
    const container = $("#mail-editor-list");
    if (!state.mails.length) {
      container.innerHTML = '<p class="card-title">暂无邮件，请点击“添加”。</p>';
      return;
    }
    container.innerHTML = state.mails.map((mail, index) => `
      <div class="mail-editor-item ${mail.id === state.selectedMailId ? "active" : ""}" data-select-mail="${escapeHtml(mail.id)}">
        <div><strong>${escapeHtml(mail.subject || "无主题")}</strong><span>${escapeHtml(mail.senderName)} · ${escapeHtml(mail.folder)}</span></div>
        <div class="item-actions">
          <button type="button" data-mail-action="up" data-mail-id="${escapeHtml(mail.id)}" aria-label="上移" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-mail-action="down" data-mail-id="${escapeHtml(mail.id)}" aria-label="下移" ${index === state.mails.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" data-mail-action="duplicate" data-mail-id="${escapeHtml(mail.id)}" aria-label="复制">＋</button>
          <button type="button" data-mail-action="delete" data-mail-id="${escapeHtml(mail.id)}" aria-label="删除">×</button>
        </div>
      </div>
    `).join("");
  }

  function renderReplyEditors() {
    const mail = getSelectedMail();
    const container = $("#reply-editor-list");
    const contactOptions = `<option value="">${state.contacts.length ? "选择联系人…" : "通讯录为空"}</option>${state.contacts.map((contact) => `
      <option value="${escapeHtml(contact.id)}">${escapeHtml(contact.name || "未命名")} · ${escapeHtml(contact.email || "无邮箱")}</option>
    `).join("")}`;
    if (!mail) {
      container.innerHTML = '<p class="card-title">请先选择一封邮件。</p>';
      return;
    }
    if (!mail.replies.length) {
      container.innerHTML = '<p class="card-title">当前邮件还没有回复。</p>';
      return;
    }
    container.innerHTML = mail.replies.map((reply, index) => `
      <article class="reply-editor">
        <div class="reply-editor-head">
          <strong>回复 ${String(index + 1).padStart(2, "0")}</strong>
          <div class="item-actions">
            <button type="button" data-reply-action="up" data-reply-id="${escapeHtml(reply.id)}" aria-label="上移">↑</button>
            <button type="button" data-reply-action="down" data-reply-id="${escapeHtml(reply.id)}" aria-label="下移">↓</button>
            <button type="button" data-reply-action="delete" data-reply-id="${escapeHtml(reply.id)}" aria-label="删除">×</button>
          </div>
        </div>
        <div class="contact-fill-box reply-contact-fill">
          <strong>从通讯录自动填入</strong>
          <div class="field-grid">
            <label class="field"><span>回复人</span><select data-reply-id="${escapeHtml(reply.id)}" data-reply-contact-fill="sender" ${state.contacts.length ? "" : "disabled"}>${contactOptions}</select></label>
            <label class="field"><span>收件人</span><select data-reply-id="${escapeHtml(reply.id)}" data-reply-contact-fill="to" ${state.contacts.length ? "" : "disabled"}>${contactOptions}</select></label>
          </div>
        </div>
        <div class="field-grid">
          <label class="field"><span>回复人</span><input data-reply-id="${escapeHtml(reply.id)}" data-reply-field="senderName" value="${escapeHtml(reply.senderName)}"></label>
          <label class="field"><span>邮箱</span><input data-reply-id="${escapeHtml(reply.id)}" data-reply-field="senderEmail" value="${escapeHtml(reply.senderEmail)}"></label>
        </div>
        <label class="field"><span>收件人</span><input data-reply-id="${escapeHtml(reply.id)}" data-reply-field="to" value="${escapeHtml(reply.to)}"></label>
        <div class="field-grid">
          <label class="field"><span>日期</span><input data-reply-id="${escapeHtml(reply.id)}" data-reply-field="date" value="${escapeHtml(reply.date)}"></label>
          <label class="field"><span>时间</span><input data-reply-id="${escapeHtml(reply.id)}" data-reply-field="time" value="${escapeHtml(reply.time)}"></label>
        </div>
        <label class="field"><span>回复正文</span><textarea data-reply-id="${escapeHtml(reply.id)}" data-reply-field="body" rows="5">${escapeHtml(reply.body)}</textarea></label>
      </article>
    `).join("");
  }

  function syncStaticEditors() {
    $("#project-name").value = state.projectName;
    $$("[data-account-field]").forEach((input) => {
      input.value = state.account[input.dataset.accountField] ?? "";
    });
    const avatar = $("#account-avatar-preview");
    avatar.innerHTML = state.account.avatar
      ? `<img src="${escapeHtml(imageSource(state.account.avatar))}" alt="">`
      : escapeHtml(initials(state.account.name));

    const mail = getSelectedMail();
    $$("[data-mail-field]").forEach((input) => {
      const value = mail?.[input.dataset.mailField];
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value ?? "";
      input.disabled = !mail;
    });
    const bodyImagePreview = $("#mail-body-image-preview");
    bodyImagePreview.innerHTML = imageSource(mail?.bodyImage)
      ? `<img src="${escapeHtml(imageSource(mail.bodyImage))}" alt="">`
      : "正文配图";
    $("#mail-body-image-input").disabled = !mail;
    $("#remove-mail-body-image").disabled = !mail?.bodyImage;

    $$("[data-style-field]").forEach((input) => {
      const value = state.style[input.dataset.styleField];
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value;
    });
    $$("[data-color-field]").forEach((input) => {
      input.value = state.style.colors[input.dataset.colorField];
    });
    $("#account-width-output").textContent = `${state.style.accountWidth}px`;
    $("#list-width-output").textContent = `${state.style.listWidth}px`;
    $("#font-scale-output").textContent = `${Math.round(state.style.fontScale * 100)}%`;
    $("#radius-output").textContent = `${state.style.radius}px`;
  }

  function renderAccountPanel() {
    const counts = Object.fromEntries(state.folders.map((folder) => [
      folder.id,
      state.mails.filter((mail) => mail.folder === folder.id && !mail.read).length
    ]));
    $("#mail-account-panel").innerHTML = `
      <div class="window-dots"><i></i><i></i><i></i></div>
      <div class="account-profile">
        <div class="account-monogram">${imageSource(state.account.avatar) ? `<img src="${escapeHtml(imageSource(state.account.avatar))}" alt="">` : escapeHtml(initials(state.account.name))}</div>
        <h2>${escapeHtml(state.account.name)}</h2>
        <p class="account-email">${escapeHtml(state.account.email)}</p>
        <p class="account-bio">${escapeHtml(state.account.bio)}</p>
        <p class="account-status"><i></i>${escapeHtml(state.account.status)}</p>
      </div>
      <ul class="folder-list">
        ${state.folders.map((folder) => `
          <li>
            <button class="${folder.id === state.activeFolder ? "active" : ""}" type="button" data-canvas-folder="${escapeHtml(folder.id)}">
              <span class="folder-icon">${escapeHtml(folder.icon)}</span>
              <span>${escapeHtml(folder.name)}</span>
              ${counts[folder.id] ? `<span class="folder-count">${counts[folder.id]}</span>` : "<span></span>"}
            </button>
          </li>
        `).join("")}
      </ul>
      <div class="account-footer">OC MAIL ARCHIVE · LOCAL DESK</div>
    `;
  }

  function renderMailListPanel() {
    const folder = state.folders.find((item) => item.id === state.activeFolder);
    const mails = state.mails.filter((mail) => mail.folder === state.activeFolder);
    $("#mail-list-panel").innerHTML = `
      <header class="mail-list-header">
        <div class="mail-list-heading"><h2>${escapeHtml(folder?.name || "邮箱")}</h2><button class="compose-button" type="button" aria-label="新邮件">＋</button></div>
        ${state.style.showSearch ? `
          <div class="mail-search"><span>⌕</span><span>搜索邮件</span></div>
          <div class="filter-row"><span class="mail-chip active">全部</span><span class="mail-chip">已读</span><span class="mail-chip">未读</span></div>
        ` : ""}
      </header>
      <div class="mail-list-scroll">
        ${mails.length ? mails.map((mail) => `
          <button class="mail-list-item ${mail.id === state.selectedMailId ? "active" : ""} ${mail.read ? "" : "unread"}" type="button" data-canvas-mail="${escapeHtml(mail.id)}">
            <span class="unread-dot"></span>
            <span class="mail-list-copy">
              <span class="mail-list-sender">${escapeHtml(mail.senderName)}</span>
              <span class="mail-list-subject">${escapeHtml(mail.subject || "无主题")}</span>
              <span class="mail-list-preview">${escapeHtml(mail.preview)}</span>
            </span>
            <span class="mail-list-meta">${escapeHtml(mail.time)}${mail.starred ? '<span class="mail-star">★</span>' : ""}</span>
          </button>
        `).join("") : '<div class="empty-mail-list">这个文件夹里还没有邮件</div>'}
      </div>
    `;
  }

  function renderMessagePanel() {
    const mail = getSelectedMail();
    const panel = $("#mail-message-panel");
    if (!mail) {
      panel.innerHTML = '<div class="empty-message">选择一封邮件查看内容</div>';
      return;
    }
    const attachments = splitLines(mail.attachments);
    panel.innerHTML = `
      ${state.style.showToolbar ? `
        <div class="message-toolbar">
          <div class="message-toolbar-actions"><button type="button">↩ 回复</button><button type="button">↪ 全部回复</button><button type="button">» 转发</button></div>
          <div class="message-toolbar-actions"><button type="button">☆ 重要</button><button type="button">⌫ 删除</button></div>
        </div>
      ` : ""}
      <div class="message-content-scroll">
        <span class="message-label">${escapeHtml(state.folders.find((folder) => folder.id === mail.folder)?.name || "MESSAGE")}</span>
        <h1 class="message-subject">${escapeHtml(mail.subject || "无主题")}</h1>
        <div class="message-sender-row">
          <div class="sender-avatar">${imageSource(mail.senderAvatar) ? `<img src="${escapeHtml(imageSource(mail.senderAvatar))}" alt="">` : escapeHtml(initials(mail.senderName))}</div>
          <div class="sender-copy"><strong>${escapeHtml(mail.senderName)}</strong><span>${escapeHtml(mail.senderEmail)}</span></div>
          <div class="sender-time">${escapeHtml(mail.date)}<br>${escapeHtml(mail.time)}</div>
        </div>
        <div class="recipient-lines"><b>To:</b> ${escapeHtml(mail.to)}${mail.cc ? `<br><b>Cc:</b> ${escapeHtml(mail.cc)}` : ""}</div>
        <div class="message-body">${paragraphs(mail.body)}${imageSource(mail.bodyImage) ? `<img class="message-body-image" src="${escapeHtml(imageSource(mail.bodyImage))}" alt="">` : ""}${mail.signature ? `<div class="message-signature">${escapeHtml(mail.signature)}</div>` : ""}</div>
        ${attachments.length ? `<div class="attachment-list">${attachments.map((item) => `<div class="attachment-card"><span>ATTACHMENT</span><br>${escapeHtml(item)}</div>`).join("")}</div>` : ""}
        <section class="thread-section" id="thread-section">
          <div class="thread-heading"><span>REPLY THREAD</span><span>${String(mail.replies.length).padStart(2, "0")} REPLIES</span></div>
          ${mail.replies.length ? mail.replies.map((reply) => `
            <article class="reply-card">
              <div class="reply-head">
                <div><strong>${escapeHtml(reply.senderName)}</strong><span>${escapeHtml(reply.senderEmail)} → ${escapeHtml(reply.to)}</span></div>
                <time>${escapeHtml(reply.date)} · ${escapeHtml(reply.time)}</time>
              </div>
              <div class="reply-body">${escapeHtml(reply.body)}</div>
            </article>
          `).join("") : '<div class="reply-card"><div class="reply-body">当前邮件还没有回复。</div></div>'}
        </section>
      </div>
      ${state.style.showMockup ? '<div class="mockup-mark">MOCKUP / FICTIONAL EMAIL</div>' : ""}
    `;
  }

  function applyCanvasStyle() {
    const sizes = {
      wide: { width: 1440, height: 900 },
      standard: { width: 1200, height: 900 }
    };
    const size = sizes[state.style.canvasSize] || sizes.wide;
    canvas.dataset.theme = state.style.theme;
    canvas.classList.toggle("is-full-thread", state.style.exportMode === "thread");
    canvas.style.width = `${size.width}px`;
    canvas.style.height = state.style.exportMode === "thread" ? "auto" : `${size.height}px`;
    canvas.style.minHeight = `${size.height}px`;
    canvas.style.gridTemplateColumns = `${state.style.accountWidth}px ${state.style.listWidth}px minmax(0,1fr)`;
    canvas.style.setProperty("--mail-bg", state.style.colors.background);
    canvas.style.setProperty("--account-bg", state.style.colors.accountBg);
    canvas.style.setProperty("--list-bg", state.style.colors.listBg);
    canvas.style.setProperty("--message-bg", state.style.colors.messageBg);
    canvas.style.setProperty("--mail-ink", state.style.colors.ink);
    canvas.style.setProperty("--mail-muted", state.style.colors.muted);
    canvas.style.setProperty("--mail-accent", state.style.colors.accent);
    canvas.style.setProperty("--mail-line", state.style.colors.line);
    canvas.style.setProperty("--mail-radius", `${state.style.radius}px`);
    canvas.style.setProperty("--mail-scale", state.style.fontScale);
    canvas.style.fontSize = `${20 * Number(state.style.fontScale || 1)}px`;
    $("#canvas-dimensions").textContent = `${size.width} × ${state.style.exportMode === "thread" ? "AUTO" : size.height}`;
  }

  function updateCanvasScale() {
    if (!canvas || !stage || !viewport || exporting) return;
    const width = canvas.offsetWidth;
    const height = Math.max(canvas.scrollHeight, canvas.offsetHeight);
    const isMobileLayout = window.matchMedia("(max-width: 900px)").matches;
    const availableWidth = isMobileLayout
      ? viewport.clientWidth
      : Math.max(260, viewport.clientWidth - 48);
    const availableHeight = Math.max(180, viewport.clientHeight - 48);
    const scale = isMobileLayout
      ? Math.min(1, availableWidth / width)
      : state.style.exportMode === "thread"
        ? Math.min(1, availableWidth / width)
        : Math.min(1, availableWidth / width, availableHeight / height);
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${Math.round(width * scale)}px`;
    stage.style.height = `${Math.round(height * scale)}px`;
  }

  function renderPreview() {
    applyCanvasStyle();
    renderAccountPanel();
    renderMailListPanel();
    renderMessagePanel();
    requestAnimationFrame(updateCanvasScale);
  }

  function renderAll() {
    renderThemeGrid();
    renderContactEditors();
    renderContactSelectors();
    renderFolderEditor();
    renderMailEditorList();
    renderReplyEditors();
    syncStaticEditors();
    renderPreview();
    updateHistoryButtons();
  }

  function selectFolder(folderId) {
    state.activeFolder = folderId;
    const mail = state.mails.find((item) => item.folder === folderId);
    state.selectedMailId = mail?.id || "";
    renderAll();
    scheduleSave();
  }

  function selectMail(mailId) {
    const mail = state.mails.find((item) => item.id === mailId);
    if (!mail) return;
    state.selectedMailId = mail.id;
    state.activeFolder = mail.folder;
    renderAll();
    scheduleSave();
  }

  function addContact() {
    pushHistory();
    const contact = { id: uid("contact"), name: "新联系人", email: "", avatar: "" };
    state.contacts.push(contact);
    renderAll();
    scheduleSave();
    requestAnimationFrame(() => {
      const input = $(`[data-contact-id="${contact.id}"][data-contact-field="name"]`);
      input?.focus();
      input?.select();
    });
  }

  function deleteContact(contactId) {
    const contact = state.contacts.find((item) => item.id === contactId);
    if (!contact) return;
    pushHistory();
    state.contacts = state.contacts.filter((item) => item.id !== contactId);
    renderAll();
    scheduleSave();
    showToast("联系人已删除");
  }

  function removeContactAvatar(contactId) {
    const contact = state.contacts.find((item) => item.id === contactId);
    if (!contact?.avatar) return;
    pushHistory();
    contact.avatar = "";
    renderAll();
    scheduleSave();
  }

  function fillMailFromContact(contactId, destination) {
    const contact = state.contacts.find((item) => item.id === contactId);
    const mail = getSelectedMail();
    if (!contact || !mail) return;
    pushHistory();
    if (destination === "sender") {
      mail.senderName = contact.name;
      mail.senderEmail = contact.email;
      mail.senderAvatar = contact.avatar;
    } else if (destination === "to" || destination === "cc") {
      mail[destination] = formatContact(contact);
    }
    renderAll();
    scheduleSave();
    showToast("已从通讯录填入");
  }

  function fillReplyFromContact(replyId, contactId, destination) {
    const contact = state.contacts.find((item) => item.id === contactId);
    const mail = getSelectedMail();
    const reply = mail?.replies.find((item) => item.id === replyId);
    if (!contact || !reply) return;
    pushHistory();
    if (destination === "sender") {
      reply.senderName = contact.name;
      reply.senderEmail = contact.email;
    } else if (destination === "to") {
      reply.to = formatContact(contact);
    }
    renderReplyEditors();
    renderPreview();
    scheduleSave();
    showToast("已从通讯录填入回复");
  }

  function addMail() {
    pushHistory();
    const id = uid("mail");
    const folder = state.activeFolder || state.folders[0]?.id || "inbox";
    state.mails.push({
      id,
      folder,
      senderName: "新发件人",
      senderEmail: "sender@example.com",
      senderAvatar: "",
      to: state.account.name,
      cc: "",
      subject: "未命名邮件",
      preview: "在这里填写邮件摘要。",
      date: "2026年7月28日",
      time: "12:00",
      body: "在这里填写邮件正文。",
      bodyImage: "",
      signature: "",
      attachments: "",
      read: false,
      starred: false,
      replies: []
    });
    state.selectedMailId = id;
    renderAll();
    scheduleSave();
  }

  function addFolder() {
    pushHistory();
    const id = uid("folder");
    state.folders.push({ id, name: "新文件夹", icon: "□" });
    state.activeFolder = id;
    state.selectedMailId = "";
    renderAll();
    scheduleSave();
  }

  function deleteFolder(folderId) {
    if (state.folders.length <= 1) return showToast("至少保留一个文件夹");
    if (state.mails.some((mail) => mail.folder === folderId)) return showToast("请先移动或删除这个文件夹里的邮件");
    pushHistory();
    state.folders = state.folders.filter((folder) => folder.id !== folderId);
    if (state.activeFolder === folderId) state.activeFolder = state.folders[0].id;
    renderAll();
    scheduleSave();
  }

  function addReply() {
    const mail = getSelectedMail();
    if (!mail) return showToast("请先选择一封邮件");
    pushHistory();
    mail.replies.push({
      id: uid("reply"),
      senderName: state.account.name,
      senderEmail: state.account.email,
      to: mail.senderName,
      date: "2026年7月28日",
      time: "12:00",
      body: "在这里填写回复内容。"
    });
    renderReplyEditors();
    renderPreview();
    scheduleSave();
  }

  function handleMailAction(action, mailId) {
    const index = state.mails.findIndex((mail) => mail.id === mailId);
    if (index < 0) return;
    pushHistory();
    if (action === "up" && index > 0) {
      [state.mails[index - 1], state.mails[index]] = [state.mails[index], state.mails[index - 1]];
    } else if (action === "down" && index < state.mails.length - 1) {
      [state.mails[index + 1], state.mails[index]] = [state.mails[index], state.mails[index + 1]];
    } else if (action === "duplicate") {
      const copy = clone(state.mails[index]);
      copy.id = uid("mail");
      copy.subject = `${copy.subject}（副本）`;
      copy.replies = copy.replies.map((reply) => ({ ...reply, id: uid("reply") }));
      state.mails.splice(index + 1, 0, copy);
      state.selectedMailId = copy.id;
    } else if (action === "delete") {
      state.mails.splice(index, 1);
      state.selectedMailId = state.mails.find((mail) => mail.folder === state.activeFolder)?.id || state.mails[0]?.id || "";
    }
    renderAll();
    scheduleSave();
  }

  function handleReplyAction(action, replyId) {
    const mail = getSelectedMail();
    if (!mail) return;
    const index = mail.replies.findIndex((reply) => reply.id === replyId);
    if (index < 0) return;
    pushHistory();
    if (action === "up" && index > 0) {
      [mail.replies[index - 1], mail.replies[index]] = [mail.replies[index], mail.replies[index - 1]];
    } else if (action === "down" && index < mail.replies.length - 1) {
      [mail.replies[index + 1], mail.replies[index]] = [mail.replies[index], mail.replies[index + 1]];
    } else if (action === "delete") {
      mail.replies.splice(index, 1);
    }
    renderReplyEditors();
    renderPreview();
    scheduleSave();
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function safeFilename(value) {
    return String(value || "oc-mail")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  async function exportJson() {
    try {
      const portable = await createPortableState(state);
      const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, `${safeFilename(state.projectName)}.json`);
      showToast("项目 JSON 已保存（包含图片）");
    } catch {
      showToast("JSON 导出失败，请检查本地图片");
    }
  }

  async function importJson(file) {
    try {
      const raw = JSON.parse(await file.text());
      pushHistory();
      state = normalizeState(raw);
      await migrateStateImages(state);
      await imageStore.preload(imageValues(state));
      renderAll();
      scheduleSave();
      showToast("项目已导入");
    } catch {
      showToast("无法读取这个 JSON 文件");
    }
  }

  async function exportElement(element, suffix) {
    if (!element || exporting) return;
    if (!window.htmlToImage?.toPng) return showToast("导出组件未加载");
    exporting = true;
    const previousTransform = canvas.style.transform;
    const previousStageWidth = stage.style.width;
    const previousStageHeight = stage.style.height;
    canvas.style.transform = "none";
    canvas.classList.add("is-exporting");
    stage.style.width = `${canvas.offsetWidth}px`;
    stage.style.height = `${Math.max(canvas.scrollHeight, canvas.offsetHeight)}px`;
    showToast("正在生成 PNG…");
    try {
      if (document.fonts?.load) {
        const exportText = ((element.textContent || "中文字体" ).slice(0, 12000));
        await Promise.all(['400 24px "OC Noto Serif SC"', '600 24px "OC Noto Serif SC"', '700 24px "OC Noto Serif SC"'].map((spec) => Promise.race([
          document.fonts.load(spec, exportText).catch(() => []),
          new Promise((resolve) => setTimeout(resolve, 4000))
        ])));
      }
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const fontEmbedCSS = await window.OCExportFonts?.getFontEmbedCSS(element);
      const exportOptions = {
        pixelRatio: Math.max(2, Number(state.style.exportScale) || 2),
        skipAutoScale: true,
        cacheBust: false,
        preferredFontFormat: "woff2",
        backgroundColor: suffix === "完整"
          ? state.style.colors.background
          : getComputedStyle(element).backgroundColor === "rgba(0, 0, 0, 0)"
            ? state.style.colors.messageBg
            : getComputedStyle(element).backgroundColor
      };
      if (fontEmbedCSS) exportOptions.fontEmbedCSS = fontEmbedCSS;
      const dataUrl = await window.htmlToImage.toPng(element, exportOptions);
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(), `${safeFilename(state.projectName)}-${suffix}.png`);
      showToast(`${suffix} PNG 已导出`);
    } catch (error) {
      console.error(error);
      showToast("PNG 导出失败，请减少图片或内容后重试");
    } finally {
      canvas.classList.remove("is-exporting");
      canvas.style.transform = previousTransform;
      stage.style.width = previousStageWidth;
      stage.style.height = previousStageHeight;
      exporting = false;
      updateCanvasScale();
    }
  }

  function exportSection(section) {
    const targets = {
      account: [$("#mail-account-panel"), "账户栏"],
      list: [$("#mail-list-panel"), "邮件列表"],
      message: [$("#mail-message-panel"), "邮件正文"],
      thread: [$("#thread-section"), "回复线程"]
    };
    const target = targets[section];
    if (!target?.[0]) return showToast("当前没有可导出的内容");
    exportElement(target[0], target[1]);
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readCompressedImage(file, maxDimension = 1280, quality = .8) {
    return new Promise((resolve, reject) => {
      if (!file?.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return reject(new Error("invalid-image"));
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const output = document.createElement("canvas");
        output.width = Math.max(1, Math.round(image.naturalWidth * scale));
        output.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = output.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, output.width, output.height);
        context.drawImage(image, 0, 0, output.width, output.height);
        URL.revokeObjectURL(url);
        resolve(output.toDataURL("image/jpeg", quality));
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("read-failed"));
      };
      image.src = url;
    });
  }
  function updateAvatarCropTransform() {
    const cropStage = $("#avatar-crop-stage");
    const image = $("#avatar-crop-image");
    if (!avatarCrop.naturalWidth || !cropStage.clientWidth) return;
    const size = cropStage.clientWidth;
    const scaledWidth = avatarCrop.naturalWidth * avatarCrop.baseScale * avatarCrop.zoom;
    const scaledHeight = avatarCrop.naturalHeight * avatarCrop.baseScale * avatarCrop.zoom;
    const maxX = Math.max(0, (scaledWidth - size) / 2);
    const maxY = Math.max(0, (scaledHeight - size) / 2);
    avatarCrop.x = Math.min(maxX, Math.max(-maxX, avatarCrop.x));
    avatarCrop.y = Math.min(maxY, Math.max(-maxY, avatarCrop.y));
    image.style.width = `${avatarCrop.naturalWidth * avatarCrop.baseScale}px`;
    image.style.height = `${avatarCrop.naturalHeight * avatarCrop.baseScale}px`;
    image.style.transform = `translate(-50%, -50%) translate(${avatarCrop.x}px, ${avatarCrop.y}px) scale(${avatarCrop.zoom})`;
    $("#avatar-crop-zoom-output").textContent = `${Math.round(avatarCrop.zoom * 100)}%`;
  }

  function openAvatarCrop(dataUrl, target = { type: "account", id: "" }) {
    const modal = $("#avatar-crop-modal");
    const image = $("#avatar-crop-image");
    avatarCrop.source = dataUrl;
    avatarCrop.targetType = target.type === "contact" ? "contact" : "account";
    avatarCrop.contactId = target.id || "";
    $("#avatar-crop-title").textContent = avatarCrop.targetType === "contact" ? "裁切联系人头像" : "裁切账户头像";
    avatarCrop.zoom = 1;
    avatarCrop.x = 0;
    avatarCrop.y = 0;
    $("#avatar-crop-zoom").value = "1";
    modal.hidden = false;
    document.body.classList.add("crop-open");
    image.onload = () => {
      const size = $("#avatar-crop-stage").clientWidth || 300;
      avatarCrop.naturalWidth = image.naturalWidth;
      avatarCrop.naturalHeight = image.naturalHeight;
      avatarCrop.baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      updateAvatarCropTransform();
    };
    image.src = dataUrl;
  }

  function closeAvatarCrop() {
    $("#avatar-crop-modal").hidden = true;
    document.body.classList.remove("crop-open");
    avatarCrop.source = "";
    avatarCrop.dragging = false;
  }

  async function applyAvatarCrop() {
    const image = $("#avatar-crop-image");
    const cropStage = $("#avatar-crop-stage");
    if (!avatarCrop.source || !avatarCrop.naturalWidth) return;
    const stageSize = cropStage.clientWidth || 300;
    const scale = avatarCrop.baseScale * avatarCrop.zoom;
    const displayedWidth = avatarCrop.naturalWidth * scale;
    const displayedHeight = avatarCrop.naturalHeight * scale;
    const imageLeft = stageSize / 2 + avatarCrop.x - displayedWidth / 2;
    const imageTop = stageSize / 2 + avatarCrop.y - displayedHeight / 2;
    const sourceX = Math.max(0, -imageLeft / scale);
    const sourceY = Math.max(0, -imageTop / scale);
    const sourceSize = stageSize / scale;
    const outputSize = avatarCrop.targetType === "contact" ? 384 : 512;
    const output = document.createElement("canvas");
    output.width = outputSize;
    output.height = outputSize;
    const context = output.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
    const croppedAvatar = await imageStore.storeDataUrl(output.toDataURL("image/jpeg", avatarCrop.targetType === "contact" ? .88 : .92));
    pushHistory();
    if (avatarCrop.targetType === "contact") {
      const contact = state.contacts.find((item) => item.id === avatarCrop.contactId);
      if (contact) contact.avatar = croppedAvatar;
    } else {
      state.account.avatar = croppedAvatar;
    }
    const completedType = avatarCrop.targetType;
    closeAvatarCrop();
    renderAll();
    scheduleSave();
    showToast(completedType === "contact" ? "联系人头像已保存" : "头像裁切已完成");
  }

  function setupAvatarCrop() {
    const cropStage = $("#avatar-crop-stage");
    const zoom = $("#avatar-crop-zoom");
    cropStage.addEventListener("pointerdown", (event) => {
      avatarCrop.dragging = true;
      avatarCrop.startX = event.clientX;
      avatarCrop.startY = event.clientY;
      avatarCrop.originX = avatarCrop.x;
      avatarCrop.originY = avatarCrop.y;
      cropStage.setPointerCapture(event.pointerId);
    });
    cropStage.addEventListener("pointermove", (event) => {
      if (!avatarCrop.dragging) return;
      avatarCrop.x = avatarCrop.originX + event.clientX - avatarCrop.startX;
      avatarCrop.y = avatarCrop.originY + event.clientY - avatarCrop.startY;
      updateAvatarCropTransform();
    });
    cropStage.addEventListener("pointerup", () => { avatarCrop.dragging = false; });
    cropStage.addEventListener("pointercancel", () => { avatarCrop.dragging = false; });
    zoom.addEventListener("input", () => {
      avatarCrop.zoom = Number(zoom.value);
      updateAvatarCropTransform();
    });
    $$('[data-close-avatar-crop]').forEach((button) => button.addEventListener("click", closeAvatarCrop));
    $("#apply-avatar-crop").addEventListener("click", applyAvatarCrop);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#avatar-crop-modal").hidden) closeAvatarCrop();
    });
  }

  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$('[data-mobile-tab]').forEach((button) => {
      button.classList.toggle("active", button.dataset.mobileTab === panel);
    });
    requestAnimationFrame(updateCanvasScale);
  }

  function positionTour() {
    if (tourIndex < 0) return;
    const target = document.querySelector(TOUR_STEPS[tourIndex].target);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pad = 6;
    const left = Math.max(4, rect.left - pad);
    const top = Math.max(4, rect.top - pad);
    const right = Math.min(window.innerWidth - 4, rect.right + pad);
    const bottom = Math.min(window.innerHeight - 4, rect.bottom + pad);
    const focus = $("#tour-focus");
    focus.style.left = `${left}px`;
    focus.style.top = `${top}px`;
    focus.style.width = `${Math.max(24, right - left)}px`;
    focus.style.height = `${Math.max(24, bottom - top)}px`;

    const card = $("#tour-card");
    if (window.matchMedia("(max-width: 900px)").matches) {
      card.style.left = "";
      card.style.top = "";
      return;
    }
    const cardWidth = Math.min(340, window.innerWidth - 24);
    card.style.width = `${cardWidth}px`;
    card.style.bottom = "auto";
    card.style.right = "auto";
    card.style.left = `${Math.min(window.innerWidth - cardWidth - 12, Math.max(12, rect.left))}px`;
    const below = rect.bottom + 14;
    const cardHeight = card.offsetHeight;
    card.style.top = `${below + cardHeight <= window.innerHeight - 12 ? below : Math.max(12, rect.top - cardHeight - 14)}px`;
  }

  function renderTourStep() {
    const step = TOUR_STEPS[tourIndex];
    if (!step) return;
    if (step.panel && window.matchMedia("(max-width: 900px)").matches) setMobilePanel(step.panel);
    $("#tour-progress").textContent = `${String(tourIndex + 1).padStart(2, "0")} / ${String(TOUR_STEPS.length).padStart(2, "0")}`;
    $("#tour-title").textContent = step.title;
    $("#tour-copy").textContent = step.copy;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "完成" : "下一步";
    requestAnimationFrame(() => {
      const target = document.querySelector(step.target);
      target?.scrollIntoView({ block: "center", inline: "nearest" });
      requestAnimationFrame(positionTour);
    });
  }

  function openTour() {
    tourPreviousMobilePanel = document.body.dataset.mobilePanel || "content";
    tourIndex = 0;
    $("#tour-overlay").hidden = false;
    document.body.classList.add("tour-open");
    renderTourStep();
    $("#tour-next").focus();
  }

  function closeTour() {
    if (tourIndex < 0) return;
    tourIndex = -1;
    $("#tour-overlay").hidden = true;
    document.body.classList.remove("tour-open");
    if (window.matchMedia("(max-width: 900px)").matches) setMobilePanel(tourPreviousMobilePanel);
    $("#start-tour").focus();
  }

  function setupTour() {
    $("#start-tour").addEventListener("click", openTour);
    $$('[data-close-tour]').forEach((button) => button.addEventListener("click", closeTour));
    $("#tour-prev").addEventListener("click", () => {
      if (tourIndex > 0) {
        tourIndex -= 1;
        renderTourStep();
      }
    });
    $("#tour-next").addEventListener("click", () => {
      if (tourIndex >= TOUR_STEPS.length - 1) return closeTour();
      tourIndex += 1;
      renderTourStep();
    });
    document.addEventListener("keydown", (event) => {
      if (tourIndex < 0) return;
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") $("#tour-next").click();
      if (event.key === "ArrowLeft" && tourIndex > 0) $("#tour-prev").click();
    });
    document.addEventListener("scroll", () => {
      if (tourIndex >= 0) requestAnimationFrame(positionTour);
    }, true);
    window.addEventListener("resize", () => {
      if (tourIndex >= 0) requestAnimationFrame(positionTour);
    });
  }
  document.addEventListener("focusin", (event) => {
    const target = event.target;
    if (target.matches("input, textarea, select") && !target.closest(".top-actions")) {
      inputCheckpoint = clone(state);
    }
  });

  document.addEventListener("change", (event) => {
    if (inputCheckpoint && JSON.stringify(inputCheckpoint) !== JSON.stringify(state)) {
      pushHistorySnapshot(inputCheckpoint);
    }
    inputCheckpoint = null;

    if (event.target === $("#active-folder")) selectFolder(event.target.value);
    if (event.target === $("#import-input") && event.target.files?.[0]) {
      importJson(event.target.files[0]);
      event.target.value = "";
    }
    if (event.target.dataset.contactFill && event.target.value) {
      fillMailFromContact(event.target.value, event.target.dataset.contactFill);
      event.target.value = "";
      return;
    }
    if (event.target.dataset.replyContactFill && event.target.value) {
      fillReplyFromContact(
        event.target.dataset.replyId,
        event.target.value,
        event.target.dataset.replyContactFill
      );
      return;
    }
    if (event.target === $("#mail-body-image-input") && event.target.files?.[0]) {
      const mail = getSelectedMail();
      const file = event.target.files[0];
      if (mail) {
        readCompressedImage(file)
          .then((source) => imageStore.storeDataUrl(source))
          .then((source) => {
            pushHistory();
            mail.bodyImage = source;
            renderAll();
            scheduleSave();
            showToast("正文图片已加入");
          })
          .catch(() => showToast("图片无法读取或超过 15MB"));
      }
      event.target.value = "";
      return;
    }
    if (event.target.matches("[data-contact-avatar-input]") && event.target.files?.[0]) {
      const file = event.target.files[0];
      const contactId = event.target.dataset.contactAvatarInput;
      if (file.size > 12 * 1024 * 1024) {
        showToast("头像原图请控制在 12MB 以内");
      } else {
        readImage(file)
          .then((dataUrl) => openAvatarCrop(dataUrl, { type: "contact", id: contactId }))
          .catch(() => showToast("无法读取联系人头像"));
      }
      event.target.value = "";
      return;
    }
    if (event.target === $("#account-avatar-input") && event.target.files?.[0]) {
      const file = event.target.files[0];
      if (file.size > 12 * 1024 * 1024) {
        showToast("头像原图请控制在 12MB 以内");
      } else {
        readImage(file).then(openAvatarCrop).catch(() => showToast("无法读取头像图片"));
      }
      event.target.value = "";
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "project-name") {
      state.projectName = target.value;
      scheduleSave();
      return;
    }
    if (target.dataset.accountField) {
      state.account[target.dataset.accountField] = target.value;
      renderPreview();
      if (target.dataset.accountField === "name") {
        const avatar = $("#account-avatar-preview");
        if (!state.account.avatar) avatar.textContent = initials(state.account.name);
      }
      scheduleSave();
      return;
    }
    if (target.dataset.contactField) {
      const contact = state.contacts.find((item) => item.id === target.dataset.contactId);
      if (!contact) return;
      contact[target.dataset.contactField] = target.value;
      const editor = target.closest(".contact-editor");
      const identity = editor?.querySelector(".contact-identity");
      if (identity) {
        identity.querySelector("strong").textContent = contact.name || "未命名联系人";
        identity.querySelector("span").textContent = contact.email || "尚未填写邮箱";
      }
      const avatar = editor?.querySelector(".contact-avatar-preview");
      if (avatar && !contact.avatar) avatar.textContent = initials(contact.name || "联系人");
      renderContactSelectors();
      renderReplyEditors();
      scheduleSave();
      return;
    }
    if (target.dataset.folderField) {
      const folder = state.folders.find((item) => item.id === target.dataset.folderId);
      if (folder) folder[target.dataset.folderField] = target.value;
      renderPreview();
      scheduleSave();
      return;
    }
    if (target.dataset.mailField) {
      const mail = getSelectedMail();
      if (!mail) return;
      mail[target.dataset.mailField] = target.type === "checkbox" ? target.checked : target.value;
      if (target.dataset.mailField === "folder") state.activeFolder = target.value;
      renderMailEditorList();
      renderPreview();
      scheduleSave();
      return;
    }
    if (target.dataset.replyField) {
      const mail = getSelectedMail();
      const reply = mail?.replies.find((item) => item.id === target.dataset.replyId);
      if (reply) reply[target.dataset.replyField] = target.value;
      renderPreview();
      scheduleSave();
      return;
    }
    if (target.dataset.colorField) {
      state.style.colors[target.dataset.colorField] = target.value;
      renderPreview();
      scheduleSave();
      return;
    }
    if (target.dataset.styleField) {
      const field = target.dataset.styleField;
      state.style[field] = target.type === "checkbox"
        ? target.checked
        : target.type === "range"
          ? Number(target.value)
          : target.value;
      syncStaticEditors();
      renderPreview();
      scheduleSave();
    }
  });

  document.addEventListener("click", (event) => {
    const themeButton = event.target.closest("[data-theme]");
    if (themeButton) {
      pushHistory();
      state.style.theme = themeButton.dataset.theme;
      state.style.colors = clone(THEMES[state.style.theme].colors);
      renderAll();
      scheduleSave();
      return;
    }

    if (event.target.closest(".compose-button")) {
      addMail();
      return;
    }

    const mobileTab = event.target.closest("[data-mobile-tab]");
    if (mobileTab) {
      setMobilePanel(mobileTab.dataset.mobileTab);
      return;
    }

    const canvasFolder = event.target.closest("[data-canvas-folder]");
    if (canvasFolder) {
      pushHistory();
      selectFolder(canvasFolder.dataset.canvasFolder);
      return;
    }

    const deleteContactButton = event.target.closest("[data-delete-contact]");
    if (deleteContactButton) {
      deleteContact(deleteContactButton.dataset.deleteContact);
      return;
    }

    const removeContactAvatarButton = event.target.closest("[data-remove-contact-avatar]");
    if (removeContactAvatarButton) {
      removeContactAvatar(removeContactAvatarButton.dataset.removeContactAvatar);
      return;
    }
    const deleteFolderButton = event.target.closest("[data-delete-folder]");
    if (deleteFolderButton) {
      deleteFolder(deleteFolderButton.dataset.deleteFolder);
      return;
    }

    const canvasMail = event.target.closest("[data-canvas-mail]");
    if (canvasMail) {
      pushHistory();
      selectMail(canvasMail.dataset.canvasMail);
      return;
    }

    const mailAction = event.target.closest("[data-mail-action]");
    if (mailAction) {
      event.stopPropagation();
      handleMailAction(mailAction.dataset.mailAction, mailAction.dataset.mailId);
      return;
    }

    const mailEditorItem = event.target.closest("[data-select-mail]");
    if (mailEditorItem) {
      selectMail(mailEditorItem.dataset.selectMail);
      return;
    }

    const replyAction = event.target.closest("[data-reply-action]");
    if (replyAction) {
      handleReplyAction(replyAction.dataset.replyAction, replyAction.dataset.replyId);
      return;
    }

    const exportButton = event.target.closest("[data-export-section]");
    if (exportButton) {
      exportSection(exportButton.dataset.exportSection);
    }
  });

  $("#add-mail").addEventListener("click", addMail);
  $("#add-contact").addEventListener("click", addContact);
  $("#add-folder").addEventListener("click", addFolder);
  $("#add-reply").addEventListener("click", addReply);
  $("#undo-button").addEventListener("click", undo);
  $("#redo-button").addEventListener("click", redo);
  $("#save-json").addEventListener("click", exportJson);
  $("#export-all").addEventListener("click", () => exportElement(canvas, "完整"));
  $("#remove-avatar").addEventListener("click", () => {
    if (!state.account.avatar) return;
    pushHistory();
    state.account.avatar = "";
    renderAll();
    scheduleSave();
  });
  $("#remove-mail-body-image").addEventListener("click", () => {
    const mail = getSelectedMail();
    if (!mail?.bodyImage) return;
    pushHistory();
    mail.bodyImage = "";
    renderAll();
    scheduleSave();
  });
  $("#reset-theme-colors").addEventListener("click", () => {
    pushHistory();
    state.style.colors = clone(THEMES[state.style.theme].colors);
    renderAll();
    scheduleSave();
  });
  $("#new-project").addEventListener("click", () => {
    if (!confirm("新建项目会替换当前页面中的内容，建议先保存 JSON。继续吗？")) return;
    pushHistory();
    state = createDefaultState();
    renderAll();
    scheduleSave();
    showToast("已新建邮件项目");
  });

  function setupMobileResizer() {
    const workspace = $(".workspace");
    const resizer = $("#mobile-resizer");
    const query = window.matchMedia("(max-width: 900px)");
    if (!workspace || !resizer) return;

    let ratio = .40;
    try {
      const stored = Number(localStorage.getItem(MOBILE_SPLIT_KEY));
      if (Number.isFinite(stored) && stored >= .22 && stored <= .72) ratio = stored;
    } catch { /* keep default */ }
    let resizing = false;

    const applyHeight = (height, persist = true) => {
      if (!query.matches) return;
      const available = Math.max(1, workspace.clientHeight);
      const minimum = Math.max(100, available * .22);
      const maximum = Math.max(minimum, Math.min(available * .72, available - 190));
      const nextHeight = Math.min(maximum, Math.max(minimum, Number(height) || 0));
      ratio = nextHeight / available;
      workspace.style.setProperty("--mobile-preview-height", `${nextHeight}px`);
      resizer.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      if (persist) {
        try { localStorage.setItem(MOBILE_SPLIT_KEY, String(ratio)); } catch { /* session-only layout is acceptable */ }
      }
      requestAnimationFrame(updateCanvasScale);
    };
    const applyRatio = () => {
      if (!query.matches) {
        workspace.style.removeProperty("--mobile-preview-height");
        document.body.classList.remove("mobile-resizing");
        return;
      }
      applyHeight(workspace.clientHeight * ratio, false);
    };
    const updateFromPointer = (clientY) => {
      applyHeight(clientY - workspace.getBoundingClientRect().top);
    };

    resizer.addEventListener("pointerdown", (event) => {
      if (!query.matches) return;
      resizing = true;
      try { resizer.setPointerCapture(event.pointerId); } catch { /* keep the same interaction where capture is unavailable */ }
      document.body.classList.add("mobile-resizing");
      updateFromPointer(event.clientY);
    });
    resizer.addEventListener("pointermove", (event) => {
      if (resizing) updateFromPointer(event.clientY);
    });
    const stopResizing = (event) => {
      if (!resizing) return;
      resizing = false;
      try {
        if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
      } catch { /* pointer capture may already be released */ }
      document.body.classList.remove("mobile-resizing");
    };
    resizer.addEventListener("pointerup", stopResizing);
    resizer.addEventListener("pointercancel", stopResizing);
    resizer.addEventListener("keydown", (event) => {
      if (!query.matches || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const current = $(".preview-panel")?.getBoundingClientRect().height || workspace.clientHeight * ratio;
      applyHeight(current + (event.key === "ArrowDown" ? 24 : -24));
    });
    resizer.addEventListener("dblclick", () => applyHeight(workspace.clientHeight * .40));
    window.addEventListener("resize", applyRatio);
    query.addEventListener?.("change", applyRatio);
    requestAnimationFrame(applyRatio);
  }

  window.addEventListener("resize", updateCanvasScale);
  setupAvatarCrop();
  setupTour();
  setupMobileResizer();
  renderAll();
  initializeImageStorage();
})();






















