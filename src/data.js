/**
 * Portfolio content is deliberately separate from navigation and presentation.
 * `published` means this portfolio entry is public, not that the game has released.
 * Steam metadata verified on 2026-10-25. See docs/sources.md for provenance.
 */
export const projects = [
  {
    id: "catpoker",
    title: "CatPoker",
    subtitle: "猫扑克",
    category: "games",
    subcategory: "indie",
    year: "2026",
    description: "1–3 人联机卡牌游戏。",
    tags: ["独立游戏", "多人联机", "卡牌构筑", "Roguelike"],
    image: "./public/assets/games/catpoker/cover.jpg",
    gallery: [
      "./public/assets/games/catpoker/screenshot-1.jpg",
      "./public/assets/games/catpoker/screenshot-2.jpg",
      "./public/assets/games/catpoker/screenshot-3.jpg",
      "./public/assets/games/catpoker/screenshot-4.jpg",
    ],
    steamUrl: "https://store.steampowered.com/app/5005680/CatPoker/?l=schinese",
    facts: [
      { label: "类型", value: "联机卡牌 / 策略 / 轻度 Rogue" },
      { label: "平台", value: "Windows · Steam" },
      { label: "发行日期", value: "2026.10.07" },
      { label: "开发 / 发行", value: "HotpotGames" },
      { label: "我的职责", value: "待补充" },
    ],
    sections: [
      {
        title: "玩法",
        body: "以斗地主为核心，加入道具与卡牌构筑。支持 1–3 人游玩、线上与局域网对战。",
      },
    ],
    status: "published",
    releaseStatus: "released",
    sourceLabel: "Steam 官方商店",
  },
  {
    id: "pokor",
    title: "POKOR",
    subtitle: "卡牌战棋 RPG",
    category: "games",
    subcategory: "indie",
    year: "2026",
    description: "卡牌构筑与回合制战棋 RPG。",
    tags: ["独立游戏", "战棋 RPG", "卡牌策略", "多分支叙事"],
    image: "./public/assets/games/pokor/cover.jpg",
    gallery: [
      "./public/assets/games/pokor/screenshot-1.jpg",
      "./public/assets/games/pokor/screenshot-2.jpg",
      "./public/assets/games/pokor/screenshot-3.jpg",
      "./public/assets/games/pokor/screenshot-4.jpg",
    ],
    steamUrl: "https://store.steampowered.com/app/4386160/POKOR/?l=schinese",
    facts: [
      { label: "类型", value: "剧情 / 卡牌构筑 / 回合制战棋" },
      { label: "平台", value: "Windows · Steam" },
      { label: "状态", value: "即将推出" },
      { label: "发行", value: "WELLA · 黑坏一" },
      { label: "我的职责", value: "待补充" },
    ],
    sections: [
      {
        title: "玩法",
        body: "组建扑克牌兵队伍，进行回合制战棋战斗。剧情选择导向不同结局。",
      },
    ],
    status: "published",
    releaseStatus: "coming-soon",
    sourceLabel: "Steam 官方商店",
  },
];

export default projects;
