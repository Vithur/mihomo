# Filterblade 简体中文汉化（PoE 2）

[FilterBlade](https://www.filterblade.xyz/?game=Poe2) 过滤器编辑器的**简体中文**汉化数据与油猴脚本。

> 仅支持 **Path of Exile 2**。PoE 1 不在本项目范围内。

## 文件

| 文件 | 说明 |
|---|---|
| `filterblade-zh-cn.user.js` | 油猴脚本（Tampermonkey / Violentmonkey） |
| `poe2.zh-cn.json` | 词条（英文 → 简体中文），脚本运行时远程加载 |
| `ui_overlay.json` | 界面文案补充词典（构建源，已烘焙进上面的 JSON） |

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 打开脚本 raw 地址，Tampermonkey 会提示安装
3. 访问 <https://www.filterblade.xyz/?game=Poe2>，右下角出现「中/En」按钮即生效

```
https://raw.githubusercontent.com/Vithur/mihomo/main/filterblade/filterblade-zh-cn.user.js
```

## 快捷键

| 快捷键 | 作用 |
|---|---|
| `Ctrl + R` | 重新翻译当前页面 |
| `Ctrl + F8` | 导出当前页面所有未翻译文案为 `untranslated_text.json` |
| `Ctrl + F9` | 重置「一天内不再显示」弹窗设置 |

## 词条来源

1. **繁体原译**：来自 [Sab](https://greasyfork.org/zh-CN/scripts/544318) 的《Filterblade 中文化工具》词典。
2. **游戏专有名词**：**不采用字符级繁转简**。游戏内繁简是两套独立译文，游戏实体名以 [poe2db.tw](https://poe2db.tw/cn/) 官方简中译名为准，按「URL slug = 英文实体名」的规则逐条对齐。
3. **界面文案**：字符级繁转简 + 大陆用语替换表 + 人工补充（`ui_overlay.json`）。

### 为什么不能靠字符转换

同 slug 对齐的 2,049 个 poe2db 条目中，**96.6% 的 CN/TW 译名完全不同**：

| 英文 | 繁体 | 简体 |
|---|---|---|
| Essences | 精髓 | 精华 |
| Waystones | 换界石 | 引路石 |
| Travel | 快行 | 旅行 |
| Tear | 撕裂 | 撕扯 |
| Rune of Foundations | 崇敬基準符文 | 根基符文 |
| The Adorned | 假掰（台服俗称） | 浮华 |

### 反例：两岸同译的不要乱转

`tw2cn` 反查（用繁体译名去 CN 表找简体）必须要求「词典键与 slug 同源」，否则会跨实体撞名：

| 词典键 | 繁体值 | 撞上的 slug | 错误结果 |
|---|---|---|---|
| `Prismatic` | 三相 | `Trinity`（TW 名同为「三相」） | ~~三位一体~~ → 应为 **三相** |
| `Animate Weapon` | 幻化武器 | `Manifest Weapon`（TW 名同为「幻化武器」） | ~~显化武器~~ → PoE1 技能名，不可套 PoE2 |

已核实两岸同译、**不可**转换的：`Spirit`=精魂、`Prismatic Ring`=三相戒指。

## 覆盖统计（PoE 2，共 14,402 条）

| 来源 | 条数 | 占比 |
|---|---|---|
| poe2db 官方简中译名（逐条探测 slug） | 5,260 | 36.5% |
| 人工补充界面文案（`ui_overlay.json`） | 177 | 1.2% |
| poe2db 列表页 CN 表匹配 / 繁体值反查 | 7 | 0.0% |
| 字符转换 + 大陆用语替换表（兜底） | 8,958 | 62.2% |

**Filterblade 界面文案覆盖率：390 / 406 = 96.1%**（实机无头浏览器遍历 Start / Customize / Overview / Simulate / Themes / Advanced / Export / Profile / Settings 全站抓取比对）。

剩余 16 条为品牌与人名，**本就不应翻译**：`FilterBlade`、`Discord`、`Patreon`、`Twitter`、`YouTube`、`Twitch`、`GitHub`、`NeverSink`、`Zoey`、`Haggis`、`Eleni (MochiMM)`、`AlwaysFloat Technologies`、`FilterBladeContact@gmail.com`、`PoE 1`、`PoE 2`。

## 数据说明

词条文件为 `[[英文, 简体中文], ...]` 的 JSON 数组，脚本通过 `GM_xmlhttpRequest` 拉取。**更新词条不需要重新安装脚本**，改仓库里的 JSON 即可。

## 致谢

- 繁体原版脚本与词典：[Sab](https://greasyfork.org/zh-CN/scripts/544318)
- 游戏术语数据源：[poe2db.tw](https://poe2db.tw/cn/)
- FilterBlade 本身由 NeverSink 团队开发维护

本项目与 Grinding Gear Games 无任何关联。
