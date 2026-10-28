import { projects } from "./data.js";

export const profile = {
  name: "Haoling",
  alias: "PeanutMilk",
  title: "关于我",
  description: "我专注于游戏、界面与交互研究，也会把正在玩的东西记录在这里。",
  email: "待补充",
  games: ["待补充"],
  steamFriendCode: "待补充",
};

export const categories = [
  {
    id: "games",
    name: "游戏",
    en: "Games",
    description: "",
    code: "PLAY",
    tone: "mono",
  },
  {
    id: "interfaces",
    name: "界面",
    en: "Interfaces",
    description: "",
    code: "FORM",
    tone: "mono",
  },
  {
    id: "other",
    name: "其它项目",
    en: "Other",
    description: "",
    code: "IDEA",
    tone: "mono",
  },
];

// Commercial projects are real portfolio records. Their image files are
// deliberately lightweight placeholders until the original screenshots are
// uploaded to the per-requirement folders listed on each detail page.
const contentSlots = [
  {
    id: "yys",
    title: "阴阳师",
    subtitle: "新手手册 / 超鬼王版本活动 / 功能优化",
    category: "games",
    subcategory: "commercial",
    year: "商业项目",
    description: "参与多个版本与功能界面的制作，围绕新手引导、活动信息层级与功能可用性整理界面体验。",
    previewDescription: "三个需求，记录版本活动与功能体验的界面整理。",
    previewTags: ["界面优化", "版本活动", "功能体验"],
    tags: ["商业游戏", "界面设计", "交互优化", "活动设计"],
    status: "published",
    statusLabel: "参与制作",
    image: "./public/assets/games/yys/cover.jpg",
    imageFit: "cover",
    facts: [
      { label: "项目类型", value: "移动端商业游戏" },
      { label: "参与范围", value: "新手引导、版本活动、功能优化" },
      { label: "我的职责", value: "参与相关页面制作" },
      { label: "资料状态", value: "截图待替换" },
      { label: "截图总目录", value: "public/assets/games/yys/" },
    ],
    sections: [
      {
        title: "工作范围",
        body: "参与新手手册、超鬼王版本活动界面与功能优化等需求，重点整理信息层级、操作路径和活动内容的可读性。",
      },
    ],
    requirements: [
      {
        id: "rookie-guide",
        title: "新手手册优化",
        summary: "梳理新手阶段的内容入口与阅读顺序，预留优化前后对比和关键流程截图。",
        uploadPath: "public/assets/games/yys/rookie-guide/",
        screenshots: Array.from({ length: 6 }, (_, index) => ({
          src: `./public/assets/games/yys/rookie-guide/screenshot-${String(index + 1).padStart(2, "0")}.svg`,
          label: `新手手册优化 · 截图 ${index + 1}`,
        })),
      },
      {
        id: "super-oni-king",
        title: "超鬼王版本活动界面",
        summary: "记录版本活动的主入口、玩法信息和奖励相关页面，方便补齐完整的实机流程。",
        uploadPath: "public/assets/games/yys/super-oni-king/",
        screenshots: Array.from({ length: 6 }, (_, index) => ({
          src: `./public/assets/games/yys/super-oni-king/screenshot-${String(index + 1).padStart(2, "0")}.svg`,
          label: `超鬼王版本活动界面 · 截图 ${index + 1}`,
        })),
      },
      {
        id: "feature-optimization",
        title: "功能优化",
        summary: "保留功能入口、状态反馈与操作结果的画面位置，用于补充优化过程中的实机截图。",
        uploadPath: "public/assets/games/yys/feature-optimization/",
        screenshots: Array.from({ length: 6 }, (_, index) => ({
          src: `./public/assets/games/yys/feature-optimization/screenshot-${String(index + 1).padStart(2, "0")}.svg`,
          label: `功能优化 · 截图 ${index + 1}`,
        })),
      },
    ],
  },
  {
    id: "d5",
    title: "第五人格",
    subtitle: "表情包分类",
    category: "games",
    subcategory: "commercial",
    year: "商业项目",
    description: "参与表情包分类需求的界面制作，整理表情内容的浏览、筛选与使用路径。",
    previewDescription: "表情包分类界面的内容组织与交互整理。",
    previewTags: ["表情包", "分类", "内容浏览"],
    tags: ["商业游戏", "界面设计", "内容分类", "交互设计"],
    status: "published",
    statusLabel: "参与制作",
    image: "./public/assets/games/d5/cover.jpg",
    imageFit: "cover",
    facts: [
      { label: "项目类型", value: "移动端商业游戏" },
      { label: "参与范围", value: "表情包分类界面" },
      { label: "我的职责", value: "参与相关页面制作" },
      { label: "资料状态", value: "截图待替换" },
      { label: "截图总目录", value: "public/assets/games/d5/" },
    ],
    sections: [
      {
        title: "工作范围",
        body: "参与表情包分类需求，整理分类入口、内容浏览和使用反馈的界面状态。",
      },
    ],
    requirements: [
      {
        id: "sticker-category",
        title: "表情包分类",
        summary: "预留分类入口、列表状态、筛选反馈与使用流程的多张实机截图。",
        uploadPath: "public/assets/games/d5/sticker-category/",
        screenshots: Array.from({ length: 6 }, (_, index) => ({
          src: `./public/assets/games/d5/sticker-category/screenshot-${String(index + 1).padStart(2, "0")}.svg`,
          label: `表情包分类 · 截图 ${index + 1}`,
        })),
      },
    ],
  },
  {
    id: "harry-potter-magic-awakening",
    title: "哈利波特：魔法觉醒",
    subtitle: "字在必得活动界面",
    category: "games",
    subcategory: "commercial",
    year: "商业项目",
    description: "参与“字在必得”活动界面的制作，围绕活动入口、收集进度与奖励反馈整理信息展示。",
    previewDescription: "活动界面中的文字收集与进度反馈。",
    previewTags: ["活动界面", "收集进度", "奖励反馈"],
    tags: ["商业游戏", "活动设计", "信息层级", "界面设计"],
    status: "published",
    statusLabel: "参与制作",
    image: "./public/assets/games/harry-potter-magic-awakening/cover.png",
    imageFit: "cover",
    facts: [
      { label: "项目类型", value: "移动端商业游戏" },
      { label: "参与范围", value: "字在必得活动界面" },
      { label: "我的职责", value: "参与相关页面制作" },
      { label: "资料状态", value: "截图待替换" },
      { label: "截图总目录", value: "public/assets/games/harry-potter-magic-awakening/" },
    ],
    sections: [
      {
        title: "工作范围",
        body: "参与“字在必得”活动界面的制作，整理活动目标、收集进度、奖励状态与关键反馈。",
      },
    ],
    requirements: [
      {
        id: "word-collection",
        title: "字在必得活动界面",
        summary: "预留活动首页、收集进度、任务反馈和奖励状态的多张实机截图。",
        uploadPath: "public/assets/games/harry-potter-magic-awakening/word-collection/",
        screenshots: Array.from({ length: 6 }, (_, index) => ({
          src: `./public/assets/games/harry-potter-magic-awakening/word-collection/screenshot-${String(index + 1).padStart(2, "0")}.svg`,
          label: `字在必得活动界面 · 截图 ${index + 1}`,
        })),
      },
    ],
  },
  {
    id: "interface-archive",
    title: "界面设计",
    subtitle: "Interface design",
    category: "interfaces",
    year: "",
    description: "",
    tags: ["界面设计", "交互设计"],
    status: "draft",
    art: "interface",
    image: null,
    gallery: [],
    facts: [
      { label: "项目类型", value: "UI / UX" },
      { label: "展示状态", value: "待补充" },
    ],
    sections: [],
  },
  {
    id: "research-archive",
    title: "研究",
    subtitle: "Research",
    category: "other",
    year: "",
    description: "",
    tags: ["研究", "论文"],
    status: "draft",
    art: "research",
    image: null,
    gallery: [],
    facts: [
      { label: "项目类型", value: "研究 / 其它项目" },
      { label: "展示状态", value: "待补充" },
    ],
    sections: [],
  },
];

