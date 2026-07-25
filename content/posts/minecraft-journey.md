---
date: '2026-07-25T10:43:22+08:00'
draft: false
title: 我的 Minecraft 旅程：20 个版本的方块世界
tags:
  - Minecraft
  - 游戏
  - 模组
description: 盘点我目前在玩的 20 个 Minecraft 版本与整合包，深入介绍各版本安装的独特模组，记录我的方块世界探索轨迹。
---

## 前言

Minecraft 是我玩得最久的游戏之一。从原版生存到重度魔改整合包，PCL 启动器的每个版本文件夹都代表一段独特的方块旅程。

截至 2026 年 7 月，我的 PCL 启动器中已安装 **20 个版本**，涵盖 Fabric、Forge、NeoForge 三大模组加载器，版本跨度从 1.19.2 到最新的 26.2。下面是逐一拆解。

---

## 一、轻量优化版本

这类版本以原版体验为基础，加载少量优化和辅助模组，适合原味生存和高帧率游戏。

### 1.19.2-Fabric 0.19.3

```
mods 数量：7
核心模组：Sodium + Iris + Fabric API
```

| 模组 | 功能 |
|------|------|
| **Sodium** 0.4.4 | 开源渲染优化引擎，帧率提升可达 3-5 倍 |
| **Iris** 1.6.11 | Sodium 配套光影加载器，支持 OptiFine 格式光影 |
| **Fabric API** 0.77.0 | Fabric 模组生态的基础依赖 |
| **Xaero's World Map** 1.43.0 | 全尺寸世界地图，记录探索过的每一块区域 |
| **Xaero's Minimap** 26.3.0 | 屏幕角落小地图，支持实体雷达和路径点 |
| **Yes Steve Model** 2.4.1 | 玩家模型替换，支持自定义 3D 皮肤 |
| **Mouse Tweaks** 2.22 | 鼠标手势批量操作（快速转移物品等） |

这是最"纯净"的一个优化版本，仅 7 个模组，主打原版体验 + Iris 光影。

### 1.20.1-Forge_47.4.10（主力生存档）

```
mods 数量：12
核心模组：Embeddium + Oculus + Distant Horizons
```

这是存放主世界 **`GNLXC_main_v1.0.1`** 存档的版本，也是目前最活跃的版本。

| 模组 | 功能 |
|------|------|
| **Embeddium** 0.3.31 | Forge 版 Sodium，性能优化核心 |
| **Oculus** 1.8.0 | Forge 版 Iris，光影支持 |
| **Distant Horizons** 3.1.2 | 无限视野 LOD 渲染，能看几十公里外的地形 |
| **龙之崛起：重铸** 1.4.1 | 龙主题内容扩展，驯龙、骑龙、龙装备 |
| **卓越前线** 0.8.9 | 现代军事装备模组，添加枪械、载具、战术装备 |
| **Yes Steve Model** 2.6.5 | 玩家模型自定义 |
| **AppleSkin** 2.5.1 | 食物饱食度和饱和度信息增强 |
| **Curios** 5.14.1 | 饰品/装备槽位系统，很多模组的依赖项 |
| **GeckoLib** 4.8.4 | 实体动画引擎，模组前置 |
| **Kotlin for Forge** 4.12.0 | Kotlin 语言运行环境 |

12 个模组的精选组合：性能（Embeddium + Oculus + DH）、内容（龙之崛起 + 卓越前线）、实用（小地图 + 苹果皮）。这是一个"万能存档"——既能生存建造，又能军事作战。

### 1.20.1-Forge_47.4.20

```
mods 数量：2
```

1.20.1 Forge 的更新版本，仅有 2 个基础模组，用于测试新版 Forge 的兼容性。1.20.1 是目前 Forge 模组生态最成熟的版本之一。

### 1.21.7-Fabric 0.19.3

```
mods 数量：7
```

与 1.21.11-Fabric 类似的轻量优化配置，使用稍早的 1.21.7 版本。

### 1.21.11-Fabric 0.19.3

```
mods 数量：7
核心模组：Sodium + Iris + Replay Mod
```

