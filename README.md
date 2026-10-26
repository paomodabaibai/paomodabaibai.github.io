# PeanutMilk / Haoling 个人作品集

可继续改造的原生 HTML、CSS、JavaScript 框架。V2 使用全屏黑白灰界面：入口 → CRT 像素街机或常规作品集合 → 纵向 3D 卡片流作品册 → 项目详情。三种作品类别共用数据，查看作品不需要完成游戏。

在线预览：<https://paomodabaibai.github.io/>

界面铺满浏览器视口，详情和受限高度下的作品信息提供内部滚动。桌面导航栏提供浏览器全屏按钮；浏览器不支持时隐藏。作品图片保留原素材，界面和街机场景以黑白灰为主；展开的街机方块为金色，卡片内的应用图标与微缩内容保留彩色。

## 本地运行

需要 Node.js 18 或更新版本。项目无第三方运行依赖，无需先执行 `npm install`。

```powershell
npm run dev
```

打开 <http://127.0.0.1:5173>。开发服务器直接读取文件；修改后刷新浏览器即可，没有自动热更新。端口被占用时：

```powershell
$env:PORT = '5174'
npm run dev
```

```powershell
npm run check
npm run build
```

`check` 检查 JavaScript 语法，不代替浏览器交互验证。`build` 将 `index.html`、`src/`、`public/` 复制到 `dist/`，不压缩，也不清理旧构建文件。删除或改名源文件后，应同步移除对应的旧构建文件。资源使用相对路径，可直接部署到 GitHub Pages 等静态站点；Hash 路由无需服务器重写。

## 文件结构与修改入口

| 文件                                      | 职责                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `index.html`                              | 页面容器、元信息、图标与模块入口                           |
| `src/app.js`                              | Hash 路由、各页面渲染、模式切换、作品册选择、截图大图      |
| `src/content.js`                          | 姓名与介绍、三个类别、待补充槽位、内容查询函数             |
| `src/data.js`                             | CatPoker、POKOR 等实际作品的数据                           |
| `src/style.css`                           | 黑白灰主题、全屏布局、作品册排布、简短入场动效、移动端适配 |
| `src/album-flow.css`                      | 纵向 3D 卡片流、景深与移动端作品册布局                    |
| `src/arcade.js`                           | Canvas 街机、移动跳跃、碰撞展开卡片、触控与资源清理        |
| `src/arcade-cards.css`                    | 街机磨砂分类卡片、透明入口按钮与响应式尺寸                 |
| `src/crt.js`                              | WebGL CRT 后处理、曲面坐标换算与资源释放                   |
| `src/work-collections.js` / `src/work-collections.css` | 常规作品集合选择、标题布局与浮动游戏符号          |
| `src/title-particles.js`                  | 首页、集合与关于我标题的粒子聚合 / 弥散、静态回退与资源清理  |
| `src/intro-screen.js` / `src/intro-particles.js` | 首页粒子背景、单色噪点与生命周期管理                  |
| `public/assets/`                          | 本地图片等静态素材                                         |
| `scripts/serve.mjs` / `scripts/build.mjs` | 本地静态服务 / 静态输出                                    |
| `docs/DESIGN.md`                          | V2 视觉、交互与可替换边界                                  |
| `docs/sources.md`                         | Steam 资料核实、图片来源、使用范围                         |

### 增加或替换作品

在 `src/data.js` 的 `projects` 数组添加对象；补齐某个占位项目时，可直接修改 `src/content.js` 中的相应槽位，或移除槽位后把真实项目移入 `projects`。`id` 必须唯一，建议使用小写英文与连字符；类别固定为 `games`、`interfaces`、`other`，游戏子类为 `indie` 或 `commercial`。

```js
{
  id: 'my-project',
  title: '项目名称',
  subtitle: '项目类型',
  category: 'games',
  subcategory: 'indie',
  year: '2026',
  description: '一句已核实的项目事实。',
  tags: ['独立游戏', '交互'],
  status: 'published',
  releaseStatus: 'released',
  image: './public/assets/my-project/cover.jpg',
  gallery: ['./public/assets/my-project/screenshot-1.jpg'],
  steamUrl: 'https://store.steampowered.com/app/你的应用编号/',
  facts: [{ label: '我的职责', value: '真实、可公开的分工' }],
  sections: [{ title: '设计过程', body: '项目背景、过程与结果。' }],
}
```