// Six cards per collection for the initial layout. The one remaining game slot
// keeps the all-games ribbon balanced while commercial filtering stays focused
// on the three named projects above.
const extraSlots = [
  {
    id: "game-work-06",
    title: "游戏作品 06",
    category: "games",
    subcategory: "indie",
    art: "game",
    tags: ["独立游戏", "游戏设计"],
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `interface-work-${index + 2}`,
    title: `界面作品 ${String(index + 2).padStart(2, "0")}`,
    category: "interfaces",
    art: "interface",
    tags: ["界面设计", "交互设计"],
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `other-work-${index + 2}`,
    title: `其它作品 ${String(index + 2).padStart(2, "0")}`,
    category: "other",
    art: "research",
    tags: ["研究", "其它项目"],
  })),
].map((slot) => ({
  ...slot,
  subtitle: "",
  year: "",
  description: "",
  status: "draft",
  image: null,
  gallery: [],
  facts: [{ label: "展示状态", value: "待补充" }],
  sections: [],
}));

export const allProjects = [...projects, ...contentSlots, ...extraSlots];
export const getProject = (id) =>
  allProjects.find((project) => project.id === id);
export const getCategory = (id) =>
  categories.find((category) => category.id === id);
export const getProjects = (category, filter = "all") =>
  allProjects.filter(
    (project) =>
      project.category === category &&
      (filter === "all" || project.subcategory === filter),
  );