| 模组 | 功能 |
|------|------|
| **Sodium** 0.8.12 | 渲染优化 |
| **Iris** 1.10.7 | 光影 |
| **Replay Mod** 2.6.26 | 录像回放，可导出为视频或自由摄像机回放 |
| **JEI** 27.4.0 | 物品管理器，查看合成配方 |
| **Xaero's Minimap** 26.1.4 | 小地图 |
| **AppleSkin** 3.0.8 | 食物信息 |

Replay Mod 的加入说明这个版本可能用于录制视频内容——自由视角回放是 MC 视频创作者的核心工具。

### 26.2-Fabric 0.19.3（建筑/生电）

```
mods 数量：8
核心模组：Litematica + Sodium
```

| 模组 | 功能 |
|------|------|
| **Litematica** 0.28.2 | 建筑投影（Schematica 精神续作），显示蓝图辅助建造 |
| **MaLiLib** 0.29.2 | Litematica 的前置库 |
| **Sodium** 0.9.0 | 渲染优化（已更新到 26.2 版本） |
| **Iris** 1.11.1 | 光影 |
| **JEI** 30.4.0 | 物品管理器 |
| **Xaero's Minimap** 26.1.3 | 小地图 |
| **AppleSkin** 3.0.10 | 食物信息 |

Litematica 的加入说明了建筑/生电方向的玩法。它可以加载 Schematic 文件并在世界中显示半透明蓝图，逐层建造时非常实用——是大型建筑和红石机器的标配工具。

### 26.2-Forge_65.0.1

```
mods 数量：2
核心模组：JourneyMap + MouseTweaks
```

极简的 Forge 最新版测试环境，只装了 JourneyMap（旅行地图）和 MouseTweaks。Forge 65 是面向 MC 1.21.2+ 的全新加载器版本，性能大幅改进。

---

## 二、重度整合包

### 机械动力 1.21.1-NeoForge（37 个模组）

```
加载器：NeoForge 21.1.235
核心：Create 6.0.10 + 16 个附属模组
```

**这是我目前最完整的 Create 整合**，以机械动力 6.0.10 为核心，加载了几乎所有主流 Create 附属：

**核心模组：**

| 模组 | 功能 |
|------|------|
| **Create** 6.0.10 | 机械动力本体：齿轮、传送带、应力系统、动力火车 |
| **Create: Aeronautics** 1.3.0 | 机械动力：航空学——制造可飞行的载具 |
| **Create: Big Cannons** 5.11.7 | 大型火炮：从青铜炮到钢制榴弹炮 |
| **Create: Connected** 1.3.2 | 创意传动：传送带网络优化与扩展 |
| **Create: New Age** 1.2.0 | 电气时代：发电机、电力传输与现代工业 |
| **Create: Copycats+** 3.0.4 | 伪装方块：让机械融入建筑 |
| **Create: Interiors** 0.6.1 | 内饰：家具与室内装饰 |
| **Create: Enchantment Industry** 2.4.2 | 附魔工业：自动化附魔与经验处理 |
| **Create: Central Kitchen** 2.5.0 | 中央厨房：配合农夫乐事的自动化烹饪 |
| **Create: Power Loader** 2.0.5 | 动力加载器：区块加载，让机器在离线时继续运作 |
| **Create: Ore Excavation** 1.6.8 | 矿石开掘：机械钻井采掘无尽矿石 |
| **Create: Liquid Fuel** 2.1.1 | 液体燃料：用 Create 流体驱动引擎 |
| **Create: Encased** 1.9.0 | 封装工艺：更多外壳与机械外观 |
| **Create: Contraption Terminals** 1.3.0 | 动态终端 |
| **Create: Dragons Plus** 1.11.2 | 龙+：龙主题的 Create 内容 |

**辅助模组：**

