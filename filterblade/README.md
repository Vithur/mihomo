# Filterblade 简体中文汉化

Path of Exile 1 / 2 的 [FilterBlade](https://www.filterblade.xyz/) 过滤器编辑器简体中文汉化数据与油猴脚本。

## 文件

| 文件 | 说明 |
|---|---|
| `filterblade-zh-cn.user.js` | 油猴脚本（Tampermonkey / Violentmonkey） |
| `poe2.zh-cn.json` | PoE 2 词条（英文 → 简体中文） |
| `poe1.zh-cn.json` | PoE 1 词条（英文 → 简体中文） |

## 安装脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 打开 `filterblade-zh-cn.user.js` 的 raw 地址，Tampermonkey 会提示安装
3. 访问 <https://www.filterblade.xyz/?game=Poe2>，右下角出现「中/En」按钮即生效

## 快捷键

| 快捷键 | 作用 |
|---|---|
| `Ctrl + F8` | 导出当前页面所有未翻译文案为 `untranslated_text.json` |
| `Ctrl + F9` | 重置「一天内不再显示」弹窗设置 |

常用指令：`Ctrl + R` 重新翻译当前页面。

## 词条来源与生成方式

1. **繁体原译**：来自 [Sab](https://greasyfork.org/zh-CN/scripts/544318) 的《Filterblade 中文化工具》词典（英文 → 繁体）。
2. **游戏专有名词**：**不采用字符级繁转简**。游戏内繁简是两套独立译文（例：`Essences` 繁体「精髓」/ 简体「精华」，`Prismatic` 繁体「三相」/ 简体「三位一体」），因此游戏实体名统一以 [poe2db.tw](https://poe2db.tw/cn/) 简中站为准，按 `URL slug = 英文实体名` 的规则逐条对齐。
3. **界面用语**：字符级繁转简 + 大陆用语替换表（如 自订→自定义、汇出→导出、载入→加载）。
4. **覆盖情况**（PoE 2，共 14,248 条）：

| 来源 | 条数 | 占比 |
|---|---|---|
| poe2db 官方简中译名（逐条探测 slug） | 5,260 | 36.9% |
| poe2db 列表页 CN 表归一化匹配 | 6 | 0.0% |
| 繁体值反查 CN 表 | 14 | 0.1% |
| 字符转换 + 大陆用语替换表（兜底） | 8,968 | 62.9% |

兜底部分主要是 FilterBlade 自身的界面长句（如严格度说明文案），这类文案在 poe2db 中不存在对应实体，字符转换即为正确做法。

### 关于繁简差异

游戏内繁简是**两套独立译文**，不能靠字符转换得到。poe2db 同 slug 对齐的 2,049 个条目中，96.6% 的 CN/TW 译名完全不同：

| 英文 | 繁体 | 简体 |
|---|---|---|
| Essences | 精髓 | 精华 |
| Prismatic | 三相 | 三位一体 |
| Animate Weapon | 幻化武器 | 显化武器 |
| Explosive Arrow | 爆炸箭矢 | 爆炸射击 |
| Waystones | 换界石 | 引路石 |
| Travel | 快行 | 旅行 |
| Spirit | 精魂 | 精神 |


## 数据说明

词条文件为 `[[英文, 简体中文], ...]` 的 JSON 数组，脚本通过 `GM_xmlhttpRequest` 拉取，因此更新词条**不需要重新安装脚本**——改仓库里的 JSON 即可。

## 致谢

- 繁体原版脚本与词典：[Sab](https://greasyfork.org/zh-CN/scripts/544318)
- 游戏术语数据源：[poe2db.tw](https://poe2db.tw/cn/)
- FilterBlade 本身由 NeverSink 团队开发维护

本项目与 Grinding Gear Games 无任何关联。
