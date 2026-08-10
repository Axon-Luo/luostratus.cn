import {
  createDefaultProject,
  createHeaderCharacter,
  createId,
  createTimelineNode
} from "./defaults.js";
import { THEME_PRESETS } from "./themes.js";

function node(date, title, summary, details = {}) {
  return createTimelineNode({
    date,
    title,
    summary,
    content: details.content || "",
    location: details.location || "",
    participants: details.participants || "",
    tags: details.tags || [],
    importance: details.importance || "normal"
  });
}

function buildHistoricalProject(config) {
  const project = createDefaultProject();
  const now = new Date().toISOString();
  const fields = project.header.fields;
  const footerFields = project.footer.fields;

  project.id = createId();
  project.name = config.name || config.label;
  project.createdAt = now;
  project.updatedAt = now;

  project.header = {
    ...project.header,
    enabled: true,
    type: config.header.type,
    template: config.header.template,
    portraitShape: config.header.portraitShape || "square",
    overlayEnabled: config.header.overlayEnabled ?? true,
    overlayColor: config.header.overlayColor || "black",
    characterCount: config.header.characters?.length || 1,
    relationship: config.header.relationship || "",
    characters: (config.header.characters || [{}]).map((character) => createHeaderCharacter(character)),
    fields: {
      ...Object.fromEntries(Object.keys(fields).map((key) => [key, ""])),
      ...config.header.fields
    },
    avatar: "",
    emblem: "",
    mainImage: "",
    backgroundImage: ""
  };

  project.timeline = {
    template: config.timeline.template,
    cardTemplate: config.timeline.cardTemplate,
    nodes: config.timeline.nodes
  };

  project.footer = {
    enabled: true,
    type: config.footer.type,
    template: config.footer.template,
    fields: {
      ...Object.fromEntries(Object.keys(footerFields).map((key) => [key, ""])),
      watermarkLabel: "CREATED WITH TIMELINE",
      projectName: config.name || config.label,
      version: "历史示例",
      productionDate: new Date().toLocaleDateString("zh-CN"),
      ...config.footer.fields
    }
  };

  project.theme = {
    ...project.theme,
    ...THEME_PRESETS[config.theme],
    preset: config.theme
  };

  return project;
}