| 模组 | 功能 |
|------|------|
| **Quark** 4.1-481 | 夸克：原版风格的细节增强，洞穴根须、彩色木板等 |
| **Sophisticated Backpacks** 3.25.68 | 精妙背包：可升级的多槽背包系统 |
| **Sophisticated Core** 1.4.69 | 精妙核心：上述模组的前置 |
| **Tom's Simple Storage** 2.3.2 | 汤姆的简易存储：早期自动化存储方案 |
| **Jade** 15.10.5 | 准星指向信息显示（Waila 精神续作） |
| **FTB Ultimine** 2101.1.14 | 连锁破坏：一键挖掘整条矿脉 |
| **AppleSkin** 3.0.9 | 食物信息 |
| **Inventory Profiles Next** 2.2.5 | 一键背包整理 |
| **Xaero's World Map** 1.41.2 | 世界地图 |
| **Xaero's Minimap** 26.1.0 | 小地图 |
| **Zeta** 1.1-40 | Quark 前置库 |
| **Architectury** 13.0.8 | 多平台模组兼容层 |

37 个模组的 Create 全家桶，覆盖了机械制造、航空飞行、火炮、电力、矿石开采、自动化存储和建筑装饰的全链路——可以从零建立一整个机械文明。

---

### DeceasedCraft - Urban Zombie Apocalypse（306 个模组）

```
MC 版本：1.20.1 | 加载器：Forge
核心关键词：丧尸末日、现代都市、枪械载具
```

这是目前安装的最"硬核"的整合包，城市丧尸末日主题。

**核心内容模组：**

| 模组 | 功能 |
|------|------|
| **CGM Unofficial** 1.4.18 | MrCrayfish 的枪模组（非官方移植），手枪、步枪、霰弹枪等 |
| **DragN Vehicles** 1.3.2 | 载具模组，可驾驶汽车在废弃城市中穿行 |
| **Epic Fight** (via Connector) | 史诗战斗：动作化战斗系统，连招、闪避、处决 |
| **Custom NPCs** | 自定义 NPC，可编脚本、任务和对话 |
| **Extreme Reactors 2** 2.0.94 | 极限反应堆：大型多方块核电设施 |
| **Biomes O' Plenty** 19.0.0.96 | 超多生物群系，给末日世界多样的地形 |
| **Farmer's Delight** 1.2.9 | 农夫乐事：在末日中也要烹饪美食 |
| **Engineer's Delight** B.1.4 | 工程师乐事：机械与料理的交叉 |

**优化类模组：**

- **Chunky** 1.3.146 — 预生成区块，避免探索时卡顿
- **AI Improvements** 0.5.2 — 实体 AI 性能优化
- **BadOptimizations** 2.2.3 — 杂项性能修复
- **FastFurnace / FastWorkbench / FastSuite** — 配方/熔炉性能优化
- **CullLessLeaves** — 树叶面剔除优化
- **Clumps** — 经验球合并，减少实体数量

**特色机制：**

- **DCTweaks** 5.10.14 — DeceasedCraft 的核心魔改脚本，整合各模组的配置
- **Epic Fight + CGM** — 动作战斗系统配上枪械，可以近距离格斗也能远程射击
- **Connector** — 允许在 Forge 端运行 Fabric 模组，极大扩展可选内容

这个包的特色在于**氛围**：BGM 和音效通过 CreativeCore 和 ExtremeSoundMuffler 调校，配合废弃城市的自定义地图（DarkPaintings 提供氛围装饰），营造真正的末世生存体验。

---

### Mechanomania - 航空学（183 个模组）

```
MC 版本：1.21.1 | 加载器：NeoForge
核心关键词：航空、机械、飞行器
```

与机械动力版本关联但各有侧重——航空学聚焦于**飞行和探索**。

**独有模组：**

