/* ==========================================================================
   快递面单工坊 EXPRESS LABEL CRAFT
   六套模板（国内电子面单 / UPS 风国际 / 双语邮政 / 赛博朋克 / 复古航空 / 生态潮牌）
   基于 pho 设计样稿移植；架构复用 oc-shipping-label-generator 模式。
   所有条码 / 二维码 / MaxiCode 均为本地确定性装饰图形，不可被真实物流系统识别。
   ========================================================================== */
(() => {
  "use strict";

  const STORAGE_KEY = "express-label-state-v1";
  const FORMAT = "express-label-project";
  const VERSION = 1;
  /* 画布只定宽不定高（与 pho/styles.css 原稿一致）：竖版 380px / 横版 580px，高度由内容自然撑开 */
  const CANVAS_WIDTH = { portrait: 380, landscape: 580 };
  const TEMPLATE_IDS = ["domestic", "ups", "bilingual", "cyberpunk", "vintage", "eco"];
  const TEMPLATE_INFO = {
    domestic: { name: "国内电子面单", meta: "三段码 / 签收联" },
    ups: { name: "国际特快热敏", meta: "SHIP TO / MaxiCode" },
    bilingual: { name: "跨境双语邮政", meta: "黑底横幅 / 大邮编" },
    cyberpunk: { name: "赛博朋克舱仓", meta: "星区 HUD / 加密码" },
    vintage: { name: "复古航空面单", meta: "红蓝斜纹 / 火漆章" },
    eco: { name: "生态潮牌面单", meta: "问候卡 / 减碳信息" }
  };
  /* 默认值 = pho/styles.css 各模板硬编码色值 */
  const DEFAULT_COLORS = {
    domestic: { paper: "#ffffff", ink: "#000000", accent: "#dc2626", muted: "#475569", line: "#000000", code: "#000000" },
    ups: { paper: "#ffffff", ink: "#000000", accent: "#000000", muted: "#1e293b", line: "#000000", code: "#000000" },
    bilingual: { paper: "#ffffff", ink: "#000000", accent: "#dc2626", muted: "#334155", line: "#000000", code: "#000000" },
    cyberpunk: { paper: "#0d1412", ink: "#7fb5ac", accent: "#b06a72", muted: "#6d7f78", line: "#3a5750", code: "#7fb5ac" },
    vintage: { paper: "#fdfbf7", ink: "#2b261f", accent: "#dc2626", muted: "#78716c", line: "#a89f91", code: "#1c1917" },
    eco: { paper: "#f5f3ec", ink: "#1e3a2f", accent: "#1e3a2f", muted: "#5c6e61", line: "#dde1d3", code: "#1e3a2f" }
  };
  const FONTS = {
    sans: "'OC Noto Sans SC','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
    serif: "'OC Noto Serif SC','Noto Serif SC','Songti SC',serif",
    mono: "Consolas,'SFMono-Regular','Liberation Mono','Courier New',monospace"
  };
  const DENSITY_FACTOR = { 1: 0.75, 2: 1, 3: 1.2, 4: 1.4 };
  const DENSITY_LABEL = { 1: "矮条", 2: "标准", 3: "偏高", 4: "加高" };

  /* --------------------------------------------------------------------
     字段 schema：共通内容（六套模板共享）+ 每模板专属字段声明
     控件类型：text / textarea / number / select / toggle
     -------------------------------------------------------------------- */
  const COMMON_SCHEMA = [
    {
      key: "recipient", title: "收件人", fields: [
        { path: "recipient.name", label: "姓名", type: "text" },
        { path: "recipient.phone", label: "电话", type: "text" },
        { path: "recipient.address", label: "地址", type: "textarea", rows: 2 },
        { path: "recipient.city", label: "城市", type: "text" },
        { path: "recipient.zip", label: "邮编 / 区码", type: "text" }
      ]
    },
    {
      key: "sender", title: "寄件人", fields: [
        { path: "sender.name", label: "姓名", type: "text" },
        { path: "sender.phone", label: "电话", type: "text" },
        { path: "sender.address", label: "地址", type: "textarea", rows: 2 },
        { path: "sender.city", label: "城市", type: "text" },
        { path: "sender.zip", label: "邮编 / 区码", type: "text" }
      ]
    },
    {
      key: "tracking", title: "运单", fields: [
        { path: "trackingNo", label: "运单号（驱动条码与二维码）", type: "text" }
      ]
    },
    {
      key: "cargo", title: "货品", fields: [
        { path: "cargo", label: "托寄物 / 货品明细", type: "textarea", rows: 2 },
        { path: "weight", label: "重量", type: "text" },
        { path: "weightUnit", label: "重量单位", type: "select", options: [["kg", "kg"], ["lbs", "LBS"], ["g", "g"]] },
        { path: "qty", label: "件数", type: "number", min: 1, max: 999 },
        { path: "remark", label: "备注", type: "textarea", rows: 2 }
      ]
    }
  ];

  const TEMPLATE_SCHEMAS = {
    domestic: {
      sections: [
        {
          key: "service", title: "承运与服务", fields: [
            { key: "brandCode", label: "品牌缩写（黑底徽标）", type: "text" },
            { key: "brandName", label: "品牌名称", type: "text" },
            { key: "brandEn", label: "品牌英文行", type: "text" },
            { key: "serviceType", label: "服务类型（黑底徽章）", type: "text" },
            { key: "serviceSub", label: "服务副标", type: "text" },
            { key: "payMethod", label: "付款方式", type: "select", options: [["寄付现结", "寄付现结"], ["到付", "到付"], ["月结", "月结"], ["寄付月结", "寄付月结"]] }
          ]
        },
        {
          key: "routing", title: "分拣三段码", fields: [
            { key: "destHub", label: "目的分拣大字", type: "text" },
            { key: "routingCode", label: "三段码", type: "text" }
          ]
        },
        {
          key: "billing", title: "计费与签收联", fields: [
            { key: "chargeWeight", label: "计费重量", type: "number", min: 0, max: 9999, step: 0.1 },
            { key: "insureValue", label: "保价金额", type: "text" },
            { key: "stubText", label: "签收行文字", type: "text" },
            { key: "showStub", label: "显示签收联", type: "toggle" }
          ]
        }
      ]
    },
    ups: {
      sections: [
        {
          key: "service", title: "承运与服务", fields: [
            { key: "serviceName", label: "服务横幅", type: "text" },
            { key: "rsCode", label: "右上大字（RS）", type: "text" },
            { key: "footerDesc", label: "页脚服务行", type: "text" },
            { key: "stampCode", label: "底部印码", type: "text" }
          ]
        },
        {
          key: "routing", title: "寄件与路由", fields: [
            { key: "shipToCo", label: "SHIP TO 公司行", type: "text" },
            { key: "hubZip", label: "分拨中心大字", type: "text" },
            { key: "hubCode", label: "分拨条码文本", type: "text" }
          ]
        }
      ]
    },
    bilingual: {
      sections: [
        {
          key: "brand", title: "品牌横幅", fields: [
            { key: "brandLine1", label: "品牌主行", type: "text" },
            { key: "brandLine2", label: "品牌副行", type: "text" },
            { key: "serviceTitle", label: "服务等级横幅", type: "text" },
            { key: "returnBadge", label: "退件徽标", type: "text" },
            { key: "routeNumber", label: "右上分拣数字", type: "text" }
          ]
        },
        {
          key: "codes", title: "邮编与编码", fields: [
            { key: "bigPostcode", label: "大字邮编", type: "text" },
            { key: "pinNo", label: "PIN / NIP", type: "text" },
            { key: "refNo", label: "参考号 Ref.", type: "text" },
            { key: "sortCode", label: "分拨码", type: "text" },
            { key: "disclaimer", label: "免责声明", type: "textarea", rows: 3 }
          ]
        }
      ]
    },
    cyberpunk: {
      sections: [
        {
          key: "brand", title: "舱单抬头", fields: [
            { key: "brandTitle", label: "品牌标题", type: "text" },
            { key: "securityClass", label: "安全等级徽章", type: "text" }
          ]
        },
        {
          key: "sector", title: "星区路由", fields: [
            { key: "sectorTitle", label: "星区标题行", type: "text" },
            { key: "sectorCode", label: "目标星区大字", type: "text" },
            { key: "hubTag", label: "HUB 标签", type: "text" }
          ]
        },
        {
          key: "specs", title: "货舱规格", fields: [
            { key: "hazard", label: "危险等级", type: "text" },
            { key: "temp", label: "温控状态", type: "text" },
            { key: "authCode", label: "认证码", type: "text" },
            { key: "timestamp", label: "时间戳", type: "text" }
          ]
        }
      ]
    },
    vintage: {
      sections: [
        {
          key: "brand", title: "品牌", fields: [
            { key: "brandTitle", label: "品牌标题", type: "text" },
            { key: "brandSub", label: "品牌副标", type: "text" }
          ]
        },
        {
          key: "registered", title: "挂号与申报", fields: [
            { key: "registeredNo", label: "挂号单号（留空时使用运单号）", type: "text" },
            { key: "declaration", label: "海关申报物品（留空时使用货品明细）", type: "textarea", rows: 2 },
            { key: "netWeight", label: "净重（KG）", type: "text" }
          ]
        }
      ]
    },
    eco: {
      sections: [
        {
          key: "brand", title: "品牌", fields: [
            { key: "brandName", label: "品牌名称", type: "text" },
            { key: "brandSlogan", label: "品牌副标", type: "text" },
            { key: "badgeText", label: "圆角徽章文字", type: "text" }
          ]
        },
        {
          key: "greeting", title: "问候卡", fields: [
            { key: "showGreeting", label: "显示问候卡", type: "toggle" },
            { key: "greetingTitle", label: "问候标题（留空时自动 Hello, 收件人）", type: "text" },
            { key: "greetingBody", label: "问候正文", type: "textarea", rows: 2 }
          ]
        },
        {
          key: "ecoinfo", title: "环保信息", fields: [
            { key: "carbonSaving", label: "减碳贡献", type: "text" },
            { key: "packMaterial", label: "包材材质", type: "text" },
            { key: "qrCaption", label: "二维码说明", type: "text" }
          ]
        }
      ]
    }
  };

  function defaultTemplateData() {
    return {
      domestic: {
        brandCode: "XF", brandName: "迅峰速运", brandEn: "XF EXPRESS",
        serviceType: "特快专递", serviceSub: "标准陆运 / 次日达", payMethod: "寄付现结",
        destHub: "华东 021 - A 09", routingCode: "310-021-8849",
        chargeWeight: 2, insureValue: "2,000",
        stubText: "签收人: ________________ 日期: ____/____", showStub: true
      },
      ups: {
        serviceName: "UEX GROUND | 环联特快", rsCode: "RS",
        footerDesc: "RETURN SERVICE / 国际退货服务联", stampCode: "URC87.5A 04/2026",
        shipToCo: "RETURNS DEPARTMENT", hubZip: "PA 151 9-40", hubCode: "PA151940"
      },
      bilingual: {
        brandLine1: "NORDPOST / POSTE NORD", brandLine2: "北境邮政 / 国际包裹处理",
        serviceTitle: "Expedited Parcel™ | Colis accélérés | 快捷专递包裹",
        returnBadge: "Return / Retour / 国际退货", routeNumber: "2",
        bigPostcode: "M0R 2B2", pinNo: "7326 1079 8669 5672",
        refNo: "1:JY246D90U446047986", sortCode: "PD NX YYZ (海关验放分拨)",
        disclaimer: "Sender warrants that this item does not contain non-mailable matter. / 寄件人保证本包裹不含禁邮禁运物品。 L'expéditeur garantit que cet envoi ne contient pas d'objet inadmissible."
      },
      cyberpunk: {
        brandTitle: "NEO-LOGISTICS // 赛博速递", securityClass: "PRIORITY CLASS A-1",
        sectorTitle: "DESTINATION SECTOR / 目标星区", sectorCode: "SECTOR-07 / NEO-TOKYO",
        hubTag: "HUB-902-CY", hazard: "LEVEL 3 [EMP SHIELDED]", temp: "18°C STABLE",
        authCode: "0x9F82A-PASS", timestamp: "2076.08.06-11:30:00"
      },
      vintage: {
        brandTitle: "PAR AVION / AIR MAIL / 航空特快", brandSub: "AZURE AIRPOST CO. 1928 / 蔚蓝航邮",
        registeredNo: "", declaration: "", netWeight: "1.25"
      },
      eco: {
        brandName: "OASIS STUDIO", brandSlogan: "100% Biodegradable Pack / 可降解环保包装",
        badgeText: "零碳包裹", showGreeting: true,
        greetingTitle: "", greetingBody: "您的期待已被温柔打包，正在加速送达您手中 🌿",
        carbonSaving: "-142g CO₂e", packMaterial: "100% 大豆油墨 & 可降解玉米淀粉袋",
        qrCaption: "扫描探索环保故事"
      }
    };
  }

  function defaultState() {
    return {
      format: FORMAT,
      version: VERSION,
      projectName: "未命名快递面单",
      template: "domestic",
      canvasMode: "portrait",
      exportScale: "2",
      common: {
        recipient: { name: "雾岛眠川", phone: "071-2048", address: "雾港市 第七码头区 月蚀环路 17 号 星鲸公寓 B-04", city: "雾港市", zip: "VG-0717" },
        sender: { name: "白塔零七", phone: "319-7710", address: "镜海市 浮岛新区 第三折跃站 北翼寄存柜 A-19", city: "镜海市", zip: "MH-0319" },
        trackingNo: "XF1439201984210",
        cargo: "3C数码配件 / 智能手表及无线耳机 [内置锂电池]",
        weight: "1.8",
        weightUnit: "kg",
        qty: 1,
        remark: "易碎物品 请轻拿轻放 送货上门需本人签收"
      },
      templateData: defaultTemplateData(),
      templateColors: clone(DEFAULT_COLORS),
      barcode: { showBarcode: true, showQr: true, density: 2 },
      images: {},
      stickers: [],
      selectedStickerId: ""
    };
  }

  /* -------------------------------------------------------------------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const multiline = value => esc(value).replace(/\r?\n/g, "<br>");
  const cleanFileName = value => String(value || "express-label").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 70) || "express-label";
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const isDataUrl = value => typeof value === "string" && value.startsWith("data:");
  const isImageRef = value => typeof value === "string" && value.startsWith("ocimg:");
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

  const imageStore = window.OCImageStore?.create ? window.OCImageStore.create({
    databaseName: "express-label-images-v1",
    storeName: "images",
    referencePrefix: "ocimg:express-label:"
  }) : null;

  function mergeObject(base, value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return clone(base);
    const result = clone(base);
    Object.keys(result).forEach(key => {
      if (value[key] === undefined) return;
      result[key] = result[key] && typeof result[key] === "object" && !Array.isArray(result[key])
        ? mergeObject(result[key], value[key])
        : clone(value[key]);
    });
    Object.keys(value).forEach(key => {
      if (!(key in result)) result[key] = clone(value[key]);
    });
    return result;
  }

  function normalizeLayout(layout, fallback) {
    const source = layout && typeof layout === "object" ? layout : fallback;
    return {
      x: clamp(source.x ?? fallback.x, 0, 100),
      y: clamp(source.y ?? fallback.y, 0, 100),
      width: clamp(source.width ?? fallback.width, 24, 600),
      height: clamp(source.height ?? fallback.height, 18, 600),
      rotation: clamp(source.rotation ?? fallback.rotation, -180, 180)
    };
  }

  function normalizeSticker(input, index = 0) {
    const type = input?.type === "image" ? "image" : "text";
    const fallback = { x: 50, y: 22 + (index % 8) * 6, width: type === "image" ? 120 : 130, height: type === "image" ? 100 : 44, rotation: 0 };
    return {
      id: String(input?.id || uid("sticker")),
      type,
      text: String(input?.text || "FICTIONAL PROP"),
      image: String(input?.image || ""),
      hidden: Boolean(input?.hidden),
      locked: Boolean(input?.locked),
      preserveRatio: input?.preserveRatio !== false,
      color: String(input?.color || "#33403c"),
      background: String(input?.background || "#f0ede6"),
      backgroundEnabled: input?.backgroundEnabled !== false,
      borderColor: String(input?.borderColor || input?.color || "#33403c"),
      borderWidth: clamp(input?.borderWidth ?? 1, 0, 8),
      padding: clamp(input?.padding ?? 6, 0, 30),
      opacity: clamp(input?.opacity ?? 100, 8, 100),
      font: FONTS[input?.font] ? input.font : "sans",
      fontSize: clamp(input?.fontSize ?? 14, 13, 96),
      fontWeight: [400, 600, 700, 800, 900].includes(Number(input?.fontWeight)) ? Number(input.fontWeight) : 800,
      lineHeight: clamp(input?.lineHeight ?? 1.25, 0.9, 2.4),
      letterSpacing: clamp(input?.letterSpacing ?? 0, -4, 12),
      align: ["left", "center", "right"].includes(input?.align) ? input.align : "center",
      fit: ["contain", "cover", "fill"].includes(input?.fit) ? input.fit : "contain",
      layouts: {
        portrait: normalizeLayout(input?.layouts?.portrait, fallback),
        landscape: normalizeLayout(input?.layouts?.landscape, { ...fallback, x: 68, y: 24 })
      }
    };
  }

  const TOGGLE_FIELDS = {
    domestic: ["showStub"],
    eco: ["showGreeting"]
  };
  const NUMBER_FIELDS = {
    domestic: ["chargeWeight"]
  };

  function normalizeState(value) {
    const fresh = defaultState();
    const merged = mergeObject(fresh, value || {});
    merged.format = FORMAT;
    merged.version = VERSION;
    merged.projectName = String(merged.projectName || "未命名快递面单").slice(0, 80);
    merged.template = TEMPLATE_IDS.includes(merged.template) ? merged.template : "domestic";
    merged.canvasMode = CANVAS_WIDTH[merged.canvasMode] ? merged.canvasMode : "portrait";
    merged.exportScale = String([2, 3, 4].includes(Number(merged.exportScale)) ? Number(merged.exportScale) : 2);
    merged.common.qty = clamp(merged.common.qty, 1, 999);
    merged.common.weightUnit = ["kg", "lbs", "g"].includes(merged.common.weightUnit) ? merged.common.weightUnit : "kg";
    const freshData = defaultTemplateData();
    TEMPLATE_IDS.forEach(id => {
      merged.templateData[id] = mergeObject(freshData[id], merged.templateData?.[id] || {});
      (TOGGLE_FIELDS[id] || []).forEach(key => { merged.templateData[id][key] = merged.templateData[id][key] !== false; });
      (NUMBER_FIELDS[id] || []).forEach(key => { merged.templateData[id][key] = clamp(merged.templateData[id][key], 0, 99999); });
      merged.templateColors[id] = mergeObject(DEFAULT_COLORS[id], merged.templateColors?.[id] || {});
      Object.keys(merged.templateColors[id]).forEach(key => {
        const color = String(merged.templateColors[id][key] || "");
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) merged.templateColors[id][key] = DEFAULT_COLORS[id][key];
      });
    });
    merged.barcode.showBarcode = merged.barcode.showBarcode !== false;
    merged.barcode.showQr = merged.barcode.showQr !== false;
    merged.barcode.density = clamp(Math.round(merged.barcode.density), 1, 4);
    merged.images = merged.images && typeof merged.images === "object" && !Array.isArray(merged.images) ? merged.images : {};
    Object.keys(merged.images).forEach(key => {
      const ref = merged.images[key];
      if (!isImageRef(ref) && !isDataUrl(ref)) delete merged.images[key];
    });
    merged.stickers = Array.isArray(merged.stickers) ? merged.stickers.slice(0, 40).map(normalizeSticker) : [];
    if (!merged.stickers.some(sticker => sticker.id === merged.selectedStickerId)) merged.selectedStickerId = "";
    return merged;
  }

  function getPath(object, path) {
    return path.split(".").reduce((value, key) => value?.[key], object);
  }

  function setPath(object, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const parent = keys.reduce((current, key) => current[key], object);
    parent[last] = value;
  }

  /* --------------------------------------------------------------------
     图形引擎：从 pho/script.js 参数化移植的本地 SVG 生成器
     Code128 Subset B 条码 / 确定性网格二维码 / MaxiCode 同心圆矩阵
     仅装饰用途，不编码可被真实系统识别的数据。
     -------------------------------------------------------------------- */
  const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111",
    "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411",
    "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241",
    "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143",
    "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131",
    "211412", "211214", "211232", "2331112"
  ];

  function code128SVG(text, barHeight, barColor) {
    const source = String(text || "EXPRESS").replace(/\s+/g, "") || "EXPRESS";
    let symbolIndices = [104];
    let checksum = 104;
    for (let i = 0; i < source.length; i++) {
      let code = source.charCodeAt(i) - 32;
      if (code < 0 || code > 95) code = 0;
      symbolIndices.push(code);
      checksum += code * (i + 1);
    }
    symbolIndices.push(checksum % 103);
    symbolIndices.push(106);
    let patternStr = "";
    symbolIndices.forEach(idx => { patternStr += CODE128_PATTERNS[idx] || "212222"; });
    let totalWidth = 0;
    for (let i = 0; i < patternStr.length; i++) totalWidth += parseInt(patternStr[i], 10);
    /* 显示高度直接内联在 svg 上：默认密度时等于原稿 CSS 高度，调节密度时按倍率伸缩 */
    let svg = `<svg viewBox="0 0 ${totalWidth + 10} ${barHeight}" preserveAspectRatio="none" style="width:100%;height:${barHeight}px" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    let currentX = 5;
    for (let i = 0; i < patternStr.length; i++) {
      const width = parseInt(patternStr[i], 10);
      if (i % 2 === 0) svg += `<rect x="${currentX}" y="0" width="${width}" height="${barHeight}" fill="${esc(barColor)}"/>`;
      currentX += width;
    }
    return `${svg}</svg>`;
  }

  function qrSVG(text, size, fillColor, paperColor) {
    const dataStr = String(text || "EXPRESS");
    const gridSize = 21;
    const moduleSize = size / gridSize;
    let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    svg += `<rect width="${size}" height="${size}" fill="transparent"/>`;
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      hash = (hash << 5) - hash + dataStr.charCodeAt(i);
      hash |= 0;
    }
    const isFinderPattern = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7);
    const drawFinder = (startR, startC) => {
      svg += `<rect x="${startC * moduleSize}" y="${startR * moduleSize}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="${esc(fillColor)}"/>`;
      svg += `<rect x="${(startC + 1) * moduleSize}" y="${(startR + 1) * moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="${esc(paperColor)}"/>`;
      svg += `<rect x="${(startC + 2) * moduleSize}" y="${(startR + 2) * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="${esc(fillColor)}"/>`;
    };
    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (isFinderPattern(r, c)) continue;
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) svg += `<rect x="${c * moduleSize}" y="${r * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${esc(fillColor)}"/>`;
          continue;
        }
        const val = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 9999));
        if (val > 0.45) svg += `<rect x="${c * moduleSize}" y="${r * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${esc(fillColor)}"/>`;
      }
    }
    return `${svg}</svg>`;
  }

  function maxiCodeSVG(inkColor) {
    const ink = esc(inkColor);
    let svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    svg += `<circle cx="50" cy="50" r="14" fill="none" stroke="${ink}" stroke-width="4"/>`;
    svg += `<circle cx="50" cy="50" r="8" fill="none" stroke="${ink}" stroke-width="3"/>`;
    svg += `<circle cx="50" cy="50" r="3" fill="${ink}"/>`;
    for (let x = 10; x <= 90; x += 12) {
      for (let y = 10; y <= 90; y += 12) {
        const dist = Math.hypot(x - 50, y - 50);
        if (dist > 18 && dist < 45) {
          const val = Math.sin(x * 12 + y * 7);
          if (val > -0.2) svg += `<circle cx="${x}" cy="${y}" r="3" fill="${ink}"/>`;
        }
      }
    }
    return `${svg}</svg>`;
  }

  /* 画布内联 SVG 图标（替代 Remixicon CDN） */
  const ICONS = {
    plane: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.7 3.3a1 1 0 0 0-1.1-.2L3.3 10.4a1 1 0 0 0 .1 1.9l6.3 1.9 1.9 6.3a1 1 0 0 0 1.9.1l7.3-17.3a1 1 0 0 0-.1-1zM11 12.6 6.2 11l11-4.6-6.2 6.2zm2 6.2-1.6-4.8 6.2-6.2L13 18.8z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4c-8 0-13 3.5-14.6 9.2A9.7 9.7 0 0 0 5 20.4c.4.4 1 .4 1.4 0 2.6-2.6 5.3-4 9-4.9-3 1.7-5.3 3.4-7.2 5.6 1 .5 2.2.9 3.5.9 6 0 9.3-5.6 9.3-15 0-1.7-.3-3-1-3z"/></svg>',
    smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.4 14.2a4.6 4.6 0 0 0 7.2 0"/><circle cx="9" cy="9.6" r=".8" fill="currentColor" stroke="none"/><circle cx="15" cy="9.6" r=".8" fill="currentColor" stroke="none"/></svg>',
    radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M12 12 18 5.6"/></svg>',
    ship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15.5 5 10h14l2 5.5"/><path d="M12 10V4l6 3.2"/><path d="M3 15.5c1.6 1.4 2.9 1.4 4.5 0 1.6 1.4 2.9 1.4 4.5 0 1.6 1.4 2.9 1.4 4.5 0 1.6 1.4 2.9 1.4 4.5 0" transform="translate(0 3.4)"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 5.6v5.2c0 4.4 2.9 8 7 9.6 4.1-1.6 7-5.2 7-9.6V5.6L12 3z"/><path d="m8.8 12 2.2 2.2 4.2-4.2"/></svg>',
    plant: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21v-8m0 0c0-3.5-2.6-6-6.5-6 0 3.7 2.6 6 6.5 6zm0 0c0-3.5 2.6-6 6.5-6 0 3.7-2.6 6-6.5 6z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>'
  };

  /* --------------------------------------------------------------------
     六套模板画布渲染器（DOM 结构逐套移植自 pho/index.html）
     -------------------------------------------------------------------- */
  function weightText() {
    const c = state.common;
    return `${esc(c.weight)} ${esc(c.weightUnit === "lbs" ? "LBS" : c.weightUnit)}`;
  }

  function barHeight(base) {
    return Math.round(base * DENSITY_FACTOR[state.barcode.density]);
  }

  function codeColor() {
    return state.templateColors[state.template].code;
  }

  function paperColor() {
    return state.templateColors[state.template].paper;
  }

  /* base = 原稿 CSS 中该模板条码 svg 的固定高度（如 .dom-barcode-container svg 55px） */
  function mainBarcode(base, wrapClass) {
    if (!state.barcode.showBarcode) return "";
    return `<div class="${wrapClass}">${code128SVG(state.common.trackingNo, barHeight(base), codeColor())}</div>`;
  }

  function hubBarcode(text, base) {
    if (!state.barcode.showBarcode) return "";
    return `<div class="ups-hub-barcode">${code128SVG(text, barHeight(base), codeColor())}</div>`;
  }

  function renderDomestic() {
    const c = state.common;
    const t = state.templateData.domestic;
    const qr = state.barcode.showQr;
    return `<div class="dom-header">
      <div class="dom-logo">
        <span class="dom-brand-ic">${esc(t.brandCode)}</span>
        <span class="dom-brand-txt">${esc(t.brandName)} <span>${esc(t.brandEn)}</span></span>
      </div>
      <div class="dom-service-type">
        <span class="badge-black">${esc(t.serviceType)}</span>
        <div class="dom-sub-tag">${esc(t.serviceSub)}</div>
      </div>
    </div>
    <div class="dom-routing-bar">
      <div class="dom-dest-hub">${esc(t.destHub)}</div>
      <div class="dom-routing-code">${esc(t.routingCode)}</div>
    </div>
    <div class="dom-address-sec">
      <div class="dom-row consignee-row">
        <div class="dom-cell-lbl">收<br>件</div>
        <div class="dom-cell-val">
          <div class="dom-person"><strong>${esc(c.recipient.name)}</strong> <span>${esc(c.recipient.phone)}</span></div>
          <div class="dom-address">${multiline(c.recipient.address)}</div>
        </div>
      </div>
      <div class="dom-row sender-row">
        <div class="dom-cell-lbl">寄<br>件</div>
        <div class="dom-cell-val">
          <div class="dom-person"><span class="dom-sender-name">${esc(c.sender.name)}</span> <span>${esc(c.sender.phone)}</span></div>
          <div class="dom-address">${multiline(c.sender.address)}</div>
        </div>
      </div>
    </div>
    <div class="dom-barcode-sec">
      ${mainBarcode(55, "dom-barcode-container")}
      <div class="dom-tracking-no">运单号: <span>${esc(c.trackingNo)}</span></div>
    </div>
    <div class="dom-info-grid">
      <div class="dom-qr-cell">
        ${qr ? `<div class="qr-code-box">${qrSVG(c.trackingNo, 80, codeColor(), paperColor())}</div>` : ""}
        <div class="qr-caption">扫码实时追踪</div>
      </div>
      <div class="dom-meta-cell">
        <div class="meta-row"><span>件数/重量:</span> <strong>${esc(String(c.qty))}件 / ${weightText()}</strong></div>
        <div class="meta-row"><span>付款方式:</span> <strong>${esc(t.payMethod)}</strong></div>
        <div class="meta-row"><span>计费重量:</span> <strong>${esc(String(t.chargeWeight))} ${esc(c.weightUnit === "lbs" ? "LBS" : c.weightUnit)}</strong></div>
        <div class="meta-row"><span>保价金额:</span> <strong>￥${esc(t.insureValue)}元</strong></div>
      </div>
    </div>
    <div class="dom-cargo-sec">
      <div class="cargo-title">托寄物信息:</div>
      <div class="cargo-desc">${multiline(c.cargo)}</div>
      ${c.remark ? `<div class="cargo-remark">备注: ${multiline(c.remark)}</div>` : ""}
    </div>
    ${t.showStub ? `<div class="dom-stub-divider"><span>剪割线 / 签收联 (RECEIPT STUB)</span></div>
    <div class="dom-stub-sec">
      <div class="stub-left">
        <div class="stub-dest">${esc(c.recipient.city)} ${esc(t.routingCode.split("-")[0] || "")}</div>
        <div class="stub-code">${esc(c.trackingNo)}</div>
        <div class="stub-sign">${esc(t.stubText)}</div>
      </div>
      <div class="stub-right">${qr ? `<div class="stub-qr">${qrSVG(c.trackingNo, 50, codeColor(), paperColor())}</div>` : ""}</div>
    </div>` : ""}`;
  }

  function renderUps() {
    const c = state.common;
    const t = state.templateData.ups;
    const senderHtml = `<div class="ups-sender-name">${esc(c.sender.name)}</div>
      <div class="ups-sender-line">${esc(c.sender.phone)}</div>
      <div class="ups-sender-line">${multiline(c.sender.address)}</div>
      <div class="ups-sender-line">${esc(c.sender.city)} ${esc(c.sender.zip)}</div>`;
    return `<div class="ups-top-bar">
      <div class="ups-sender-block">
        <div class="cn-sub-header">寄件人 / SENDER:</div>
        ${senderHtml}
      </div>
      <div class="ups-wt-count">
        <div class="ups-wt">${weightText()}</div>
        <div class="ups-cnt">${esc(String(c.qty))} OF ${esc(String(c.qty))}</div>
      </div>
      <div class="ups-rs-code">${esc(t.rsCode)}</div>
    </div>
    <div class="ups-ship-to-sec">
      <div class="ups-ship-lbl">SHIP TO:<span class="cn-ship-sub">收件地址</span></div>
      <div class="ups-ship-addr">
        <div class="ups-recipient-co">${esc(t.shipToCo)}</div>
        <div class="ups-recipient-name">${esc(c.recipient.name)}</div>
        <div class="ups-recipient-str">${multiline(c.recipient.address)}</div>
        <div class="ups-recipient-city">${esc(c.recipient.city)} ${esc(c.recipient.zip)}</div>
      </div>
    </div>
    <div class="ups-hr-dashed"></div>
    <div class="ups-middle-matrix">
      <div class="ups-maxicode-box"><div class="ups-maxicode">${maxiCodeSVG(codeColor())}</div></div>
      <div class="ups-routing-box">
        <div class="ups-routing-zip">${esc(t.hubZip)}</div>
        <div class="ups-cn-tag">分拨中心代码 / HUB CODE</div>
        ${hubBarcode(t.hubCode, 45)}
      </div>
    </div>
    <div class="ups-hr-thick"></div>
    <div class="ups-service-banner">
      <div class="ups-carrier-name">${esc(t.serviceName)}</div>
      <div class="ups-tracking-lbl">TRACKING # / 运单号: <span>${esc(c.trackingNo)}</span></div>
      <div class="ups-black-square"></div>
    </div>
    <div class="ups-main-barcode-sec">${mainBarcode(75, "ups-barcode-render")}</div>
    <div class="ups-hr-thick"></div>
    <div class="ups-footer-sec">
      <div class="ups-desc-line">DESC / 货品明细: <span>${esc(c.cargo)}</span></div>
      <div class="ups-service-line">${esc(t.footerDesc)}</div>
      <div class="ups-stamp-code">${esc(t.stampCode)}</div>
    </div>`;
  }

  function renderBilingual() {
    const c = state.common;
    const t = state.templateData.bilingual;
    return `<div class="cp-header">
      <div class="cp-brand">
        <div class="cp-logo-box">
          <span class="cp-logo-txt">${esc(t.brandLine1)}</span>
          <span class="cp-logo-cn">${esc(t.brandLine2)}</span>
        </div>
      </div>
      <div class="cp-service-badge">
        <div class="cp-return-txt">${esc(t.returnBadge)}</div>
        <div class="cp-sub-code">RPG | PRG</div>
      </div>
      <div class="cp-chevrons"><div class="chevron-shape"></div><span class="cp-big-num">${esc(t.routeNumber)}</span></div>
    </div>
    <div class="cp-service-title">${esc(t.serviceTitle)}</div>
    <div class="cp-to-sec">
      <div class="cp-tag-black">TO: / À: / 收件人信息:</div>
      <div class="cp-addr-block">
        <div class="cp-co">${esc(c.recipient.name)}</div>
        <div class="cp-dept">${esc(c.recipient.phone)}</div>
        <div class="cp-street">${multiline(c.recipient.address)}</div>
        <div class="cp-city">${esc(c.recipient.city)} ${esc(c.recipient.zip)}</div>
      </div>
    </div>
    <div class="cp-mid-grid">
      <div class="cp-postcode-box">
        <div class="cp-big-postcode">${esc(t.bigPostcode)}</div>
        <div class="cp-post-sub-cn">目的国邮编 / POSTAL CODE</div>
      </div>
      <div class="cp-sig-box">
        <div class="cp-sig-lbl">SIGNATURE / 签收盖章联</div>
        <div class="cp-sig-line"></div>
      </div>
    </div>
    <div class="cp-sawtooth-divider"></div>
    <div class="cp-barcode-block">
      ${mainBarcode(65, "cp-barcode-render")}
      <div class="cp-tracking-row">
        <div class="cp-tr-lbl">TRACKING NUMBER / N° DE REPÉRAGE / 追踪单号</div>
        <div class="cp-tr-num">${esc(c.trackingNo)}</div>
      </div>
    </div>
    <div class="cp-sawtooth-divider second"></div>
    <div class="cp-disclaimer">${multiline(t.disclaimer)}</div>
    <div class="cp-from-sec">
      <div class="cp-from-left">
        <div class="cp-tag-black">FROM: / DE: / 寄件人:</div>
        <div class="cp-from-name">${esc(c.sender.name)}</div>
        <div class="cp-from-addr">${multiline(c.sender.address)}</div>
        <div class="cp-from-city">${esc(c.sender.city)} ${esc(c.sender.zip)}</div>
      </div>
    </div>
    <div class="cp-footer">
      <div class="cp-foot-row"><span>EST/OÉE V2402.0.1001</span><span>SPEC 3696 V5</span><span>P/F: ${esc(c.trackingNo.replace(/\s+/g, "").slice(0, 7))}</span></div>
      <div class="cp-foot-bottom">
        <div>PIN / NIP: ${esc(t.pinNo)}</div>
        <div>Ref./Réf. ${esc(t.refNo)}</div>
        <div class="cp-sort-code">${esc(t.sortCode)}</div>
      </div>
    </div>`;
  }

  function renderCyberpunk() {
    const c = state.common;
    const t = state.templateData.cyberpunk;
    return `<div class="cyb-corner top-left"></div>
    <div class="cyb-corner top-right"></div>
    <div class="cyb-corner bottom-left"></div>
    <div class="cyb-corner bottom-right"></div>
    <div class="cyb-header">
      <div class="cyb-brand"><span class="cyb-glow-dot"></span><span class="cyb-title">${esc(t.brandTitle)}</span></div>
      <div class="cyb-security-class">${esc(t.securityClass)}</div>
    </div>
    <div class="cyb-sector-banner">
      <div class="cyb-sector-title">${esc(t.sectorTitle)}</div>
      <div class="cyb-sector-code">${esc(t.sectorCode)}</div>
      <div class="cyb-hub-tag">${esc(t.hubTag)}</div>
    </div>
    <div class="cyb-hud-grid">
      <div class="cyb-hud-box recipient-box">
        <div class="cyb-box-hdr"><i class="cyb-ic">${ICONS.radar}</i> TARGET CONSIGNEE [收件方舱位]</div>
        <div class="cyb-name">${esc(c.recipient.name)}</div>
        <div class="cyb-sub">${esc(c.recipient.phone)}</div>
        <div class="cyb-detail">${multiline(c.recipient.address)}</div>
      </div>
      <div class="cyb-hud-box sender-box">
        <div class="cyb-box-hdr"><i class="cyb-ic">${ICONS.ship}</i> DISPATCH SOURCE [寄件方源站]</div>
        <div class="cyb-name">${esc(c.sender.name)}</div>
        <div class="cyb-sub">${esc(c.sender.phone)}</div>
        <div class="cyb-detail">${multiline(c.sender.address)}</div>
      </div>
    </div>
    <div class="cyb-barcode-wrap">
      <div class="cyb-scan-line"></div>
      ${mainBarcode(50, "cyb-bc")}
      <div class="cyb-tracking-id">MANIFEST ID: <span>${esc(c.trackingNo)}</span></div>
    </div>
    <div class="cyb-specs-row">
      ${state.barcode.showQr ? `<div class="cyb-qr-area"><div class="cyb-qr">${qrSVG(c.trackingNo, 70, codeColor(), paperColor())}</div><span class="cyb-matrix-tag">ENCRYPTED RFID</span></div>` : ""}
      <div class="cyb-meta-area">
        <div class="cyb-spec-item"><span>CARGO CONTENT:</span> <strong>${esc(c.cargo)}</strong></div>
        <div class="cyb-spec-item"><span>MASS / TEMP:</span> <strong>${weightText()} / ${esc(t.temp)}</strong></div>
        <div class="cyb-spec-item"><span>HAZARD RATING:</span> <strong class="neon-amber">${esc(t.hazard)}</strong></div>
        <div class="cyb-spec-item"><span>AUTHENTICATION:</span> <strong>${esc(t.authCode)}</strong></div>
      </div>
    </div>
    <div class="cyb-footer">
      <div class="cyb-status"><i class="cyb-ic">${ICONS.shield}</i> QUANTUM ENCRYPTED VERIFIED</div>
      <div class="cyb-timestamp">${esc(t.timestamp)}</div>
    </div>`;
  }

  function renderVintage() {
    const c = state.common;
    const t = state.templateData.vintage;
    const registered = t.registeredNo || c.trackingNo;
    const declaration = t.declaration || c.cargo;
    return `<div class="vnt-border-stripe"></div>
    <div class="vnt-content">
      <div class="vnt-header">
        <div class="vnt-brand">
          <i class="vnt-plane">${ICONS.plane}</i>
          <div>
            <div class="vnt-title">${esc(t.brandTitle)}</div>
            <div class="vnt-sub">${esc(t.brandSub)}</div>
          </div>
        </div>
      </div>
      <div class="vnt-divider-line"></div>
      <div class="vnt-addresses">
        <div class="vnt-addr-box to-box">
          <div class="vnt-tag">DESTINATION / CONSIGNEE / 目的地及收件人:</div>
          <div class="vnt-name">${esc(c.recipient.name)}</div>
          <div class="vnt-street">${multiline(c.recipient.address)}</div>
          <div class="vnt-city">${esc(c.recipient.city)} ${esc(c.recipient.zip)}</div>
        </div>
        <div class="vnt-addr-box from-box">
          <div class="vnt-tag">SENDER / EXPÉDITEUR / 寄件人信息:</div>
          <div class="vnt-name">${esc(c.sender.name)}</div>
          <div class="vnt-street">${multiline(c.sender.address)}</div>
          <div class="vnt-city">${esc(c.sender.city)} ${esc(c.sender.zip)}</div>
        </div>
      </div>
      <div class="vnt-barcode-area">
        ${mainBarcode(55, "vnt-bc")}
        <div class="vnt-tracking-no">REGISTERED NO. / 挂号单号: <span>${esc(registered)}</span></div>
      </div>
      <div class="vnt-bottom-row">
        <div class="vnt-goods-sec">
          <div class="vnt-goods-lbl">CONTENTS / DECLARATION / 海关申报物品:</div>
          <div class="vnt-goods-txt">${multiline(declaration)}</div>
          <div class="vnt-weight-txt">NET WEIGHT / 净重: ${esc(t.netWeight)} KG</div>
        </div>
      </div>
    </div>
    <div class="vnt-border-stripe bottom"></div>`;
  }

  function renderEco() {
    const c = state.common;
    const t = state.templateData.eco;
    const greetTitle = t.greetingTitle || `Hello, ${c.recipient.name}!`;
    return `<div class="eco-header">
      <div class="eco-brand">
        <span class="eco-leaf-icon">${ICONS.leaf}</span>
        <div class="eco-brand-txt">
          <strong>${esc(t.brandName)}</strong>
          <span>${esc(t.brandSlogan)}</span>
        </div>
      </div>
      <div class="eco-badge"><i class="eco-badge-ic">${ICONS.plant}</i> ${esc(t.badgeText)}</div>
    </div>
    ${t.showGreeting ? `<div class="eco-greeting">
      <div class="eco-smile-ic">${ICONS.smile}</div>
      <div class="eco-greet-txt">
        <strong>${esc(greetTitle)}</strong>
        <p>${multiline(t.greetingBody)}</p>
      </div>
    </div>` : ""}
    <div class="eco-addr-grid">
      <div class="eco-card dest">
        <span class="eco-card-tag">收货地址 / Deliver To</span>
        <div class="eco-person-name">${esc(c.recipient.name)} <small>${esc(c.recipient.phone)}</small></div>
        <div class="eco-address-desc">${multiline(c.recipient.address)}</div>
      </div>
      <div class="eco-card src">
        <span class="eco-card-tag">发货品牌 / Brand Origin</span>
        <div class="eco-person-name">${esc(c.sender.name)}</div>
        <div class="eco-address-desc">${multiline(c.sender.address)}</div>
      </div>
    </div>
    <div class="eco-barcode-sec">
      ${mainBarcode(50, "eco-bc")}
      <div class="eco-track-code">ECO-TRACK: <strong>${esc(c.trackingNo)}</strong></div>
    </div>
    <div class="eco-footer">
      ${state.barcode.showQr ? `<div class="eco-qr-box"><div class="eco-qr">${qrSVG(c.trackingNo, 60, codeColor(), paperColor())}</div><span>${esc(t.qrCaption)}</span></div>` : ""}
      <div class="eco-details">
        <div class="eco-item"><span>包含物品:</span> <strong>${esc(c.cargo)}</strong></div>
        <div class="eco-item"><span>减碳贡献:</span> <strong>${esc(t.carbonSaving)}</strong></div>
        <div class="eco-item"><span>包材材质:</span> <strong>${esc(t.packMaterial)}</strong></div>
        <div class="eco-item"><span>件数/重量:</span> <strong>${esc(String(c.qty))} 件 / ${weightText()}</strong></div>
      </div>
    </div>`;
  }

  const TEMPLATE_RENDERERS = {
    domestic: renderDomestic,
    ups: renderUps,
    bilingual: renderBilingual,
    cyberpunk: renderCyberpunk,
    vintage: renderVintage,
    eco: renderEco
  };

  /* --------------------------------------------------------------------
     状态、历史与保存
     -------------------------------------------------------------------- */
  function loadLocal() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed?.format === FORMAT ? parsed : null;
    } catch (_error) {
      return null;
    }
  }

  let state = normalizeState(loadLocal());
  let history = [];
  let future = [];
  let previewZoom = 1;
  let saveTimer = 0;
  let fitTimer = 0;
  let toastTimer = 0;
  let inputCheckpoint = null;
  let tourIndex = 0;
  let transformSession = null;

  const canvas = $("#label-canvas");
  const viewport = $("#preview-viewport");
  const stage = $("#preview-stage");

  function scheduleSave() {
    clearTimeout(saveTimer);
    $("#save-state").textContent = "保存中";
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        $("#save-state").textContent = "已保存";
      } catch (_error) {
        $("#save-state").textContent = "本地空间不足";
      }
    }, 220);
  }

  function remember(snapshot) {
    if (!snapshot) return;
    const text = JSON.stringify(snapshot);
    if (history.length && JSON.stringify(history[history.length - 1]) === text) return;
    history.push(snapshot);
    if (history.length > 80) history.shift();
    future = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $("#undo").disabled = !history.length;
    $("#redo").disabled = !future.length;
  }

  async function replaceState(next, announce) {
    state = normalizeState(next);
    await preloadProjectImages();
    renderAll();
    scheduleSave();
    if (announce) toast(announce);
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return;
    future.push(clone(state));
    replaceState(previous, "已撤销");
    updateHistoryButtons();
  }

  function redo() {
    const next = future.pop();
    if (!next) return;
    history.push(clone(state));
    replaceState(next, "已重做");
    updateHistoryButtons();
  }

  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("show"), 2300);
  }

  function commitInputCheckpoint() {
    if (!inputCheckpoint) return;
    remember(inputCheckpoint);
    inputCheckpoint = null;
  }

  /* --------------------------------------------------------------------
     贴纸渲染与画布渲染
     -------------------------------------------------------------------- */
  function resolveImage(reference) {
    if (!reference) return "";
    return imageStore?.resolve ? imageStore.resolve(reference) || "" : reference;
  }

  function renderSticker(sticker, index) {
    const layout = sticker.layouts[state.canvasMode];
    const selected = state.selectedStickerId === sticker.id;
    const justify = sticker.align === "left" ? "flex-start" : sticker.align === "right" ? "flex-end" : "center";
    const style = [
      `--sticker-x:${layout.x}%`, `--sticker-y:${layout.y}%`, `--sticker-width:${layout.width}px`, `--sticker-height:${layout.height}px`,
      `--sticker-rotation:${layout.rotation}deg`, `--sticker-z:${index + 1}`, `--sticker-opacity:${sticker.opacity / 100}`,
      `--sticker-color:${sticker.color}`, `--sticker-bg:${sticker.backgroundEnabled ? sticker.background : "transparent"}`,
      `--sticker-border-color:${sticker.borderColor}`, `--sticker-border:${sticker.borderWidth}px`, `--sticker-padding:${sticker.padding}px`,
      `--sticker-font:${FONTS[sticker.font]}`, `--sticker-font-size:${sticker.fontSize}px`, `--sticker-weight:${sticker.fontWeight}`,
      `--sticker-line-height:${sticker.lineHeight}`, `--sticker-letter-spacing:${sticker.letterSpacing}px`, `--sticker-align:${sticker.align}`,
      `--sticker-justify:${justify}`, `--sticker-fit:${sticker.fit}`
    ].join(";");
    const content = sticker.type === "image"
      ? `<div class="sticker-content"><img src="${esc(resolveImage(sticker.image))}" alt=""></div>`
      : `<div class="sticker-content">${esc(sticker.text)}</div>`;
    return `<div class="canvas-sticker ${sticker.type}-sticker${selected ? " is-selected" : ""}${sticker.hidden ? " is-hidden" : ""}${sticker.locked ? " is-locked" : ""}" data-sticker-id="${esc(sticker.id)}" style="${style}">${content}<button class="sticker-handle sticker-rotate" data-transform="rotate" type="button" aria-label="旋转贴纸"></button><button class="sticker-handle sticker-resize" data-transform="resize" type="button" aria-label="调整贴纸尺寸"></button></div>`;
  }

  function renderCanvas() {
    const colors = state.templateColors[state.template];
    canvas.dataset.template = state.template;
    canvas.dataset.mode = state.canvasMode;
    canvas.style.setProperty("--tpl-paper", colors.paper);
    canvas.style.setProperty("--tpl-ink", colors.ink);
    canvas.style.setProperty("--tpl-accent", colors.accent);
    canvas.style.setProperty("--tpl-muted", colors.muted);
    canvas.style.setProperty("--tpl-line", colors.line);
    canvas.style.setProperty("--tpl-code", colors.code);
    const paper = TEMPLATE_RENDERERS[state.template]();
    canvas.innerHTML = `<div class="label-paper tpl-${esc(state.template)}">${paper}</div><div class="sticker-layer">${state.stickers.map(renderSticker).join("")}</div>`;
    /* 高度随内容变化，渲染后同步外层 stage 尺寸 */
    requestAnimationFrame(syncStageSize);
  }

  /* --------------------------------------------------------------------
     schema 驱动的编辑面板
     -------------------------------------------------------------------- */
  function fieldControl(field, bindAttr, bindValue, currentValue) {
    const bind = `${bindAttr}="${esc(bindValue)}"`;
    if (field.type === "textarea") {
      return `<label class="field"><span>${esc(field.label)}</span><textarea ${bind} rows="${field.rows || 2}">${esc(currentValue ?? "")}</textarea></label>`;
    }
    if (field.type === "select") {
      const options = (field.options || []).map(([value, label]) => `<option value="${esc(value)}"${String(currentValue) === String(value) ? " selected" : ""}>${esc(label)}</option>`).join("");
      return `<label class="field"><span>${esc(field.label)}</span><select ${bind}>${options}</select></label>`;
    }
    if (field.type === "number") {
      const min = field.min !== undefined ? ` min="${field.min}"` : "";
      const max = field.max !== undefined ? ` max="${field.max}"` : "";
      const step = field.step !== undefined ? ` step="${field.step}"` : "";
      return `<label class="field"><span>${esc(field.label)}</span><input type="number" ${bind}${min}${max}${step} value="${esc(String(currentValue ?? ""))}"></label>`;
    }
    if (field.type === "toggle") {
      return `<label class="switch-field"><input type="checkbox" ${bind}${currentValue ? " checked" : ""}> <span>${esc(field.label)}</span></label>`;
    }
    return `<label class="field"><span>${esc(field.label)}</span><input type="text" ${bind} value="${esc(String(currentValue ?? ""))}" autocomplete="off"></label>`;
  }

  function renderCommonForm() {
    $("#common-form").innerHTML = COMMON_SCHEMA.map(section => `<section class="editor-card" data-common-section="${esc(section.key)}">
      <div class="card-title"><div><h2>${esc(section.title)}</h2></div></div>
      ${section.fields.map(field => fieldControl(field, "data-cpath", field.path, getPath(state.common, field.path))).join("")}
    </section>`).join("");
  }

  function renderTemplateForm() {
    const schema = TEMPLATE_SCHEMAS[state.template];
    const data = state.templateData[state.template];
    $("#template-group-title").textContent = `本模板专属 · ${TEMPLATE_INFO[state.template].name}`;
    $("#template-form").innerHTML = schema.sections.map(section => `<section class="editor-card" data-template-section="${esc(section.key)}">
      <div class="card-title"><div><h2>${esc(section.title)}</h2></div></div>
      ${section.fields.map(field => fieldControl(field, "data-tfield", field.key, data[field.key])).join("")}
    </section>`).join("");
  }

  function renderThemes() {
    $("#theme-grid").innerHTML = TEMPLATE_IDS.map(id => {
      const colors = state.templateColors[id];
      const info = TEMPLATE_INFO[id];
      return `<button class="theme-card${state.template === id ? " active" : ""}" data-template="${id}" type="button"><i style="--swatch-paper:${esc(colors.paper)};--swatch-ink:${esc(colors.ink)};--swatch-accent:${esc(colors.accent)}"></i><span><strong>${esc(info.name)}</strong><small>${esc(info.meta)}</small></span></button>`;
    }).join("");
  }

  function stickerLabel(sticker) {
    return sticker.type === "image" ? "图片贴纸" : (sticker.text.trim().split(/\s+/).slice(0, 5).join(" ") || "文字贴纸");
  }

  function renderStickerList() {
    $("#sticker-list").innerHTML = state.stickers.length ? state.stickers.slice().reverse().map((sticker, reverseIndex) => {
      const index = state.stickers.length - 1 - reverseIndex;
      return `<div class="sticker-row${sticker.id === state.selectedStickerId ? " active" : ""}" data-sticker-row="${esc(sticker.id)}">
        <div class="sticker-row-copy"><strong>${esc(stickerLabel(sticker))}</strong><span>${sticker.hidden ? "隐藏" : sticker.locked ? "锁定" : sticker.type === "image" ? "IMAGE" : "TEXT"}</span></div>
        <div class="sticker-row-actions">
          <button type="button" data-move-sticker="up" data-sticker-target="${esc(sticker.id)}"${index >= state.stickers.length - 1 ? " disabled" : ""} aria-label="上移一层">↑</button>
          <button type="button" data-move-sticker="down" data-sticker-target="${esc(sticker.id)}"${index <= 0 ? " disabled" : ""} aria-label="下移一层">↓</button>
          <button type="button" data-toggle-sticker="${esc(sticker.id)}" aria-label="显示或隐藏">${sticker.hidden ? "○" : "●"}</button>
          <button type="button" data-delete-sticker="${esc(sticker.id)}" aria-label="删除">×</button>
        </div>
      </div>`;
    }).join("") : `<p class="empty-note">还没有贴纸。先添加文字、图片或预设印章。</p>`;
  }

  function renderStickerEditor() {
    const sticker = state.stickers.find(item => item.id === state.selectedStickerId);
    const editor = $("#sticker-editor");
    if (!sticker) {
      editor.innerHTML = `<p class="empty-note">请新建或选择一个贴纸。</p>`;
      return;
    }
    const layout = sticker.layouts[state.canvasMode];
    const contentField = sticker.type === "text"
      ? `<label class="field wide"><span>文字</span><textarea data-sticker-field="text" rows="2">${esc(sticker.text)}</textarea></label>`
      : `<label class="field"><span>图片适配</span><select data-sticker-field="fit"><option value="contain">完整</option><option value="cover">铺满</option><option value="fill">拉伸</option></select></label>`;
    editor.innerHTML = `<div class="sticker-controls-grid">${contentField}
      ${sticker.type === "text" ? `<label class="field"><span>字体</span><select data-sticker-field="font"><option value="sans">无衬线</option><option value="serif">衬线</option><option value="mono">等宽</option></select></label>
      <label class="field"><span>字重</span><select data-sticker-field="fontWeight"><option>400</option><option>600</option><option>700</option><option>800</option><option>900</option></select></label>
      <label class="field"><span>字号</span><input type="number" min="13" max="96" data-sticker-field="fontSize" value="${sticker.fontSize}"></label>
      <label class="field"><span>行高</span><input type="number" min="0.9" max="2.4" step="0.05" data-sticker-field="lineHeight" value="${sticker.lineHeight}"></label>
      <label class="field"><span>字距</span><input type="number" min="-4" max="12" step="0.5" data-sticker-field="letterSpacing" value="${sticker.letterSpacing}"></label>
      <label class="field"><span>对齐</span><select data-sticker-field="align"><option value="left">左</option><option value="center">中</option><option value="right">右</option></select></label>` : ""}
      <label class="color-field"><span>文字色</span><input type="color" data-sticker-field="color" value="${esc(sticker.color)}"></label>
      <label class="color-field"><span>背景色</span><input type="color" data-sticker-field="background" value="${esc(sticker.background)}"></label>
      <label class="color-field"><span>边框色</span><input type="color" data-sticker-field="borderColor" value="${esc(sticker.borderColor)}"></label>
      <label class="field"><span>边框宽</span><input type="number" min="0" max="8" data-sticker-field="borderWidth" value="${sticker.borderWidth}"></label>
      <label class="field"><span>内边距</span><input type="number" min="0" max="30" data-sticker-field="padding" value="${sticker.padding}"></label>
      <label class="field"><span>透明度</span><input type="range" min="8" max="100" data-sticker-field="opacity" value="${sticker.opacity}"></label>
      <label class="field"><span>X %</span><input type="number" min="0" max="100" step="0.1" data-layout-field="x" value="${layout.x}"></label>
      <label class="field"><span>Y %</span><input type="number" min="0" max="100" step="0.1" data-layout-field="y" value="${layout.y}"></label>
      <label class="field"><span>宽度</span><input type="number" min="24" max="600" data-layout-field="width" value="${Math.round(layout.width)}"></label>
      <label class="field"><span>高度</span><input type="number" min="18" max="600" data-layout-field="height" value="${Math.round(layout.height)}"></label>
      <label class="field"><span>旋转</span><input type="number" min="-180" max="180" data-layout-field="rotation" value="${Math.round(layout.rotation)}"></label>
    </div>
    <div class="check-grid"><label><input type="checkbox" data-sticker-field="backgroundEnabled"${sticker.backgroundEnabled ? " checked" : ""}> 显示背景</label><label><input type="checkbox" data-sticker-field="preserveRatio"${sticker.preserveRatio ? " checked" : ""}> 保持比例</label><label><input type="checkbox" data-sticker-field="locked"${sticker.locked ? " checked" : ""}> 锁定</label><label><input type="checkbox" data-sticker-field="hidden"${sticker.hidden ? " checked" : ""}> 隐藏</label></div>
    <div class="sticker-add-actions triple"><button class="button compact" type="button" data-sticker-action="duplicate">复制贴纸</button><button class="button compact" type="button" data-layer-action="front">移到最上</button><button class="button compact" type="button" data-layer-action="back">移到最下</button></div>`;
    $$('[data-sticker-field="font"], [data-sticker-field="fontWeight"], [data-sticker-field="align"], [data-sticker-field="fit"]', editor).forEach(node => { node.value = String(sticker[node.dataset.stickerField]); });
    refreshColorPicker();
  }

  function syncControls() {
    $("#project-name").value = state.projectName;
    $$('[data-template-color]').forEach(node => { node.value = state.templateColors[state.template][node.dataset.templateColor]; });
    $$('[data-canvas-mode]').forEach(node => node.classList.toggle("active", node.dataset.canvasMode === state.canvasMode));
    $("#barcode-density").value = String(state.barcode.density);
    $("#barcode-density-output").textContent = DENSITY_LABEL[state.barcode.density];
    $("#show-barcode").checked = state.barcode.showBarcode;
    $("#show-qr").checked = state.barcode.showQr;
    $("#export-scale").value = state.exportScale;
    if (window.OCColorPicker?.sync) window.OCColorPicker.sync();
  }

  function refreshColorPicker() {
    /* 新增控件由 oc-color-picker 的 MutationObserver 自动接管，这里只同步色块预览 */
    if (window.OCColorPicker?.sync) requestAnimationFrame(() => window.OCColorPicker.sync());
  }

  function renderAll({ fit = true } = {}) {
    renderCommonForm();
    renderTemplateForm();
    renderThemes();
    renderStickerList();
    renderStickerEditor();
    syncControls();
    renderCanvas();
    updateHistoryButtons();
    refreshColorPicker();
    if (fit) scheduleFit();
  }

  function scheduleFit() {
    clearTimeout(fitTimer);
    fitTimer = window.setTimeout(fitCanvas, 20);
  }

  /* 同时按可用宽度与高度适配，让完整导出区域尽量一次显示在预览区内。 */
  function fitCanvas() {
    if (!viewport || !stage || !canvas) return;
    canvas.style.transform = "none";
    const viewportStyle = window.getComputedStyle(viewport);
    const horizontalPadding = (parseFloat(viewportStyle.paddingLeft) || 0) + (parseFloat(viewportStyle.paddingRight) || 0);
    const verticalPadding = (parseFloat(viewportStyle.paddingTop) || 0) + (parseFloat(viewportStyle.paddingBottom) || 0);
    const width = Math.max(1, canvas.offsetWidth || CANVAS_WIDTH[state.canvasMode]);
    const height = Math.max(1, canvas.offsetHeight);
    const availableWidth = Math.max(80, viewport.clientWidth - horizontalPadding);
    const availableHeight = Math.max(80, viewport.clientHeight - verticalPadding);
    previewZoom = Math.min(3, Math.max(0.1, Math.min(availableWidth / width, availableHeight / height)));
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${previewZoom})`;
    syncStageSize();
  }

  function syncStageSize() {
    if (!stage || !canvas) return;
    stage.style.width = `${canvas.offsetWidth * previewZoom}px`;
    stage.style.height = `${canvas.offsetHeight * previewZoom}px`;
  }

  /* --------------------------------------------------------------------
     表单输入绑定
     -------------------------------------------------------------------- */
  function fieldValue(node) {
    if (node.type === "checkbox") return node.checked;
    if (node.type === "range" || node.type === "number") return Number(node.value);
    return node.value;
  }

  function handleCommonInput(node) {
    if (!inputCheckpoint) inputCheckpoint = clone(state);
    setPath(state.common, node.dataset.cpath, fieldValue(node));
    renderCanvas();
    scheduleFit();
    scheduleSave();
  }

  function handleTemplateInput(node) {
    if (!inputCheckpoint) inputCheckpoint = clone(state);
    state.templateData[state.template][node.dataset.tfield] = fieldValue(node);
    renderCanvas();
    scheduleFit();
    scheduleSave();
  }

  /* --------------------------------------------------------------------
     贴纸操作
     -------------------------------------------------------------------- */
  const STICKER_PRESETS = {
    fragile: { text: "FRAGILE\n易碎", color: "#a33f3f", background: "#f6e8e6", borderColor: "#a33f3f", borderWidth: 2, font: "mono", fontSize: 15, rotation: -8, width: 112, height: 58 },
    thisway: { text: "此面向上 ↑", color: "#22405c", background: "#e6edf4", borderColor: "#22405c", borderWidth: 2, font: "sans", fontSize: 14, rotation: 0, width: 126, height: 40 },
    signature: { text: "SIGNATURE\n签收", color: "#3c4a41", background: "#e8efe8", borderColor: "#3c4a41", borderWidth: 2, font: "mono", fontSize: 13, rotation: 6, width: 106, height: 54 },
    urgent: { text: "URGENT 加急", color: "#8a6230", background: "#f6eeda", borderColor: "#8a6230", borderWidth: 2, font: "mono", fontSize: 15, rotation: -5, width: 132, height: 40 },
    fictional: { text: "FICTIONAL PROP / NOT VALID FOR POSTAGE", color: "#5c5f66", background: "#eef0f2", borderColor: "#5c5f66", borderWidth: 1, font: "mono", fontSize: 13, rotation: 0, width: 200, height: 46 }
  };

  function addTextSticker(text) {
    const before = clone(state);
    const value = String(text || "").trim() || "FICTIONAL PROP";
    const colors = state.templateColors[state.template];
    const sticker = normalizeSticker({
      id: uid("sticker"), type: "text", text: value,
      color: colors.ink, background: colors.paper, borderColor: colors.accent,
      borderWidth: 1, font: "sans", fontSize: 14, fontWeight: 800,
      layouts: {
        portrait: { x: 64, y: 22, width: 126, height: 42, rotation: 0 },
        landscape: { x: 74, y: 20, width: 136, height: 42, rotation: 0 }
      }
    }, state.stickers.length);
    state.stickers.push(sticker);
    state.selectedStickerId = sticker.id;
    remember(before);
    renderAll({ fit: false });
    scheduleSave();
  }

  function addPresetSticker(key) {
    const preset = STICKER_PRESETS[key];
    if (!preset) return;
    const before = clone(state);
    const sticker = normalizeSticker({
      id: uid("sticker"), type: "text", text: preset.text,
      color: preset.color, background: preset.background, borderColor: preset.borderColor,
      borderWidth: preset.borderWidth, font: preset.font, fontSize: preset.fontSize,
      fontWeight: 900, lineHeight: 1.15, letterSpacing: 1,
      layouts: {
        portrait: { x: 66, y: 24, width: preset.width, height: preset.height, rotation: preset.rotation },
        landscape: { x: 76, y: 22, width: preset.width, height: preset.height, rotation: preset.rotation }
      }
    }, state.stickers.length);
    state.stickers.push(sticker);
    state.selectedStickerId = sticker.id;
    remember(before);
    renderAll({ fit: false });
    scheduleSave();
    toast("已加入预设印章贴纸");
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function storeImage(dataUrl) {
    if (!imageStore?.storeDataUrl) return dataUrl;
    try {
      const stored = await imageStore.storeDataUrl(dataUrl);
      return stored || dataUrl;
    } catch (_error) {
      return dataUrl;
    }
  }

  async function addImageSticker(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("请选择图片文件");
    const before = clone(state);
    try {
      const image = await storeImage(await fileToDataUrl(file));
      const sticker = normalizeSticker({
        id: uid("sticker"), type: "image", image, backgroundEnabled: false, borderWidth: 0,
        layouts: {
          portrait: { x: 66, y: 28, width: 120, height: 100, rotation: -4 },
          landscape: { x: 76, y: 28, width: 126, height: 100, rotation: -4 }
        }
      }, state.stickers.length);
      state.stickers.push(sticker);
      state.selectedStickerId = sticker.id;
      await preloadProjectImages();
      remember(before);
      renderAll({ fit: false });
      scheduleSave();
      toast("图片贴纸已添加（保存在浏览器 IndexedDB）");
    } catch (_error) {
      toast("图片读取失败");
    }
  }

  function selectedSticker() {
    return state.stickers.find(sticker => sticker.id === state.selectedStickerId);
  }

  function duplicateSticker() {
    const sticker = selectedSticker();
    if (!sticker) return;
    const before = clone(state);
    const copy = normalizeSticker(clone(sticker), state.stickers.length);
    copy.id = uid("sticker");
    ["portrait", "landscape"].forEach(mode => {
      copy.layouts[mode].x = clamp(copy.layouts[mode].x + 4, 0, 100);
      copy.layouts[mode].y = clamp(copy.layouts[mode].y + 4, 0, 100);
    });
    state.stickers.push(copy);
    state.selectedStickerId = copy.id;
    remember(before);
    renderAll({ fit: false });
    scheduleSave();
    toast("贴纸已复制");
  }

  function updateStickerField(node) {
    const sticker = selectedSticker();
    if (!sticker) return;
    if (!inputCheckpoint) inputCheckpoint = clone(state);
    const key = node.dataset.stickerField;
    let value = fieldValue(node);
    if (["fontSize", "fontWeight", "letterSpacing", "lineHeight", "borderWidth", "padding", "opacity"].includes(key)) value = Number(value);
    sticker[key] = value;
    if (key === "background") sticker.backgroundEnabled = true;
    state.stickers = state.stickers.map(normalizeSticker);
    renderCanvas();
    renderStickerList();
    if (key === "background") {
      const check = $('#sticker-editor [data-sticker-field="backgroundEnabled"]');
      if (check) check.checked = true;
    }
    scheduleSave();
  }

  function updateLayoutField(node) {
    const sticker = selectedSticker();
    if (!sticker) return;
    if (!inputCheckpoint) inputCheckpoint = clone(state);
    sticker.layouts[state.canvasMode][node.dataset.layoutField] = Number(node.value);
    state.stickers = state.stickers.map(normalizeSticker);
    renderCanvas();
    scheduleSave();
  }

  function layerAction(action) {
    const index = state.stickers.findIndex(sticker => sticker.id === state.selectedStickerId);
    if (index < 0) return;
    const before = clone(state);
    const [sticker] = state.stickers.splice(index, 1);
    if (action === "front") state.stickers.push(sticker);
    else state.stickers.unshift(sticker);
    remember(before);
    renderAll({ fit: false });
    scheduleSave();
  }

  function moveStickerLayer(id, direction) {
    const index = state.stickers.findIndex(sticker => sticker.id === id);
    if (index < 0) return;
    const next = direction === "up" ? index + 1 : index - 1;
    if (next < 0 || next >= state.stickers.length) return;
    const before = clone(state);
    [state.stickers[index], state.stickers[next]] = [state.stickers[next], state.stickers[index]];
    remember(before);
    renderAll({ fit: false });
    scheduleSave();
  }

  function beginStickerTransform(event, node) {
    const sticker = state.stickers.find(item => item.id === node.dataset.stickerId);
    if (!sticker) return;
    if (state.selectedStickerId !== sticker.id) {
      state.selectedStickerId = sticker.id;
      renderStickerList();
      renderStickerEditor();
      $(`.canvas-sticker[data-sticker-id="${CSS.escape(sticker.id)}"]`, canvas)?.classList.add("is-selected");
    }
    if (sticker.locked) return;
    event.preventDefault();
    node.setPointerCapture?.(event.pointerId);
    const type = event.target.closest("[data-transform]")?.dataset.transform || "drag";
    const layout = clone(sticker.layouts[state.canvasMode]);
    const rect = node.getBoundingClientRect();
    transformSession = {
      pointerId: event.pointerId,
      stickerId: sticker.id,
      type,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      layout,
      before: clone(state)
    };
  }

  function moveStickerTransform(event) {
    const session = transformSession;
    if (!session || session.pointerId !== event.pointerId) return;
    const sticker = state.stickers.find(item => item.id === session.stickerId);
    if (!sticker) return;
    const layout = sticker.layouts[state.canvasMode];
    const width = canvas.offsetWidth || CANVAS_WIDTH[state.canvasMode];
    const height = canvas.offsetHeight || 1;
    const dx = (event.clientX - session.startX) / previewZoom;
    const dy = (event.clientY - session.startY) / previewZoom;
    if (session.type === "drag") {
      layout.x = clamp(session.layout.x + dx / width * 100, 0, 100);
      layout.y = clamp(session.layout.y + dy / height * 100, 0, 100);
    } else if (session.type === "resize") {
      if (sticker.preserveRatio) {
        const ratio = session.layout.width / session.layout.height;
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy * ratio;
        layout.width = clamp(session.layout.width + delta, 24, 600);
        layout.height = clamp(layout.width / ratio, 18, 600);
      } else {
        layout.width = clamp(session.layout.width + dx, 24, 600);
        layout.height = clamp(session.layout.height + dy, 18, 600);
      }
    } else {
      const angle = Math.atan2(event.clientY - session.centerY, event.clientX - session.centerX) * 180 / Math.PI;
      layout.rotation = clamp(session.layout.rotation + angle - session.startAngle, -180, 180);
    }
    renderCanvas();
  }

  function endStickerTransform(event) {
    if (!transformSession || transformSession.pointerId !== event.pointerId) return;
    remember(transformSession.before);
    transformSession = null;
    renderStickerEditor();
    scheduleSave();
  }

  /* --------------------------------------------------------------------
     图片预载、JSON 保存 / 导入、PNG 导出
     -------------------------------------------------------------------- */
  function collectImageRefs() {
    return [...Object.values(state.images || {}), ...state.stickers.map(sticker => sticker.image)].filter(isImageRef);
  }

  async function preloadProjectImages() {
    if (!imageStore?.preload) return;
    const refs = collectImageRefs();
    if (!refs.length) return;
    try { await imageStore.preload(refs); } catch (_error) { /* 占位继续可用 */ }
  }

  async function saveJson() {
    const payload = clone(state);
    payload.savedAt = new Date().toISOString();
    download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${cleanFileName(state.projectName)}.json`);
    toast("轻量 JSON 已保存（图片保存在本机浏览器）");
  }

  async function migrateImages(project) {
    const result = clone(project);
    if (result.images && typeof result.images === "object") {
      for (const key of Object.keys(result.images)) {
        if (isDataUrl(result.images[key])) result.images[key] = await storeImage(result.images[key]);
      }
    }
    if (Array.isArray(result.stickers)) {
      for (const sticker of result.stickers) {
        if (isDataUrl(sticker.image)) sticker.image = await storeImage(sticker.image);
      }
    }
    return result;
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== FORMAT) throw new Error("format");
      const before = clone(state);
      const migrated = await migrateImages(parsed);
      state = normalizeState(migrated);
      history = [before];
      future = [];
      await preloadProjectImages();
      renderAll();
      scheduleSave();
      toast("项目已导入");
    } catch (_error) {
      toast("无法导入：文件格式不匹配");
    }
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function waitForImages(root) {
    await Promise.all($$("img", root).map(image => image.complete && image.naturalWidth ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
      setTimeout(resolve, 2400);
    })));
  }

  function safeScale(node, requested) {
    const area = node.scrollWidth * node.scrollHeight;
    const pixels = area * requested * requested;
    return pixels > 95000000 ? Math.max(1, Math.floor(Math.sqrt(95000000 / area) * 10) / 10) : requested;
  }

  async function exportPng(target) {
    if (!window.htmlToImage?.toPng) return toast("导出组件未载入，请刷新页面");
    await preloadProjectImages();
    renderCanvas();
    await waitForImages(canvas);
    if (document.fonts?.ready) await document.fonts.ready;
    await frame(); await frame();
    let node = canvas;
    let backgroundColor = state.templateColors[state.template].paper;
    if (target === "stickers") {
      node = $(".sticker-layer", canvas);
      backgroundColor = null;
      if (!state.stickers.some(sticker => !sticker.hidden)) return toast("没有可导出的贴纸");
    }
    const requested = Number(state.exportScale) || 2;
    const scale = safeScale(node, requested);
    const oldTransform = canvas.style.transform;
    canvas.classList.add("is-exporting");
    canvas.style.transform = "none";
    try {
      const fontEmbedCSS = window.OCExportFonts?.getFontEmbedCSS ? await window.OCExportFonts.getFontEmbedCSS(node) : undefined;
      /* 定宽不定高：导出尺寸取节点真实 scrollWidth / scrollHeight */
      const dataUrl = await window.htmlToImage.toPng(node, {
        pixelRatio: scale,
        backgroundColor,
        cacheBust: true,
        fontEmbedCSS,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: { transform: "none", transformOrigin: "top left" }
      });
      const blob = await (await fetch(dataUrl)).blob();
      download(blob, `${cleanFileName(state.projectName)}-${state.template}-${target}-${state.canvasMode}.png`);
      toast(scale < requested ? `已按安全倍率 ${scale}x 导出` : "PNG 已导出");
    } catch (error) {
      console.error(error);
      toast("导出失败，请减少倍率或图片数量");
    } finally {
      canvas.classList.remove("is-exporting");
      canvas.style.transform = oldTransform;
    }
  }

  function newProject() {
    const before = clone(state);
    state = normalizeState(defaultState());
    remember(before);
    renderAll();
    scheduleSave();
    toast("已建立新的示例项目");
  }

  /* --------------------------------------------------------------------
     手机分屏、聚焦式教程
     -------------------------------------------------------------------- */
  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$('[data-mobile-panel]').forEach(node => node.classList.toggle("active", node.dataset.mobilePanel === panel));
  }

  function initMobileResizer() {
    const resizer = $("#mobile-resizer");
    let start = null;
    const apply = value => {
      const ratio = clamp(value, 22, 72);
      document.documentElement.style.setProperty("--mobile-preview-height", `${ratio}dvh`);
      resizer.setAttribute("aria-valuenow", Math.round(ratio));
      scheduleFit();
    };
    resizer.addEventListener("pointerdown", event => {
      if (window.innerWidth > 900) return;
      start = { id: event.pointerId, y: event.clientY, value: Number(resizer.getAttribute("aria-valuenow")) || 40 };
      resizer.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    resizer.addEventListener("pointermove", event => {
      if (!start || start.id !== event.pointerId) return;
      apply(start.value + (event.clientY - start.y) / window.innerHeight * 100);
    });
    const end = event => { if (start?.id === event.pointerId) start = null; };
    resizer.addEventListener("pointerup", end);
    resizer.addEventListener("pointercancel", end);
    resizer.addEventListener("keydown", event => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      apply((Number(resizer.getAttribute("aria-valuenow")) || 40) + (event.key === "ArrowUp" ? -3 : 3));
    });
  }

  const TOUR = [
    { target: "#common-group", title: "填写共通内容", copy: "收件人、寄件人、运单号与货品是六套模板共享的同一份数据，改一次全部模板同时生效。" },
    { target: "#templates-card", title: "切换模板与专属字段", copy: "六套模板逐套移植样稿构图。切换后左栏「本模板专属」整组更换，任何已填内容都不会丢失。" },
    { target: "#colors-card", title: "模板配色与条码外观", copy: "每套模板独立保存六种颜色，条码与二维码墨色也会跟随。可随时恢复默认配色。" },
    { target: "#add-sticker-card", title: "添加贴纸", copy: "文字、图片和预设印章贴纸都可拖动、缩放、旋转，并拥有自己的字体与颜色。" },
    { target: "#layout-card", title: "横竖版分别微调", copy: "竖版宽 380px、横版宽 580px，高度由内容自然决定。贴纸在两种方向下分别记住几何位置，可分开摆放。" },
    { target: "#export-card", title: "导出成品", copy: "可导出完整面单或透明贴纸层，支持 2×/3×/4×。所有条码只是装饰图形，不可扫描。" }
  ];

  function positionTour() {
    const item = TOUR[tourIndex];
    const target = $(item.target);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const focus = $("#tour-focus");
    focus.style.left = `${Math.max(5, rect.left - 5)}px`;
    focus.style.top = `${Math.max(5, rect.top - 5)}px`;
    focus.style.width = `${Math.min(window.innerWidth - 10, rect.width + 10)}px`;
    focus.style.height = `${Math.min(window.innerHeight - 10, rect.height + 10)}px`;
    const card = $("#tour-card");
    if (window.innerWidth > 900) {
      const cardWidth = 310;
      const left = rect.right + 14 + cardWidth < window.innerWidth ? rect.right + 14 : Math.max(12, rect.left - cardWidth - 14);
      card.style.left = `${left}px`;
      card.style.top = `${clamp(rect.top, 12, window.innerHeight - 260)}px`;
    }
    $("#tour-title").textContent = item.title;
    $("#tour-copy").textContent = item.copy;
    $("#tour-progress").textContent = `${tourIndex + 1} / ${TOUR.length}`;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR.length - 1 ? "完成" : "下一步";
  }

  function openTour(index = 0) {
    tourIndex = clamp(index, 0, TOUR.length - 1);
    const target = $(TOUR[tourIndex].target);
    if (window.innerWidth <= 900 && target?.closest(".style-panel")) setMobilePanel("style");
    if (window.innerWidth <= 900 && target?.closest(".content-panel")) setMobilePanel("content");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#tour-overlay").hidden = false;
    setTimeout(positionTour, 280);
  }

  function closeTour() {
    $("#tour-overlay").hidden = true;
  }

  /* --------------------------------------------------------------------
     事件绑定与初始化
     -------------------------------------------------------------------- */
  function bindEvents() {
    document.addEventListener("focusin", event => {
      if (event.target.matches('[data-cpath], [data-tfield], [data-sticker-field], [data-layout-field], [data-template-color], #project-name')) inputCheckpoint ||= clone(state);
    });
    document.addEventListener("focusout", event => {
      if (event.target.matches('[data-cpath], [data-tfield], [data-sticker-field], [data-layout-field], [data-template-color], #project-name')) commitInputCheckpoint();
    });

    document.addEventListener("input", event => {
      const target = event.target;
      if (target.matches("[data-cpath]")) handleCommonInput(target);
      if (target.matches("[data-tfield]")) handleTemplateInput(target);
      if (target.matches("[data-sticker-field]")) updateStickerField(target);
      if (target.matches("[data-layout-field]")) updateLayoutField(target);
      if (target.matches("[data-template-color]")) {
        if (!inputCheckpoint) inputCheckpoint = clone(state);
        const value = String(target.value || "");
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
          state.templateColors[state.template][target.dataset.templateColor] = value;
          renderCanvas();
          renderThemes();
          scheduleSave();
        }
      }
      if (target.id === "project-name") {
        if (!inputCheckpoint) inputCheckpoint = clone(state);
        state.projectName = target.value;
        scheduleSave();
      }
      if (target.id === "barcode-density") {
        if (!inputCheckpoint) inputCheckpoint = clone(state);
        state.barcode.density = clamp(Number(target.value), 1, 4);
        $("#barcode-density-output").textContent = DENSITY_LABEL[state.barcode.density];
        renderCanvas();
        scheduleFit();
        scheduleSave();
      }
    });

    document.addEventListener("change", event => {
      const target = event.target;
      if (target.matches("[data-cpath]")) {
        handleCommonInput(target);
        if (["checkbox", "select-one", "range", "number"].includes(target.type)) commitInputCheckpoint();
      }
      if (target.matches("[data-tfield]")) {
        handleTemplateInput(target);
        if (["checkbox", "select-one", "range", "number"].includes(target.type)) commitInputCheckpoint();
      }
      if (target.matches("[data-sticker-field], [data-layout-field], [data-template-color]")) commitInputCheckpoint();
      if (target.id === "show-barcode" || target.id === "show-qr") {
        const before = clone(state);
        state.barcode.showBarcode = $("#show-barcode").checked;
        state.barcode.showQr = $("#show-qr").checked;
        remember(before);
        renderCanvas();
        scheduleFit();
        scheduleSave();
      }
      if (target.id === "barcode-density") commitInputCheckpoint();
      if (target.id === "export-scale") {
        state.exportScale = String([2, 3, 4].includes(Number(target.value)) ? Number(target.value) : 2);
        scheduleSave();
      }
    });

    document.addEventListener("click", event => {
      const groupToggle = event.target.closest("[data-group-toggle]");
      if (groupToggle) { groupToggle.closest(".form-group")?.classList.toggle("collapsed"); return; }
      const theme = event.target.closest("[data-template]");
      if (theme) {
        if (state.template !== theme.dataset.template) {
          const before = clone(state);
          state.template = theme.dataset.template;
          remember(before);
          renderAll();
          scheduleSave();
        }
        return;
      }
      const mode = event.target.closest("[data-canvas-mode]");
      if (mode) {
        if (state.canvasMode !== mode.dataset.canvasMode) {
          const before = clone(state);
          state.canvasMode = mode.dataset.canvasMode;
          remember(before);
          renderAll();
          scheduleSave();
        }
        return;
      }
      const move = event.target.closest("[data-move-sticker]");
      if (move) { moveStickerLayer(move.dataset.stickerTarget, move.dataset.moveSticker); return; }
      const toggle = event.target.closest("[data-toggle-sticker]");
      if (toggle) {
        const sticker = state.stickers.find(item => item.id === toggle.dataset.toggleSticker);
        if (sticker) {
          const before = clone(state);
          sticker.hidden = !sticker.hidden;
          remember(before);
          renderAll({ fit: false });
          scheduleSave();
        }
        return;
      }
      const removeSticker = event.target.closest("[data-delete-sticker]");
      if (removeSticker) {
        const before = clone(state);
        state.stickers = state.stickers.filter(item => item.id !== removeSticker.dataset.deleteSticker);
        if (state.selectedStickerId === removeSticker.dataset.deleteSticker) state.selectedStickerId = "";
        remember(before);
        renderAll({ fit: false });
        scheduleSave();
        return;
      }
      const stickerRow = event.target.closest("[data-sticker-row]");
      if (stickerRow && !event.target.closest("button")) {
        state.selectedStickerId = stickerRow.dataset.stickerRow;
        renderStickerList();
        renderStickerEditor();
        renderCanvas();
        return;
      }
      const stickerAction = event.target.closest("[data-sticker-action]");
      if (stickerAction) {
        if (stickerAction.dataset.stickerAction === "duplicate") duplicateSticker();
        return;
      }
      const layer = event.target.closest("[data-layer-action]");
      if (layer) { layerAction(layer.dataset.layerAction); return; }
      const preset = event.target.closest("[data-sticker-preset]");
      if (preset) { addPresetSticker(preset.dataset.stickerPreset); return; }
      const exportButton = event.target.closest("[data-export-target]");
      if (exportButton) { exportPng(exportButton.dataset.exportTarget); return; }
      const mobile = event.target.closest(".mobile-main-tabs [data-mobile-panel]");
      if (mobile) { setMobilePanel(mobile.dataset.mobilePanel); return; }
      if (event.target.closest("[data-close-tour]")) closeTour();
    });

    canvas.addEventListener("pointerdown", event => {
      const node = event.target.closest(".canvas-sticker");
      if (node) beginStickerTransform(event, node);
      else if (state.selectedStickerId) {
        state.selectedStickerId = "";
        renderStickerList();
        renderStickerEditor();
        renderCanvas();
      }
    });
    window.addEventListener("pointermove", moveStickerTransform, { passive: true });
    window.addEventListener("pointerup", endStickerTransform);
    window.addEventListener("pointercancel", endStickerTransform);

    $("#add-text-sticker").addEventListener("click", () => {
      const input = $("#new-sticker-text");
      addTextSticker(input.value);
      input.value = "";
    });
    $("#sticker-image-input").addEventListener("change", event => {
      addImageSticker(event.target.files?.[0]);
      event.target.value = "";
    });
    $("#reset-colors").addEventListener("click", () => {
      const before = clone(state);
      state.templateColors[state.template] = clone(DEFAULT_COLORS[state.template]);
      remember(before);
      renderAll({ fit: false });
      scheduleSave();
      toast("已恢复当前模板默认配色");
    });
    $("#fit-canvas").addEventListener("click", fitCanvas);
    $("#focus-preview").addEventListener("click", () => {
      document.body.classList.toggle("focus-mode");
      $("#focus-preview").textContent = document.body.classList.contains("focus-mode") ? "退出专注" : "专注";
      scheduleFit();
    });
    $("#undo").addEventListener("click", undo);
    $("#redo").addEventListener("click", redo);
    $("#new-project").addEventListener("click", newProject);
    $("#save-json").addEventListener("click", saveJson);
    $("#import-json").addEventListener("change", event => {
      importJson(event.target.files?.[0]);
      event.target.value = "";
    });
    $("#export-full").addEventListener("click", () => exportPng("full"));
    $("#start-tour").addEventListener("click", () => openTour(0));
    $("#tour-prev").addEventListener("click", () => { if (tourIndex > 0) openTour(tourIndex - 1); });
    $("#tour-next").addEventListener("click", () => { if (tourIndex >= TOUR.length - 1) closeTour(); else openTour(tourIndex + 1); });
    window.addEventListener("resize", () => {
      scheduleFit();
      if (!$("#tour-overlay").hidden) positionTour();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        if (!$("#tour-overlay").hidden) closeTour();
        else if (document.body.classList.contains("focus-mode")) $("#focus-preview").click();
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z" && !event.target.matches("input, textarea, select")) {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z")) && !event.target.matches("input, textarea, select")) {
        event.preventDefault();
        redo();
      }
    });
  }

  async function init() {
    bindEvents();
    initMobileResizer();
    await preloadProjectImages();
    renderAll();
    scheduleSave();
    /* 字体载入完成后内容高度可能变化，重新同步预览缩放与 stage 尺寸 */
    document.fonts?.ready?.then?.(() => scheduleFit());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