保留 `tags`、`gallery`、`facts`、`sections` 数组，即使暂时为空。无封面时设 `image: null`，并用 `art: 'game'`、`art: 'interface'` 或 `art: 'research'` 显示图形占位。`steamUrl` 为可选项。`status: 'published'` 仅表示档案已公开，游戏是否发售由 `releaseStatus` 区分；资料未完成时用 `status: 'draft'`。论文 PDF、项目演示等外链可直接配置 `links: [{ label: "阅读论文", href: "/public/paper.pdf" }]`。图库标题使用 `galleryLabel`，素材来源使用 `sourceUrl` 和 `sourceLabel`；未配置 `links` 的游戏自动使用 `steamUrl`。

内容只保留名称、分类、标签、状态、必要事实与动作词。占位项目使用短标题，`description: ''`、`sections: []`，显示「待补充」。个人职责、联系方式和公司项目需填写真实资料，勿用素材来源推断个人分工。

当前每个类别提供六张卡片，共十八条档案。游戏类别包含 CatPoker、POKOR 两个真实项目和四个待补充槽位；界面、其它类别各六个槽位。游戏子筛选各显示三张。新增槽位集中在 `src/content.js` 的 `extraSlots`，用真实素材替换时保留其唯一 `id` 和完整数组字段即可。

### 改主题、集合、作品册和街机

- 主题：优先改 `src/style.css` 顶部 `:root` 中的背景、文字、分隔线与页边距。当前是近黑背景、细边框、灰白文字和圆角按钮；`content.js` 的分类 `tone` 统一为 `mono`。
- 常规集合：`mountWorkCollections()` 显示类别选择与粒子聚合标题，游戏集合名称按界面要求使用 `Game Desgin`。底部居中的三个圆点表示分类，两侧提供低对比箭头；右下角提供仅作用于该集合入口的「街机 / 常规」开关；支持滚轮和键盘切换。背景是低透明度的原创游戏符号，不显示单个项目封面。切换分类时先将当前标题弥散为粒子，再聚合新分类；点击「进入集合」、切换街机模式或离开页面同样等待退场后导航。`src/work-collections.css` 控制布局和符号漂浮，`src/title-particles.js` 根据实际标题字形生成粒子；减少动态效果或 Canvas 不可用时保留文字标题并直接切换。
- 作品册：`renderCollection()` 负责分类筛选、当前项目和卡片选择。卡片沿纵向 3D 弧线逐层倾斜和缩小，各位置保持可辨认的正面；选中卡片放大至原尺寸的 1.55 倍并向左上展开，相邻卡片保留原尺寸，投影间距加大 50%，远端卡片在舞台边缘淡出。`src/album-motion.js` 按透视后的投影高度计算间距并自适应卡片尺寸，以连续曲线和临界阻尼控制运动。连续输入保留速度，反向操作自然减速转向，最接近中心的作品同步更新信息与「详情」。支持点选、滚轮、方向键、上下按钮及跟手拖动，松手后吸附到完整卡片；Home / End 选择首尾作品。`src/album-flow.css` 管理 iOS 风格的圆角、柔和高光、半透明控制条和响应式排布；每类六张卡，低矮横屏采用 1.35 倍主卡并允许滚动。减少动态效果时直接切换，停稳和离页后停止动画。
- 街机：`WORLD` 定义场景尺寸，`PORTALS` 定义问号位置与类别，`update()` 定义移动、跳跃和碰撞。左右方向键或 A / D 移动，空格、上方向键或 W 跳跃，也可使用触控按钮。顶起或点击问号展开该问号上方的磨砂卡片，方块变成金色并显示对应的游戏、界面或文档标志。卡片移除大分类标志：游戏使用错位排列、独立轻浮动的彩色圆角应用图标，混合已有作品封面与无名称的装饰图案；其它类别使用彩色微缩界面和文稿构图。小尺寸半透明「进入」按钮才导航到对应作品册，键盘聚焦后可按 Enter。三个问号各自保存展开状态，三张卡片可以同时显示；只有再次顶起或点击卡片自己的方块才收起它并恢复问号，触发其它方块不影响已展开卡片，点击空白或按 Esc 也保持展开。
- CRT：像素场景先绘制到 2D Canvas，再由 `src/crt.js` 的真实 WebGL shader 处理桶形曲面、扫描线、栅格、微弱辉光、噪点和暗角。`CRT_CURVATURE` 控制曲率，当前为 `0.105`；`FRAGMENT` 内的 `scan`、`grille`、`grain`、`vignette` 和辉光权重可独立调整。点击判定与浮出卡片锚点使用相同曲率的坐标换算，修改曲率时应保留这层一致性。
- 降级：WebGL 不可用、shader 创建失败或上下文丢失时，自动切换到 2D Canvas，并用 CSS 扫描线和暗角保留显示效果。降级版本没有 WebGL 的真实曲面变形，移动、碰撞和卡片入口仍使用同一套逻辑。
- 集成接口：`mountArcade(container, { onCategory, modeMarkup })` 返回清理函数。只有卡片「进入」触发 `onCategory`；模式开关显示在街机 HUD 和常规作品集合入口的右下角。进入街机时播放约 900ms 的 CRT 开机扫描与亮线展开，离开街机时播放短暂的扫描噪点与闪烁切出，再清理帧循环、观察器、事件监听和 WebGL 资源；可据此整体替换渲染实现。新增类别需同步修改 `content.js`、`PORTALS` 和类别图形。