| 模组 | 功能 |
|------|------|
| **aeroworks** 1.2.11 | 航空核心——飞机制造与驾驶 |
| **alloy_smelter** 1.1.2 | 合金熔炼炉，金属材料加工 |
| **bits_n_bobs** 0.0.44 | 杂项机械零件 |
| **Epic Villages** 1.3.0 | 史诗村庄：生成的村庄更大、更复杂 |
| **HopoBetterRuinedPortals** 1.4.4b | 更好的废墟传送门 |
| **HopoBetterMineshaft** | 更好的废弃矿井 |
| **Nature's Compass** 3.4.0 | 自然指南针：搜索指定生物群系并导航 |
| **Structure Compass** 4.0.0 | 结构指南针：搜索指定结构并导航 |
| **Brewin' and Chewin'** 4.5.0 | 酿造与咀嚼：食物和饮品扩展 |
| **Barbeque's Delight** 1.3.0 | 烧烤乐事 |
| **My Nether's Delight** 1.10.2 | 下界美食 |
| **Useful Slime** 1.12.1 | 实用史莱姆：更多黏液球用途 |
| **Maid Use Hand Crank** 1.6.2 | 女仆用手摇曲柄（趣味模组） |
| **Retraining** 2.0.0 | 技能重训系统 |
| **Simple Backups** 4.0.21 | 自动备份——整合包防崩溃必备 |
| **ImmediatelyFast** 1.6.11 | 即时渲染优化 |
| **Configured Defaults** 21.1.3 | 统一配置管理 |

航空模组（aeroworks）是核心差异点。配合 Create 的动力系统和 Farmer's Delight 的食物链，你可以驾驶自己制造的飞机飞越由 Terralith、Biomes O' Plenty 和史诗村庄构成的广阔世界。

> 另有一个独立的 `航空学` 版本（62 个模组），可能是早期配置或精简版。

---

### 沉浸战斗 Immersive Fight 4.2.3（301 个模组）

```
MC 版本：1.20.1 | 加载器：Forge
核心关键词：动作战斗、BOSS 战、硬核
```

以战斗系统深度改造为目的的整合包。

**战斗核心：**

| 模组 | 功能 |
|------|------|
| **Epic Fight** 0.20.12.2 | 史诗战斗：完全重制战斗动画——连招、闪避、格挡、处决 |
| **Epic Fight: Nightfall** 3.4.0 | 史诗战斗大型扩展包，新增武器类型和战斗风格 |
| **Combat Evolution** 2.1.9 | 战斗进化：战斗机制的进一步调整 |
| **Eugene's Guan Dao** | 青龙偃月刀——中国武器扩展 |
| **Damage Number** 1.3.1 | 伤害数字显示（RPG 风格浮动数字） |
| **Attribute Setter** 1.4 | 属性设定器：精确控制装备属性 |

**世界与生物：**

| 模组 | 功能 |
|------|------|
| **Alex's Caves** (via Dimensions) | 亚历克斯的洞穴：5 个全新地下生物群系 + 独特生物 |
| **Dodos Mobs** 1.0.1 | 渡渡鸟等新生物 |
| **BadMobs** 19.0.1 | 禁止特定生物生成（方便控制难度） |
| **Ageing Spawners** 2.0.0 | 刷怪笼老化：刷太久会变慢，需要更换 |

**RPG 要素：**

| 模组 | 功能 |
|------|------|
| **Apothic Attributes** 1.3.7 | 神化属性：更多装备词缀与属性 |
| **Game Stages** 15.0.2 | 游戏阶段：锁内容，随进度解锁 |
| **Advanced Loot Info** 1.6.0 | 高级战利品信息 |
| **Better Smithing Table** 1.1.0 | 更好的锻造台 UI |

**音效与氛围：**

- **Ambient Sounds** 6.1.11 — 环境音效增强（风声、鸟鸣、洞穴回声）
- **Extra Sounds Next** 1.4 — 更多 UI/交互音效
- **Extreme Sound Muffler** — 选择性静音特定声音

这个包的战斗系统深度远超原版：Epic Fight 将 MC 的点式战斗变为类似动作游戏的技能组合系统，Dodos Mobs 和 Alex's Caves 提供了需要新战术应对的独特敌人。

---

### 乌托邦探险之旅 3.5.2（453 个模组）

```
MC 版本：1.20.1 | 加载器：Fabric
核心关键词：中式 RPG、探险、地牢
```

中文 MC 社区知名度较高的 RPG 探险整合包。

**特色模组：**

