export const SCHEMA_VERSION = 1;

export function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `oc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTimelineNode(overrides = {}) {
  return {
    id: createId(),
    date: "",
    age: "",
    title: "",
    summary: "",
    content: "",
    location: "",
    participants: "",
    tags: [],
    image: "",
    imageCaption: "",
    importance: "normal",
    visible: true,
    collapsed: false,
    cardTemplate: null,
    ...overrides
  };
}

export function createHeaderCharacter(overrides = {}) {
  return {
    id: createId(),
    name: "",
    foreignName: "",
    alias: "",
    birthDate: "",
    deathDate: "",
    identity: "",
    faction: "",
    biography: "",
    quote: "",
    avatar: "",
    ...overrides
  };
}

export function createDefaultProject() {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    name: "阿斯特拉大陆纪事",
    createdAt: now,
    updatedAt: now,
    header: {
      enabled: true,
      type: "world",
      template: "centered",
      portraitShape: "square",
      overlayEnabled: true,
      overlayColor: "black",
      characterCount: 1,
      relationship: "",
      characters: [createHeaderCharacter()],
      fields: {
        title: "阿斯特拉大陆纪事",
        foreignTitle: "ASTRA CHRONICLES",
        subtitle: "银月帝国兴衰与北境诸国编年",
        calendarName: "星历",
        dateRange: "星历元年至星历492年",
        description: "一部跨越近五百年的大陆纪事。从银月帝国建立，到白塔协议短暂维系的和平，再到帝国首都于暮色中陷落。",
        author: "星海档案馆",
        name: "",
        foreignName: "",
        alias: "",
        birthDate: "",
        deathDate: "",
        identity: "",
        faction: "",
        biography: "",
        quote: "",
        eventName: "",
        eventCode: "",
        startDate: "",
        endDate: "",
        location: "",
        participants: "",
        eventDescription: "",
        result: ""
      },
      avatar: "",
      emblem: "",
      mainImage: "",
      backgroundImage: ""
    },
    timeline: {
      template: "left",
      cardTemplate: "standard",
      nodes: [
        createTimelineNode({
          date: "星历元年",
          title: "银月帝国建立",
          summary: "七座城邦在银月旗下缔结盟约，星历由此开始。",
          content: "初代皇帝阿尔西昂在镜湖之畔加冕。新帝国沿用各城邦旧制，却将军权与纪年权收归中央。",
          location: "镜湖城",
          participants: "阿尔西昂一世、七城邦议会",
          tags: ["建国", "银月帝国"],
          importance: "critical"
        }),
        createTimelineNode({
          date: "星历87年",
          title: "第一次北境战争",
          summary: "北境同盟越过霜脊山口，帝国边防体系首次遭受全面冲击。",
          content: "战争持续九年，最终以双方均无法承受的消耗告终。北境由此成为帝国此后数百年的战略焦点。",
          location: "霜脊山口",
          participants: "银月帝国、北境同盟",
          tags: ["战争", "北境"],
          importance: "important"
        }),
        createTimelineNode({
          date: "星历231年",
          title: "白塔协议签署",
          summary: "大陆主要势力在白塔城签署互不侵犯与贸易协定。",
          content: "协议开启了长达一百二十年的和平时期。学术、航海和跨境贸易迅速繁荣，白塔也成为中立知识中心。",
          location: "白塔城",
          participants: "银月帝国、北境诸国、海岸联盟",
          tags: ["外交", "和平"],
          importance: "important"
        }),
        createTimelineNode({
          date: "星历492年",
          title: "帝国首都陷落",
          summary: "持续三年的围城在冬至夜结束，银月王庭宣告覆灭。",
          content: "城门并非被攻城槌击破，而是由守军从内部打开。旧纪元在沉默中结束，此后的大陆进入诸国并立时代。",
          location: "银月城",
          participants: "联军、银月近卫军、城中议会",
          tags: ["帝国终结", "纪元更替"],
          importance: "critical"
        })
      ]
    },
    footer: {
      enabled: true,
      type: "quote",
      template: "quote",
      fields: {
        quote: "帝国并非毁于最后一场战争，它早已死在所有人的沉默之中。",
        speaker: "无名史官",
        source: "《银月末日抄本》",
        date: "星历493年",
        summaryTitle: "一个纪元的余晖",
        summary: "帝国的终结并未结束阿斯特拉的历史。散落各地的旧制度、信仰与记忆，仍在塑造新的世界。",
        nextHint: "下一卷：诸王的黎明",
        watermarkLabel: "CREATED WITH TIMELINE",
        author: "星海档案馆",
        projectName: "阿斯特拉大陆纪事",
        social: "@astra_archive",
        website: "",
        copyright: "仅用于原创世界观设定展示",
        version: "v1.0",
        productionDate: new Date().toLocaleDateString("zh-CN")
      }
    },
    theme: {
      preset: "minimal",
      primaryColor: "#294940",
      secondaryColor: "#9a7658",
      backgroundColor: "#fbfaf7",
      textColor: "#343733",
      titleColor: "#16251f",
      borderColor: "#b8b6ae",
      titleFont: "serif",
      bodyFont: "serif",
      baseFontSize: 16,
      borderRadius: 0,
      showTexture: false,
      showBorder: true
    },
    canvas: {
      width: 800,
      padding: 48,
      scale: 0.75
    }
  };
}



