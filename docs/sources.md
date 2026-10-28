# 作品资料与素材来源

核实日期：2026-10-25（Asia/Shanghai）。本文件记录框架演示采用的公开资料，不代表个人职责证明。

用户提供的作品关联：Haoling / PeanutMilk 表示 CatPoker 与 POKOR 是自己的作品。个人具体职位、负责模块、制作时间、团队分工与复盘尚未提供，因此界面中保留「待补充具体分工」，不根据商店开发者名单猜测对应身份。

## CatPoker / 猫扑克

- Steam App ID：5005680。
- [官方中文商店](https://store.steampowered.com/app/5005680/CatPoker/?l=schinese)
- [Steam 商店公开元数据](https://store.steampowered.com/api/appdetails?appids=5005680&l=schinese)
- 当前标题：猫扑克CatPoker。
- 开发、发行：HotpotGames。
- 已发行：2026 年 10 月 7 日。
- 内容摘要：1–3 人联机的肉鸽斗地主，包含卡牌构筑、道具、不同猫咪角色；商店列出线上与局域网 PvP。
- 项目使用的中文文案为上述商店内容的简短概述，未复制长篇营销文本。

本地素材：

| 文件                                            | 用途                | 来源字段                       |
| ----------------------------------------------- | ------------------- | ------------------------------ |
| `public/assets/games/catpoker/cover.jpg`        | 商店横幅 / 集合卡片 | API `header_image`             |
| `public/assets/games/catpoker/screenshot-1.jpg` | 详情图集            | API `screenshots[0].path_full` |
| `public/assets/games/catpoker/screenshot-2.jpg` | 详情图集            | API `screenshots[1].path_full` |
| `public/assets/games/catpoker/screenshot-3.jpg` | 详情图集            | API `screenshots[2].path_full` |
| `public/assets/games/catpoker/screenshot-4.jpg` | 详情图集            | API `screenshots[3].path_full` |

## POKOR

- Steam App ID：4386160。
- [官方中文商店](https://store.steampowered.com/app/4386160/POKOR/?l=schinese)
- [官方英文商店](https://store.steampowered.com/app/4386160/POKOR/)
- [Steam 商店公开元数据](https://store.steampowered.com/api/appdetails?appids=4386160&l=schinese)
- 当前标题：POKOR。
- 开发者列表：WELLA、Halero、黑坏1、江凡、Leion、三文、随心、雪簌、乂乂、逸雯、柚柚、转生人。
- 发行：WELLA、黑坏一。
- 发行状态：**即将推出**。核实时 API `release_date.coming_soon` 为 `true`，`date` 为「即将推出」。搜索引擎旧缓存曾显示 Q2 2026 / Q4 2026，故网站没有采用缓存日期，也没有把商店页公开等同于已发售。
- 内容摘要：剧情丰富的卡牌肉鸽战棋回合制 RPG；扮演 Heart，指挥扑克牌兵，探索不断变化的苍白宫殿；包含多分支结局。

本地素材：

| 文件                                         | 用途                | 来源字段                       |
| -------------------------------------------- | ------------------- | ------------------------------ |
| `public/assets/games/pokor/cover.jpg`        | 商店横幅 / 集合卡片 | API `header_image`             |
| `public/assets/games/pokor/screenshot-1.jpg` | 详情图集            | API `screenshots[0].path_full` |
| `public/assets/games/pokor/screenshot-2.jpg` | 详情图集            | API `screenshots[1].path_full` |
| `public/assets/games/pokor/screenshot-3.jpg` | 详情图集            | API `screenshots[2].path_full` |
| `public/assets/games/pokor/screenshot-4.jpg` | 详情图集            | API `screenshots[3].path_full` |

## 数据与更新约定

### 2026-10-27 用户提供的 POKER 设计稿

用户明确指定 `codex-clipboard-b91712d8-1535-4ffd-afaf-9ca1401f62ec.png` 为 POKOR 详情设计参考。原图尺寸为 3550 × 12234，包含原生透明通道。本地 `public/assets/games/pokor/portfolio/` 中的主界面、地图、角色整排、装饰框、四个章节标题与十六个图标均从该图提取，保留原画和透明度，没有生成新的角色或游戏素材。原稿中的 POKER 字样保留在素材中，项目名称与路由仍为 POKOR / pokor。每张图的原始裁剪范围与输出尺寸记录在同目录 `assets.json`。

导航参考为用户提供的 `codex-clipboard-f2c11fa2-71c7-4452-9d4b-cf02316fc423.png`。没有提供个人头像原图，圆形头像位置沿用网站 PM 标识。PDF 下载目前仅提供按钮及即将开放提示，后端鉴权与单次 key 尚未接入。

- 内容入口：`src/data.js`，`projects` 数组。
- `status: 'published'` 表示作品档案对外可见；游戏发行状态单独使用 `releaseStatus`，两者不要混用。
- 游戏角色与场景画面均来自相应作品的 Steam 官方商店素材。版权归原权利人所有，作品集依据用户提供的关联用于展示。
- 临时下载和核实原始 JSON 存放在 `E:\CodexData\Downloads\peanutmilk-portfolio`，没有放入 C: 临时目录。
- 阴阳师、第五人格、哈利波特：魔法觉醒的参与关联来自用户提供；其截图目录中的 SVG 仅为待替换占位，不代表实际游戏画面。独立界面作品、论文与联系方式仍未补充。

## 商业项目卡片封面（2026-10-28）

瀑布流卡片使用三款游戏官方站点公开的代表性宣传图，下载后保存在各自项目目录：

- 阴阳师：`public/assets/games/yys/cover.jpg`，来源：`https://www.onmyojigame.com/pc/gw/20171128191002/data/share49.jpg`
- 第五人格：`public/assets/games/d5/cover.jpg`，来源：`https://www.identityvgame.com/pc/gw/20210609113612/data/share.jpg`
- 哈利波特：魔法觉醒：`public/assets/games/harry-potter-magic-awakening/cover.png`，来源：`https://www.harrypottermagicawakened.com/m/gw/20201020115215/img/pic1_e3d649c.png`

这些素材仍受各自版权保护，仅用于个人作品集中的项目识别；上线前应确认展示范围与授权要求。

## 素材原始链接

- [catpoker/cover.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5005680/c91e08a40676f1ca2ffa6fc5f08abb123bb696d0/header.jpg?t=1792861763)
- [catpoker/screenshot-1.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5005680/8955bac586b800b906034fff6a42a7160e50df41/ss_8955bac586b800b906034fff6a42a7160e50df41.1920x1080.jpg?t=1792861763)
- [catpoker/screenshot-2.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5005680/bf096843653b2e4353775ab0050cce4b8a5cc6cb/ss_bf096843653b2e4353775ab0050cce4b8a5cc6cb.1920x1080.jpg?t=1792861763)
- [catpoker/screenshot-3.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5005680/12f65524d943c59e5b645753d232562ce887da2a/ss_12f65524d943c59e5b645753d232562ce887da2a.1920x1080.jpg?t=1792861763)
- [catpoker/screenshot-4.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5005680/ff56e3de0681485d97e58e6a22d3168282decf93/ss_ff56e3de0681485d97e58e6a22d3168282decf93.1920x1080.jpg?t=1792861763)
- [pokor/cover.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4386160/d7ee063e266391d3f4e723d52a0d1eadf2e82695/header.jpg?t=1789781639)
- [pokor/screenshot-1.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4386160/f9dca7c04a3fe98628ccf339dd2204071aa693d3/ss_f9dca7c04a3fe98628ccf339dd2204071aa693d3.1920x1080.jpg?t=1789781639)
- [pokor/screenshot-2.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4386160/fd4256483c247324e51b1c2a33885ecc65db7e2a/ss_fd4256483c247324e51b1c2a33885ecc65db7e2a.1920x1080.jpg?t=1789781639)
- [pokor/screenshot-3.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4386160/ecee981fd8ce0762963bd2a64a963f6dadad56b5/ss_ecee981fd8ce0762963bd2a64a963f6dadad56b5.1920x1080.jpg?t=1789781639)
- [pokor/screenshot-4.jpg](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4386160/2fa6ecd149e5cb920a1a0174f0b0c72aadb422aa/ss_2fa6ecd149e5cb920a1a0174f0b0c72aadb422aa.1920x1080.jpg?t=1789781639)