| 模组 | 功能 |
|------|------|
| **Aquamirae** 6 | 冰海遗境：冰冻主题 BOSS 与地牢 |
| **Alex's Mobs** 1.22.9 | 89+ 种新生物——从秃鹫到抹香鲸，生态级扩展 |
| **Biomes O' Plenty** 19.0.0.96 | 超多生物群系 |
| **Epic Fight** | 史诗战斗 |
| **Building Wands** 2.7 | 建筑魔杖：一键放置大量方块 |
| **Cosmetic Armor** 1.6.0 | 时装盔甲：外观与装备分离 |
| **Dramatic Doors** 3.3.3 | 戏剧性大门：3 格高的大型门 |
| **Dusty Deco** 1.1 | 复古装饰：旧物风格的家具 |
| **Explorer's Compass** 2.2.3 | 探险者指南针 |
| **Enchanting Infuser** 8.0.3 | 附魔注入器：更灵活的附魔方式 |
| **Chiseled Bookshelf Visualizer** 2.0 | 凿制书架可视化 |
| **3D Placeable Food** 1.1.3 | 3D 可放置食物 |
| **Blazing Bamboo** 1.0.1 | 烈焰竹：竹子的更多用途 |
| **Bridging Mod** 2.5.1 | 搭桥模组：自动向脚下放方块 |
| **Armor Poser** 2.2.2 | 盔甲架姿势编辑 |
| **AddurDisc** 1.3 | 自定义音乐唱片 |

**QoL 模组：**

| 模组 | 功能 |
|------|------|
| **BetterF3** 7.0.2 | 可定制的调试屏幕 |
| **CleanF3** 0.4.10 | 精简调试信息 |
| **Clumps** 12.0.0.4 | 经验球合并 |
| **BOMD** 1.7.5 | BOSS 血条显示 |
| **ContingameIME** 1.0.7 | 中文输入法兼容 |
| **Crosshair Bobbing** 1.10 | 准星晃动 |
| **Disable Custom Worlds Advice** 4.1 | 关闭"自定义世界"警告 |
| **Async Particles** 2.4.0 | 异步粒子渲染（性能优化） |

这个整合包用 Fabric 加载，兼容性强且启动快。大量生物（Alex's Mobs + Aquamirae）让探险充满惊喜，装饰模组（3D 食物、戏剧门、复古装饰）满足建造欲望。

---

### 逆转未来 1.1.4（201 个模组）

```
MC 版本：1.20.1 | 加载器：Forge
核心关键词：RPG、魔法、巨型 BOSS
```

标题"逆转未来"暗示时间穿越主题。模组配置偏向高魔 + 巨型战斗。

**魔法与战斗：**

| 模组 | 功能 |
|------|------|
| **Iron's Spells and Spellbooks** 3.15.3 | 钢铁法术：完整的魔法体系——法书、符文、施法 |
| **Epic Fight: Nightfall** 3.0.4 | 史诗战斗扩展 |
| **Weapons of Miracles** 2.0.15 | 奇迹武器：独特的神器级武器 |
| **Mowzie's Mobs** 1.7.3 | 经典 BOSS 模组：炎魔、雪猿、图腾守卫等巨型敌人 |
| **Alex's Mobs** 1.22.9 | 89+ 种生物 |
| **L'Ender's Cataclysm** 3.16 | 末影灾变：新增多个史诗级 BOSS 和地下城 |
| **CSG O' Box** 2.0.1 | CS2 风格武器箱（趣味模组） |

**世界结构（全系列 YUNG 优化）：**

| 模组 |
|------|
| **YUNG's Better Dungeons** |
| **YUNG's Better Caves** |
| **YUNG's Better Mineshafts** |
| **YUNG's Better Ocean Monuments** |
| **YUNG's Better Jungle Temples** |
| **YUNG's Better End Island** |
| **YUNG's Bridges** |
| **Improved Pillager Outpost** |
| **ATi Structures** 1.4.3 |

YUNG 系列是社区公认质量最高的结构优化模组——每个地牢、矿井和神庙都被重新设计，增加了多样化的房间布局和战利品机制。

**性能：**

- **ModernUI** 3.11.1.6 — 现代化 UI 渲染引擎
- **ImmediatelyFast** 1.5.4 — 即时渲染
- **Krypton FNP** 0.2.28.2 — 网络栈优化
- **Fastquit** 3.0.1 — 快速退出世界

