# TasteOS Design Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建并安装一个经过自动校验和浏览器视觉复核的 `tasteos-design` Skill，用于生成发布级 PC 端 TasteOS 网站前端。

**Architecture:** 以 `design-model.yaml` 作为唯一设计事实源；`SKILL.md` 只保存核心设计纪律和工作流，详细 Token、组件和 Web 映射放在 `references/`。四个独立 HTML 从同一设计模型取值，分别验证设计语言、组件覆盖、营销延展和真实工作台密度。

**Tech Stack:** Markdown、YAML、HTML、CSS、JavaScript、Lucide Webfont、Google Fonts、Node.js Hue validator、Python Skill validator、Codex in-app browser。

---

## File Structure

- Create: `C:\Users\29986\.codex\skills\tasteos-design\design-model.yaml` — 设计事实源。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\SKILL.md` — 触发条件、设计哲学、强制规则、执行流程。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\agents\openai.yaml` — Codex UI 元数据。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\references\tokens.md` — 色彩、字体、间距、圆角、阴影、动效和图标。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\references\components.md` — PC 工作台组件和状态。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\references\platform-mapping.md` — HTML/CSS 与 React/Tailwind 映射。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\preview.html` — Bento Grid 设计语言预览。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\component-library.html` — 组件库预览。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\landing-page.html` — 产品介绍页延展。
- Create: `C:\Users\29986\.codex\skills\tasteos-design\app-screen.html` — 发布级 PC 工作台主验证页面。

### Task 1: Baseline Pressure Test

- [ ] **Step 1: 创建无 Skill 的基线任务**

向独立执行者提供参考图与需求：“为 TasteOS 设计发布级 1440px PC 工作台，保留案例库、分析区、配置栏。”

- [ ] **Step 2: 记录基线失败**

检查输出是否出现通用 SaaS 卡片堆叠、过度渐变、缺少 1280px 策略、缺少组件状态或移动端优先重排，并记录为 Skill 必须防止的具体失败。

### Task 2: Initialize Skill

- [ ] **Step 1: 运行 Skill 初始化器**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  'C:\Users\29986\.codex\skills\.system\skill-creator\scripts\init_skill.py' `
  tasteos-design `
  --path 'C:\Users\29986\.codex\skills' `
  --resources references `
  --interface 'display_name=TasteOS Design' `
  --interface 'short_description=发布级 PC 视觉工作台设计系统' `
  --interface 'default_prompt=Use $tasteos-design to design a production-ready PC web interface for TasteOS.'
```

Expected: 创建 `C:\Users\29986\.codex\skills\tasteos-design`，包含 `SKILL.md` 与 `agents/openai.yaml`。

- [ ] **Step 2: 检查目录无示例占位文件**

Run:

```powershell
Get-ChildItem -Recurse 'C:\Users\29986\.codex\skills\tasteos-design'
```

Expected: 仅包含实际需要的 Skill、agent metadata 和 references 目录。

### Task 3: Write Design Model

- [ ] **Step 1: 创建 `design-model.yaml`**

模型必须明确：

```yaml
identity:
  name: TasteOS
  type: ui-rich
  domain: AI visual reference analysis and prompt workbench
platform:
  primary: web
  device: desktop
  baseline: 1440x900
  supported_width: 1280-1920
  minimum_width: 1200
colors:
  background: "#F5F7FA"
  surface1: "#FFFFFF"
  surface2: "#F8FAFC"
  surface3: "#EEF2F7"
  border: "#E4E8EF"
  border_visible: "#CBD5E1"
  text1: "#172033"
  text2: "#667085"
  text3: "#98A2B3"
  text4: "#C5CBD5"
  accent: "#2F6BFF"
  accent_subtle: "#EAF1FF"
fonts:
  display: Inter
  body: Inter
  mono: JetBrains Mono
iconography:
  fallback_kit:
    name: Lucide
app_screen:
  archetype: editor
  frame: browser
