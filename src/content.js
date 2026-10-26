import { projects } from "./data.js";

export const profile = {
  name: "Haoling",
  alias: "PeanutMilk",
  description: "游戏 / 界面 / 研究",
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

// These are visible content slots, not claims of finished work.
const contentSlots = [
  {
    id: "commercial-ui",
    title: "游戏界面",
    subtitle: "Commercial game UI",
    category: "games",
    subcategory: "commercial",
    year: "",
    description: "",
    tags: ["商业游戏", "UI / UX"],
    status: "draft",
    art: "interface",
    image: null,
    gallery: [],
    facts: [
      { label: "项目类型", value: "商业游戏界面" },
      { label: "展示状态", value: "待补充" },
      { label: "负责范围", value: "待补充" },
    ],
    sections: [],
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

// Six cards per collection for the initial layout. New slots are explicitly
// unfinished entries; replace their fields as real project material is added.
const extraSlots = [
  ...Array.from({ length: 3 }, (_, index) => ({
    id: `game-work-${index + 4}`,
    title: `游戏作品 ${String(index + 4).padStart(2, "0")}`,
    category: "games",
    subcategory: index === 0 ? "indie" : "commercial",
    art: "game",
    tags: [index === 0 ? "独立游戏" : "商业游戏", "游戏设计"],
  })),
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