这是一个"高魔高武"的 RPG 包：Iron's Spells 提供魔法体系，Epic Fight + Weapons of Miracles 提供动作化的物理战斗，L'Ender's Cataclysm 和 Mowzie's Mobs 提供需要策略的 BOSS 战。

---

### 你好，新蒸程 V1.5.9（262 个模组）

```
MC 版本：1.21.1 | 加载器：NeoForge
核心关键词：任务驱动、蒸汽朋克、Create
```

"新蒸程"谐音"新征程"，以蒸汽/机械为主题的整合包。

**任务与进度：**

| 模组 | 功能 |
|------|------|
| **FTB Quests** 2101.1.24 | FTB 任务系统——整合包的任务书核心 |
| **FTB Teams** 2101.1.10 | FTB 队伍——多人合作的队伍系统 |
| **Starter Kit** 8.0 | 初始套件——自定义开局物品 |

**Create 体系：**

| 模组 | 功能 |
|------|------|
| **Create** | 机械动力本体 |
| **CBC More Shells** 1.1.1 | 更多炮弹类型（配合火炮） |
| **Sable** | Create 附属前置库 |
| **VS-Sable Hose Connectors** 0.1.6 | Valkyrien Skies 兼容 |

**建筑与装饰：**

| 模组 | 功能 |
|------|------|
| **MrCrayfish's Furniture: Refurbished** 1.0.22 | 精致家具——沙发、电视、厨房等现代家具 |
| **Design-n-Decor** 2.2b | 设计与装饰——更多建筑方块 |
| **Storage Drawers** 13.11.4 | 储物抽屉——经典的大容量存储模组 |
| **Waystones** 21.1.34 | 传送石碑——在各据点间快速传送 |

**世界生成：**

| 模组 | 功能 |
|------|------|
| **TerraBlender** 4.1.0.8 | 生物群系融合引擎 |
| **Explorify** 1.6.5 | 探索发现——更多小型结构 |
| **Philips Ruins** 2.0 | 废墟生成 |
| **HopoBetterMineshaft** 1.3.0b | 更好的废弃矿井 |
| **HopoBetterRuinedPortals** 1.4.4b | 更好的废墟传送门 |
| **HopoBetterUnderwaterRuins** 1.2.1b | 更好的水下废墟 |
| **Integrated Stronghold** 1.1.4 | 整合要塞 |

**特色：**
- **Camerapture** 1.10.12 — 游戏内相机，可拍照并挂在墙上展示
- **ViScriptShop** 1.1.6 — 脚本商店系统，可用货币交易物品
- **C^2M Engine** 0.3.0 — 并发区块管理引擎，提升多人性能
- **Connector** 2.0.0 — 允许在 NeoForge 端运行 Fabric 模组

这是一个"有人引导"的整合包——FTB 任务系统提供目标和进度追踪，Create 提供机械自动化，大量结构模组让世界充满值得探索的地点。

---

### Closing Song / 落幕曲 1.6.4（283 / 291 个模组）

```
MC 版本：1.20.1 | 加载器：Forge
核心关键词：叙事冒险、魔法使、季节系统
```

列表中有两个同名文件夹（中英文），这是一个叙事驱动的冒险包。

**核心机制：**

| 模组 | 功能 |
|------|------|
| **Goety Revelation** 2.3.1 | 鬼祟启示录：暗黑魔法体系——亡灵法术、血魔法、契约 |
| **L'Ender's Cataclysm** 3.09 | 末影灾变：史诗 BOSS |
| **Icarus** 2.10.0 | 伊卡洛斯之翼——多种飞行翅膀 |
| **Ecliptic Seasons** 0.10 | 黄道季节——四季轮替系统，影响作物、天气和生物 |
| **Fumo** 16.0.0 | Fumo 玩偶——东方 Project 角色玩偶（可放置装饰） |
| **Epic Fight / Nightfall** | 史诗战斗 |

**战斗与怪物：**

