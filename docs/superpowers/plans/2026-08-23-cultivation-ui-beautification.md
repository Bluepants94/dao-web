# 修仙挂机游戏界面美化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans` 逐任务实现此计划。步骤使用复选框跟踪进度。

**目标：** 在不改变认证、心跳、服务端结算和突破 API 的前提下，将前端升级为“东方玄幻・夜色灵气”视觉界面。

**架构：** 保留 `GamePage` 作为页面状态容器，由 `PlayerStatsPanel` 和 `MeditationPanel` 负责展示分区。新增一份全局 CSS 负责主题变量、响应式布局、卡片、状态徽标、进度条和表单样式；组件只增加语义化 className 和展示结构，不在前端重新计算游戏数值。

**技术栈：** React、TypeScript、Vite、原生 CSS、Vitest、React DOM。

---

## 文件结构

- 创建：`apps/web/src/styles.css`——全局主题变量、背景、布局、组件样式和移动端断点。
- 修改：`apps/web/src/main.tsx`——引入全局样式。
- 修改：`apps/web/src/pages/GamePage.tsx`——认证页、加载页和游戏页的布局结构、状态徽标和错误提示。
- 修改：`apps/web/src/components/PlayerStatsPanel.tsx`——属性卡片、境界摘要、战斗属性网格。
- 修改：`apps/web/src/components/MeditationPanel.tsx`——灵气统计、进度条、挂机速度和突破操作。
- 修改：`apps/web/test/game.test.tsx`——补充关键视觉状态对应的可访问文本和交互断言。

## 设计约束

- 使用深靛蓝、墨黑、青绿色灵气和金色突破强调色。
- 不添加图片、外部字体、图标库或第三方 UI 框架。
- 使用 CSS 渐变、伪元素和阴影实现背景光晕与卡片层次。
- 桌面端使用双栏布局，`max-width` 控制阅读宽度；窄屏使用单栏布局，不产生横向滚动。
- 保留现有 `aria-label`、`role="alert"`、`role="status"` 和表单语义。
- 保留所有现有 API 调用、Token 逻辑、心跳逻辑和突破回调。

### 任务 1：建立主题样式基础

**文件：**
- 创建：`apps/web/src/styles.css`
- 修改：`apps/web/src/main.tsx`

- [x] **步骤 1：确认样式入口当前没有主题样式依赖**

检查 `main.tsx` 只挂载 `App`，确认样式文件可作为唯一全局入口，避免重复导入。

- [x] **步骤 2：创建 CSS 主题变量和基础布局**

定义 `:root` 颜色、间距、圆角和阴影变量；实现 `body` 的深色背景、背景光晕、默认字体、按钮和输入框基础状态；实现 `.game-shell`、`.game-header`、`.game-layout` 的桌面/移动端布局。

- [x] **步骤 3：引入样式并运行前端构建**

在 `main.tsx` 增加：

```tsx
import './styles.css';
```

运行 `npm run build`，确认 CSS 被 Vite 正常打包。

- [x] **步骤 4：Commit**

```bash
git add apps/web/src/main.tsx apps/web/src/styles.css
git commit -m "feat: add cultivation game visual theme"
```

### 任务 2：升级角色属性面板

**文件：**
- 修改：`apps/web/src/components/PlayerStatsPanel.tsx`
- 测试：`apps/web/test/game.test.tsx`

- [x] **步骤 1：编写失败的渲染断言**

使用现有 `player` fixture 渲染 `GamePage`，断言页面包含等级摘要、境界摘要、在线状态、`HP`、`攻击`、`暴击率` 和 `闪避率` 的可访问文本，并断言属性分组标题存在。

- [x] **步骤 2：运行前端测试确认断言失败**

运行：

```bash
npm test -- --run apps/web/test/game.test.tsx
```

预期：新增的分组标题或展示文本尚不存在，测试失败。

- [x] **步骤 3：实现属性面板结构**

将单一段落列表改为：

```tsx
<section className="panel stats-panel" aria-label="角色属性">
  <div className="panel-heading">...</div>
  <div className="realm-summary">...</div>
  <div className="stat-grid">...</div>
  <div className="combat-grid">...</div>
</section>
```

继续从 `player` 读取所有数值；在线状态使用 `status-badge status-online` 或 `status-badge status-offline` class，不添加前端状态推导。

- [x] **步骤 4：补充面板视觉样式并运行测试**

为 `.stats-panel`、`.realm-summary`、`.stat-grid`、`.stat-card`、`.combat-grid` 和状态徽标添加卡片、边框、发光和响应式样式，运行同一测试文件确认通过。

- [x] **步骤 5：Commit**

```bash
git add apps/web/src/components/PlayerStatsPanel.tsx apps/web/test/game.test.tsx apps/web/src/styles.css
git commit -m "feat: redesign player stats panel"
```