### 入场动画

首页主体只保留 PeanutMilk 与「开始」；顶部导航仍提供作品与关于入口。标题使用与常规集合相同的全屏粒子聚合 / 弥散，粒子可越过文字区域自然散开。标题中心约在屏高 45%，无箭头的「开始」玻璃按钮下移到约 68%（手机和矮屏自适应），保留半透明模糊、边缘高光与按压反馈。背景适配本地 React Bits 的 Particles，白色细粒子会随鼠标靠近向外扩散，并留下短暂消散的轨迹；Noise 的单色颗粒叠加细扫描线形成屏幕纹理。

首页效果由 `src/intro-screen.js` 挂载，背景粒子参数与绘制位于 `src/intro-particles.js`，标题复用 `src/title-particles.js`；`SCREEN` 控制颗粒纹理的强度、尺寸与刷新频率。点击「开始」或页头导航时，先完成约 840ms 的弥散退场，同时淡出按钮与背景，再打开目的页面；开始退场期间仍可改变模式或通过导航选择其它目标。切换首页模式本身不会重播动效。离开后释放绘制资源，后台标签页暂停，减少动态效果时保留静态标题并立即导航。React Bits 许可与来源位于 `public/third-party/`，适配不引入 React 或第三方运行依赖。

## 页面路径

| Hash 路径                                | 页面                                             |
| ---------------------------------------- | ------------------------------------------------ |
| `#/`                                     | 入口                                             |
| `#/arcade`                               | 全屏 CRT 像素街机                                |
| `#/work`                                 | 常规作品集合选择，默认展示 Game Desgin          |
| `#/work?category=games`                  | 初始选中指定集合；也支持 `interfaces`、`other`  |
| `#/collection/games`                     | 游戏纵向 3D 卡片流作品册，共六张                |
| `#/collection/games?filter=indie`        | 独立游戏；`commercial` 为商业游戏界面            |
| `#/collection/interfaces`                | 界面作品册                                       |
| `#/collection/other`                     | 其它项目作品册                                   |
| `#/collection/games?project=pokor`       | 选中指定作品；可与 `filter` 组合                 |
| `#/project/catpoker` / `#/project/pokor` | 具体项目详情；也接受其它已配置项目的 `id`        |
| `#/about`                                | 关于我：PeanutMilk                               |

首页每次加载默认选择街机模式，不读取或写入模式的本地存储。模式开关显示在街机和常规作品集合入口（`#/arcade` / `#/work`）右下角；首页、作品册、详情和关于页不显示该开关。首页点击「开始」时，街机模式进入 `#/arcade`，常规模式进入 `#/work`。从街机离开进入其它界面时，会先播放老式街机的扫描噪点切出动画。

作品册与详情是共用页面。作品册独立记录来自街机还是常规集合，返回时回到对应入口和常规分类，不受之后的模式选择影响；直接打开作品册深链时默认返回常规集合。常规列表切换到街机再返回，也保留上一次常规分类。详情返回链接保留作品与游戏子类选择。

## 当前内容边界

CatPoker、POKOR 的游戏简介与画面使用官方 Steam 商店公开资料，核实记录在 `docs/sources.md`。核实当日，CatPoker 已发售，POKOR 为商店页公开、即将推出；后续以官方实时信息为准。两个项目与 Haoling 的关联来自用户提供，具体个人分工留待补充。

商业游戏界面、独立界面设计、研究/论文目前是明确标记的结构槽位；没有虚构客户、项目成果、论文或联系方式。像素角色和场景是本项目绘制的原型素材。所有素材和数据都可替换，不依赖第三方在线接口才能显示。