| 模组 | 功能 |
|------|------|
| **Guardian Mod** 2.2 | 守护者——更多守护者变体 |
| **CME Champion Helper** 1.0 | 精英生物助手 |
| **Dodos Mobs** 1.0.1 | 渡渡鸟与更多生物 |
| **Awesome Sheep Swell** 1.3.2 | 爆炸羊（趣味模组） |
| **Incinerators Try Hard** 1.0.6 | 焚化炉强化 |

**世界变化：**

| 模组 | 功能 |
|------|------|
| **Brooms Mod** 1.1.2 | 飞天扫帚——魔法师的交通工具 |
| **Custom Starting Gear** 2.0.3 | 自定义开局装备 |
| **Disenchanting** 2.2.4 | 附魔剥离——把附魔从装备上取下来 |
| **Cut Through** 8.0.2 | 穿透攻击——武器能打到多个目标 |
| **ISS Virtual Witch Arrangement** 1.0.0 | 虚拟女巫编排——女巫 AI 和行为增强 |

**特色：**

- **HitFeedback** 1.1.8 — 打击反馈：击中/被击中时的屏幕震动等效果
- **Item Borders** 1.2.2 — 物品边框：按稀有度显示彩色边框
- **Legendary Tooltips** 1.4.5 — 传说级提示框：更美观的物品描述
- **Immersive UI** 0.3.0 — 沉浸式 UI 动画
- **Ending Library** 2.1.10 — 落幕曲核心数据修改库
- **Ecliptic Seasons** — 四季系统使世界随时间变化，与 Goety 的魔法主题很好地结合

这是一个 "有主题的叙事整合包" 。Goety 提供深度魔法体系，Icarus 让飞行成为可能，Ecliptic Seasons 让世界随时间呼吸。落幕曲（Closing Song）这个名字本身也暗示着某种终章或结局的故事线。

---

## 三、专项优化版本

### 红石生电优化（82 个模组）

```
MC 版本：1.21.11 | 加载器：Fabric
核心关键词：红石科技、性能极致、服务端级优化
```

这是为红石电路和生电（生存电力/工业化）玩家量身定制的版本。

**红石/技术核心：**

| 模组 | 功能 |
|------|------|
| **Fabric Carpet** 1.4.194 | 地毯模组：精确控制游戏机制（TNT 复制、更新抑制等） |
| **Litematica** (via malilib) | 建筑投影 |
| **Axiom** 5.3.0 | 建筑辅助——创意模式级工具，在生存中微调方块 |
| **ViaFabricPlus** 4.4.11 | 跨版本连接——用最新客户端连旧版服务器 |
| **Controlify** 3.0.0 | 手柄支持 |
| **E4MC** 6.1.0 | 局域网世界公开到公网（无需服务器） |

**极致性能栈：**

| 模组 | 功能 |
|------|------|
| **Sodium** | 渲染优化 |
| **Lithium** 0.21.1 | 服务端逻辑优化 |
| **FerriteCore** 8.2.0 | 内存优化——大幅减少 RAM 占用 |
| **C^2M Engine** 0.3.0 | 并发区块管理 |
| **ImmediatelyFast** 1.14.2 | 即时渲染 |
| **Bobby** 5.2.11 | 超视距区块缓存 |
| **FastQuit** 3.1.3 | 快速退出 |
| **No Chat Reports** 2.18.0 | 禁用聊天举报 |
| **Entity Culling** 1.10.1 | 实体面剔除——不可见实体不渲染 |

**视觉增强：**

| 模组 | 功能 |
|------|------|
| **Iris** + **Photonics** 0.3.4 | 光影加载 + 光子引擎 |
| **Continuity** 3.0.1 | 连接纹理（玻璃无缝衔接） |
| **Blur** 6.2.0 | 界面模糊效果 |
| **Entity Model Features** 3.0.17 | 实体模型变体支持 |
| **Entity Texture Features** 7.0.13 | 实体纹理变体（随机/命名/生物群系） |
| **Capes** 1.5.10 | 披风显示 |
| **Chat Heads** 1.2.1 | 聊天头像显示 |

**实用工具：**