### 任务 3：升级打坐修炼面板

**文件：**
- 修改：`apps/web/src/components/MeditationPanel.tsx`
- 修改：`apps/web/src/pages/GamePage.tsx`
- 测试：`apps/web/test/game.test.tsx`

- [ ] **步骤 1：编写突破状态和进度断言**

增加测试覆盖：

```tsx
expect(screen.getByText('灵气进度')).toBeTruthy();
expect(screen.getByText('在线获取')).toBeTruthy();
expect(screen.getByRole('button', { name: '突破' })).toBeTruthy();
```

并验证 `breakthrough.canBreakthrough === true` 时按钮可用，`false` 时按钮保持禁用。

- [ ] **步骤 2：运行测试确认新增断言失败**

运行：

```bash
npm test -- --run apps/web/test/game.test.tsx
```

预期：新的面板标题和统计标签尚不存在，测试失败。

- [ ] **步骤 3：实现修炼面板结构**

将现有段落改为：

```tsx
<section className="panel meditation-panel" aria-label="修炼进度">
  <div className="panel-heading">...</div>
  <div className="aura-total">...</div>
  <div className="rate-grid">...</div>
  <div className="progress-block">...</div>
  <div className="breakthrough-block">...</div>
</section>
```

进度条宽度直接使用 `levelProgress.required > 0` 时的 `current / required` 展示比例；100 级或 `required === 0` 时使用满进度或封顶状态，不改变服务端数值，仅用于视觉表现。

- [ ] **步骤 4：实现突破按钮状态样式**

使用 `breakthrough.canBreakthrough` 和 `isBreakingThrough` 控制现有 `disabled` 行为；可突破时增加 `button-primary button-breakthrough` class，不可突破时显示禁用原因，执行中显示“突破中…”。

- [ ] **步骤 5：运行测试并 Commit**

```bash
npm test -- --run apps/web/test/game.test.tsx
git add apps/web/src/components/MeditationPanel.tsx apps/web/src/pages/GamePage.tsx apps/web/test/game.test.tsx apps/web/src/styles.css
git commit -m "feat: redesign meditation progression panel"
```

### 任务 4：完成认证页、加载页和错误反馈布局

**文件：**
- 修改：`apps/web/src/pages/GamePage.tsx`
- 修改：`apps/web/src/styles.css`
- 测试：`apps/web/test/game.test.tsx`

- [ ] **步骤 1：编写认证和错误状态断言**

验证未登录时存在 `auth-card` 语义区域、用户名和密码输入框、登录/注册切换按钮；验证 `role="alert"` 错误提示存在且不会移除表单。

- [ ] **步骤 2：实现认证页视觉结构**

将未登录分支包装为 `.auth-shell` 和 `.auth-card`，增加副标题、输入框提示文本、表单按钮组和错误提示容器；不改变现有 `authMode`、`handleAuthentication` 和 API 调用。

- [ ] **步骤 3：实现加载页和游戏页外壳**

将加载分支使用 `.loading-shell`、`.loading-orb` 和 `role="status"`；登录后使用 `.game-shell`、`.game-header`、`.game-layout` 包裹两个面板，并在 header 中显示用户名、境界和在线状态。

- [ ] **步骤 4：运行前端测试确认认证行为不回归**

运行：

```bash
npm test -- --run apps/web/test/game.test.tsx
```

预期：认证提交、错误展示、突破点击和状态加载测试全部通过。

- [ ] **步骤 5：Commit**

```bash
git add apps/web/src/pages/GamePage.tsx apps/web/src/styles.css apps/web/test/game.test.tsx
git commit -m "feat: polish cultivation game page layout"
```

### 任务 5：集成验证与 Docker Web 构建

**文件：**
- 验证：`apps/web/src/`、`apps/web/test/`、`compose.yaml`

- [ ] **步骤 1：运行完整测试**

```bash
npm test
```

预期：所有服务端、规则包和前端测试通过。

- [ ] **步骤 2：运行构建与 Lint**

```bash
npm run build
npm run lint
```

预期：TypeScript、Vite 和 ESLint 均无错误。

- [ ] **步骤 3：构建 Docker Web 服务**

```bash
docker compose build web
docker compose up -d web
```

确认 `http://localhost:5173` 可访问，浏览器窄屏尺寸下没有横向滚动条。

- [ ] **步骤 4：同步 CodeGraph 并检查工作树**

```bash
codegraph sync .
codegraph status .
git diff --check
git status --short
```

预期：CodeGraph 显示索引最新，差异无空白错误。

- [ ] **步骤 5：Commit**

```bash
git add apps/web/src apps/web/test
git commit -m "feat: beautify cultivation game interface"
```