const PRESET_CONFIGS = {
  curie: {
    label: "居里夫人生平",
    description: "从华沙求学到两度获得诺贝尔奖",
    theme: "minimal",
    tags: ["居中头图", "左侧时间轴", "极简卡片", "引用尾图"],
    header: {
      type: "person",
      template: "centered",
      portraitShape: "round",
      characters: [{
        name: "玛丽·居里",
        foreignName: "MARIE CURIE",
        alias: "玛丽亚·斯克沃多夫斯卡",
        birthDate: "1867年11月7日",
        deathDate: "1934年7月4日",
        identity: "物理学家、化学家",
        faction: "巴黎大学、居里研究所",
        biography: "放射性研究的先驱，首位获得诺贝尔奖的女性，也是首位在两个不同科学领域获得诺贝尔奖的人。",
        quote: "生活中没有什么可怕的东西，只有需要理解的东西。"
      }],
      fields: {
        title: "玛丽·居里",
        foreignTitle: "MARIE CURIE",
        subtitle: "科学、勇气与放射性研究",
        calendarName: "公历",
        dateRange: "1867—1934",
        description: "一位科学家如何跨越时代限制，以实验与坚持改变现代物理学和化学。"
      }
    },
    timeline: {
      template: "left",
      cardTemplate: "minimal",
      nodes: [
        node("1867年", "出生于华沙", "玛丽亚·斯克沃多夫斯卡出生在当时由俄国统治的华沙。", {
          location: "华沙", tags: ["出生", "波兰"]
        }),
        node("1891年", "赴巴黎求学", "进入巴黎大学学习物理与数学。", {
          location: "巴黎", participants: "玛丽·居里", tags: ["求学"]
        }),
        node("1898年", "发现钋与镭", "与皮埃尔·居里共同宣布发现钋和镭。", {
          location: "巴黎", participants: "玛丽·居里、皮埃尔·居里", tags: ["发现", "放射性"], importance: "critical"
        }),
        node("1903年", "获得诺贝尔物理学奖", "与皮埃尔·居里、亨利·贝可勒尔共享该奖。", {
          tags: ["诺贝尔奖", "物理学"], importance: "important"
        }),
        node("1911年", "获得诺贝尔化学奖", "因发现镭和钋并分离镭而获奖。", {
          tags: ["诺贝尔奖", "化学"], importance: "critical"
        })
      ]
    },
    footer: {
      type: "quote",
      template: "quote",
      fields: {
        quote: "我们必须相信，我们在某件事情上有天赋，并且这件事情必须达成。",
        speaker: "玛丽·居里",
        source: "生平语录",
        date: "20世纪"
      }
    }
  },
  french_revolution: {
    label: "法国大革命档案",
    description: "从三级会议到雾月政变的政治剧变",
    theme: "archive",
    tags: ["档案头图", "档案时间轴", "档案卡片", "档案尾图"],
    header: {
      type: "event",
      template: "archive",
      fields: {
        title: "法国大革命",
        foreignTitle: "FRENCH REVOLUTION",
        subtitle: "自由、制度与权力的重组",
        calendarName: "公历",
        dateRange: "1789—1799",
        description: "十年间，法国从君主制危机走向共和国、恐怖统治与督政府，最终进入拿破仑时代。",
        eventName: "法国大革命",
        eventCode: "FR-1789",
        startDate: "1789年5月",
        endDate: "1799年11月",
        location: "法国",
        participants: "三级会议、国民议会、王室、巴黎民众",
        eventDescription: "围绕财政危机、政治代表权和社会等级展开的革命进程。",
        result: "旧制度瓦解，法国政治与欧洲秩序被重新塑造。"
      }
    },
    timeline: {
      template: "archive",
      cardTemplate: "archive",
      nodes: [
        node("1789年5月", "三级会议召开", "路易十六召集三级会议以应对财政危机。", {
          location: "凡尔赛", participants: "三级会议、路易十六", tags: ["政治", "财政"]
        }),
        node("1789年7月14日", "攻占巴士底狱", "巴黎民众攻占巴士底狱，成为革命的象征性时刻。", {
          location: "巴黎", tags: ["巴士底狱", "起义"], importance: "critical"
        }),
        node("1789年8月", "《人权宣言》通过", "国民制宪议会通过《人权和公民权宣言》。", {
          location: "巴黎", participants: "国民制宪议会", tags: ["人权", "宣言"], importance: "important"
        }),
        node("1792年9月", "共和国建立", "国民公会废除君主制，法兰西第一共和国成立。", {
          tags: ["共和国", "制度"], importance: "critical"
        }),
        node("1799年11月", "雾月政变", "拿破仑·波拿巴发动政变，督政府时期结束。", {
          participants: "拿破仑·波拿巴", tags: ["政变", "终结"], importance: "critical"
        })
      ]
    },
    footer: {
      type: "summary",
      template: "archive",
      fields: {
        summaryTitle: "旧制度的终结",
        summary: "革命留下的法律、政治和社会遗产持续影响此后的法国与欧洲。",
        nextHint: "下一档案：拿破仑时代"
      }
    }
  },
  copernicus: {
    label: "哥白尼宇宙观",
    description: "太阳中心体系与近代宇宙观的形成",
    theme: "celestial",
    tags: ["居中头图", "棋盘格时间轴", "极简卡片", "引用尾图"],
    header: {
      type: "world",
      template: "centered",
      portraitShape: "round",
      fields: {
        title: "哥白尼宇宙观",
        foreignTitle: "COPERNICAN REVOLUTION",
        subtitle: "重新安排天空的秩序",
        calendarName: "公历",
        dateRange: "1473—1543",
        description: "从学习数学与天文学，到手稿传播和著作出版，一种新的宇宙模型逐步成形。"
      }
    },
    timeline: {
      template: "checkerboard",
      cardTemplate: "minimal",
      nodes: [
        node("1473年", "出生于托伦", "哥白尼出生在维斯瓦河畔的托伦。", {
          location: "托伦", tags: ["出生"]
        }),
        node("1491年", "进入克拉科夫大学", "学习数学与天文学，为后来的研究打下基础。", {
          location: "克拉科夫", tags: ["求学", "天文学"]
        }),
        node("约1514年", "《短论》流传", "以手稿形式概述日心体系的基本设想。", {
          tags: ["短论", "日心说"], importance: "important"
        }),
        node("1543年", "《天体运行论》出版", "系统阐述日心宇宙模型，成为科学史的重要著作。", {
          location: "纽伦堡", tags: ["出版", "天体运行论"], importance: "critical"
        })
      ]
    },
    footer: {
      type: "quote",
      template: "quote",
      fields: {
        quote: "在万物中央，太阳安居其位。",
        speaker: "尼古拉·哥白尼",
        source: "《天体运行论》",
        date: "1543年"
      }
    }
  }
};

const DEFAULT_EXAMPLE_KEY_BY_TYPE = {
  person: "curie",
  event: "french_revolution",
  world: "copernicus"
};

export const DEFAULT_EXAMPLES = Object.fromEntries(
  Object.entries(DEFAULT_EXAMPLE_KEY_BY_TYPE).map(([type, key]) => [type, {
    label: PRESET_CONFIGS[key].label,
    description: PRESET_CONFIGS[key].description
  }])
);

export function createDefaultExample(type) {
  const key = DEFAULT_EXAMPLE_KEY_BY_TYPE[type];
  const config = PRESET_CONFIGS[key];
  if (!config) throw new Error("找不到这个内容类型的默认示例。");
  return buildHistoricalProject(config);
}

export function createBlankProject() {
  const blank = createDefaultProject();
  const now = new Date().toISOString();
  blank.id = createId();
  blank.name = "未命名时间轴";
  blank.createdAt = now;
  blank.updatedAt = now;
  blank.timeline.nodes = [];
  blank.header.fields = Object.fromEntries(Object.keys(blank.header.fields).map((key) => [key, ""]));
  blank.header.fields.title = "未命名时间轴";
  blank.header.fields.foreignTitle = "UNTITLED CHRONICLE";
  blank.header.characters = [createHeaderCharacter()];
  blank.header.characterCount = 1;
  blank.header.relationship = "";
  blank.header.avatar = "";
  blank.header.emblem = "";
  blank.header.mainImage = "";
  blank.header.backgroundImage = "";
  blank.footer.fields = Object.fromEntries(Object.keys(blank.footer.fields).map((key) => [key, ""]));
  blank.footer.enabled = false;
  return blank;
}


