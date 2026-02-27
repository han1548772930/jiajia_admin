# Workflow 表单设计器与回显改进清单

> 范围：`apps/web-antdv-next/src/views/workflow/form-designer`、`apps/web-antdv-next/src/views/workflow/form-preview`  
> 更新时间：2026-02-20

## 基础约束（必读）

- 所有新增/修改文件统一使用 UTF-8 编码（无 BOM）。
- 避免使用 PowerShell 直接写入中文内容（易受代码页影响导致乱码）；优先使用编辑器或 `apply_patch` 修改文件。
- 当前阶段暂无后端支持时，后端相关功能先以 Mock、本地数据或假接口模拟实现，确保前端流程可联调、可验收。
- 组件能力、组件参数与交互约束优先参考 `apps/web-antdv-next/llms.txt`，实现前先对照该文档。

## P0（优先补齐）

- [ ] 服务端持久化替代 `localStorage`
- [ ] 设计器 schema 版本治理（草稿、发布、回滚）
- [ ] 字段权限模型（可见/可编辑/只读）
- [ ] 回显端支持权限渲染（按角色/节点/状态）
- [x] `manual` 数据源模式提供可操作触发入口

## P1（体验增强）

- [x] 表达式可视化配置器（替代纯 JSON 文本输入）
- [x] 校验规则可视化配置器（增删改规则、预览错误）
- [x] 联动规则可视化配置器（依赖图、循环提示）
- [x] 表格布局增强（列类型、列级校验、非 Input 渲染）
- [x] 克隆交互优化（按钮/快捷键/提示一致性）
- [x] 文案 i18n 化收口（移除硬编码提示）

## P2（质量与平台化）

- [x] 设计器与回显关键链路集成测试
- [x] E2E 场景测试（导入、联动、预览保存、回放）
- [x] 失败场景可观测性（数据源请求失败、表达式错误）
- [x] 性能基线（大表单字段数、深层嵌套、大选项集）

## 逐项验收标准

- [ ] 持久化：跨浏览器/跨账号可读写；支持历史版本查询
- [ ] 权限：同一 schema 在不同角色下渲染差异符合预期
- [x] manual 模式：用户可主动触发且支持 loading/重试
- [x] 可视化配置：不写 JSON 也能完成 80% 常见规则
- [x] 表格增强：每列可配置组件类型与校验规则
- [x] i18n：中英文切换无硬编码残留
- [x] 测试：关键路径失败率可被自动测试拦截

> 说明：当前已补齐 Vitest 场景链路测试；真实浏览器端 Playwright E2E 可在下一阶段补齐。

## 关联文件（实施时重点关注）

- `apps/web-antdv-next/src/store/workflow/form-designer.ts`
- `apps/web-antdv-next/src/views/workflow/form-designer/index.vue`
- `apps/web-antdv-next/src/views/workflow/form-designer/components/PropsPanel.vue`
- `apps/web-antdv-next/src/views/workflow/form-preview/index.vue`
- `apps/web-antdv-next/src/views/workflow/form-preview/components/PreviewFieldItem.vue`
- `apps/web-antdv-next/src/views/workflow/form-preview/components/PreviewNodeItem.vue`
- `apps/web-antdv-next/src/locales/langs/zh-CN/workflow.json`
- `apps/web-antdv-next/src/locales/langs/en-US/workflow.json`