- **Jade** 21.1.6 — 指向信息显示
- **Inventory Profiles Next** 2.2.6 — 背包整理
- **Chest Tracker** 2.8.1 — 箱子追踪，记住每个箱子里有什么
- **HMI** 5.1.1 — 辅助信息面板
- **Flashback** 0.39.3 — 游戏内录屏
- **Dynamic Crosshair** 9.11 — 动态准星
- **CWB** 3.0.0 — 可放置的工具（挂在墙上展示）
- **Resourcify** 1.8.1 — 资源包管理

这个版本的模组选择非常精准——Carpet 是红石科技玩家的命脉（可调整 TNT、更新、刷怪等底层机制），Litematica 辅助大型建设，而 ViaFabricPlus 让你能用最新客户端加入各种老旧服务器。

### 天气优化 1.21.11（36 个模组）

```
MC 版本：1.21.11 | 加载器：Fabric
核心关键词：天气、光影、视觉沉浸
```

**视觉/天气核心：**

| 模组 | 功能 |
|------|------|
| **Sodium** 0.8.1 + **Iris** 1.10.3 | 渲染 + 光影基础 |
| **Voxy** 0.2.7 | 体素地形渲染——远距离 LOD 新方案 |
| **Scalable Lux** 0.1.6 | 可缩放光照引擎 |
| **Particle Rain** 4.0.0 | 粒子雨——增强的雨滴、雪片粒子效果 |
| **Sound Physics Remastered** 1.5.1 | 物理声效——混响、回声、隔音、水下音效 |
| **Ambient Sounds** 6.3.3 | 自然环境音效（鸟鸣、风声、洞穴滴水等） |
| **Terralith** 2.5.14 | 数据包驱动的生物群系大修——100+ 新地形变体 |
| **Zoomify** 2.14.6 | 望远镜缩放，带平滑动画 |
| **CreativeCore** 2.14.9 | 音效和渲染框架 |
| **Entity Texture Features** 7.0.8 | 实体纹理变体 |

**性能优化：**

| 模组 | 功能 |
|------|------|
| **Lithium** 0.21.1 | 服务端逻辑优化 |
| **FerriteCore** 8.0.3 | 内存优化 |
| **ImmediatelyFast** 1.14.1 | 即时渲染 |
| **Entity Culling** 1.9.4 | 实体面剔除 |
| **BadOptimizations** 2.4.1 | 杂项修复 |
| **Dynamic FPS** 3.11.0 | 后台降帧 |
| **C^2M Engine** 0.3.6 | 并发区块管理 |
| **Sodium Extra** 0.8.1 | Sodium 功能扩展 |

"天气优化"这个命名非常贴切：Particle Rain 改进雨雪视觉，Sound Physics 处理环境音效，CreativeCore + Ambient Sounds 提供丰富的自然环境声。配合 Terralith 的壮丽地形和 Voxy 的超远视野，玩起来就像换了一个引擎。

---

## 版本统计

```text
加载器分布：
Forge       ████████ 6 个
Fabric      ██████   4 个
NeoForge    ██████   4 个
未标注       ██████   6 个

总模组数（去重估算）：3,000+ 个模组实例
版本跨度：1.19.2（2022）→ 26.2（2026），跨越 4 年
最大整合包：乌托邦探险之旅 3.5.2（453 个模组）
其次：DeceasedCraft（306）、沉浸战斗（301）、落幕曲（291）、Closing Song（283）、新蒸程（262）、逆转未来（201）
最小版本：1.20.1-Forge_47.4.20 和 26.2-Forge_65.0.1（各仅 2 个模组）
```

---

## 关于 PCL

所有版本通过 **PCL**（Plain Craft Launcher，简洁启动器）管理：

- 多版本独立 `.minecraft` 隔离
- 整合包 / Mod / 资源包一键下载
- 快照版支持（日常使用 `PCL+快照版+2.12.8.0`）
- 版本间完全独立，互不干扰

---

## 结语

20 个版本，3,000+ 个模组实例——从原版的钠优化到 Create 的机械帝国，从丧尸末日的硬核求生到航空学的飞天梦想。Minecraft 的无限可能，就藏在这些文件夹里。

> ⛏️ 当前活跃：1.20.1-Forge（生存主档 + 龙之崛起）、机械动力 1.21.1-NeoForge（科技档）