```

还必须包含完整 light/dark token、8px 间距、圆角、阴影、机械式动效、hero stage 和 app screen 内容种子。

- [ ] **Step 2: 扫描 YAML 占位符**

Run:

```powershell
rg -n 'TBD|TODO|\{\{' 'C:\Users\29986\.codex\skills\tasteos-design\design-model.yaml'
```

Expected: 无输出。

### Task 4: Write Skill Instructions and References

- [ ] **Step 1: 编写 `SKILL.md`**

Frontmatter 必须满足：

```yaml
---
name: tasteos-design
description: "This skill should be used when the user explicitly says 'TasteOS style', 'TasteOS design', '/tasteos-design', or directly asks to use/apply the TasteOS design system. NEVER trigger automatically for generic UI or design tasks."
version: 1.0.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---
```

正文必须包含：设计哲学、5–7 条可证伪原则、8–12 条 “No …” 反模式、PC 工作台流程、极端内容检查和 references 导航。

- [ ] **Step 2: 编写 `references/tokens.md`**

包含完整 light/dark 色彩、Inter/JetBrains Mono 字体、7 级字号、8px 间距、4/6/8/10/12px 圆角、3 级阴影、140/180/200ms 动效和 Lucide 声明。

- [ ] **Step 3: 编写 `references/components.md`**

至少覆盖按钮、图标按钮、输入、上传区、案例卡、分析画布、提示词区、配置栏、导航、标签、表格、状态、弹窗、抽屉、Tooltip，并为交互组件列出 default/hover/focus/active/disabled/loading/error。

- [ ] **Step 4: 编写 `references/platform-mapping.md`**

提供可复制的 Google Fonts、Lucide、`:root`、dark mode、桌面工作台 Grid、1280px 收栏策略、`prefers-reduced-motion` 和 Tailwind token 映射。

- [ ] **Step 5: 占位与规则扫描**

Run:

```powershell
rg -n 'TBD|TODO|\{\{|warm cream|terracotta|mobile-first' 'C:\Users\29986\.codex\skills\tasteos-design'
```

Expected: 无输出。

### Task 5: Generate Four Visual Proofs

- [ ] **Step 1: 创建 `preview.html`**

生成 1120px 居中的 4 列 Bento Grid，包含案例趋势、分析状态、提示词资产、模型状态、快捷动作和 Token Key；提供 Light/Dark 浮动切换条。

- [ ] **Step 2: 创建 `component-library.html`**

使用左侧 sticky TOC，展示 Foundations、Actions、Inputs、Data Display、Navigation、Feedback、Overlays。所有值与 `design-model.yaml` 一致。

- [ ] **Step 3: 创建 `landing-page.html`**

以产品工作台窗口作为 hero subject，保持冷雾白、工具蓝和轻边框，不使用霓虹、玻璃拟态或大面积渐变。核心 CTA 在 header、hero、final CTA 三处一致出现。

- [ ] **Step 4: 创建 `app-screen.html`**

使用 browser frame，1440px 工作台内部包含顶部导航、左侧功能栏、至少 10 个案例缩略项、完整分析画布、提示词基因、负向词和右侧配置。加入一个 hover/光标中途使用状态。

- [ ] **Step 5: 禁用预览链接副作用**

四个 HTML 尾部加入：

```javascript
document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});
```

### Task 6: Automated Validation

- [ ] **Step 1: 运行 Hue validator**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'C:\Users\29986\.codex\skills\hue\scripts\validate.mjs' `
  'C:\Users\29986\.codex\skills\tasteos-design'
```

Expected: exit code 0，所有检查通过。

- [ ] **Step 2: 运行 Skill validator**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  'C:\Users\29986\.codex\skills\.system\skill-creator\scripts\quick_validate.py' `
  'C:\Users\29986\.codex\skills\tasteos-design'
```

Expected: Skill valid。

- [ ] **Step 3: 修复并重复运行**

任何 ERROR 都必须修复后重新执行两套 validator，直到均为 0。

### Task 7: Browser Visual Verification

- [ ] **Step 1: 在 1440 × 900 打开四个 HTML**

检查字体、主色、布局、溢出和视觉密度。`app-screen.html` 必须像真实产品，而不是组件拼盘。

- [ ] **Step 2: 在 1280 × 800 检查 `app-screen.html`**

Expected: 右侧配置栏按规范收窄或收起，中央分析区保持可读，无内容重叠。

- [ ] **Step 3: 切换 Light/Dark**

Expected: 两种模式均无低对比文本、错误边框和不可见图标。

- [ ] **Step 4: 保存关键截图**

保存到 `C:\Users\29986\.codex\skills\tasteos-design\assets\verification\`，至少包含 1440px app screen 和 1280px app screen。

### Task 8: Forward Test and Handoff

- [ ] **Step 1: 使用 Skill 执行测试任务**

测试提示：

```text
Use $tasteos-design to redesign a desktop AI visual-analysis workbench with a reference library, analysis canvas, and configuration rail.
```

Expected: 输出遵守 PC 工作台结构、工具蓝、冷雾白、克制阴影、完整状态和 1280–1920px 规则。

- [ ] **Step 2: 比较基线失败**

确认 Task 1 中的通用卡片堆叠、过度渐变、移动端优先重排和缺状态问题均被 Skill 明确阻止。

- [ ] **Step 3: 最终完整性检查**

Run:

```powershell
Get-ChildItem -Recurse 'C:\Users\29986\.codex\skills\tasteos-design'
```

Expected: 所有计划文件存在，无临时文件和占位内容。

