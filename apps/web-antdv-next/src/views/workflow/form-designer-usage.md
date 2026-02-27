# Workflow 表单设计器使用说明（用户视角）

> 适用范围：`apps/web-antdv-next/src/views/workflow`  
> 更新日期：2026-02-20

## 1. 这份文档适合谁

如果你是流程管理员、业务配置人员、前端联调人员，这份文档能帮你完成：

1. 从 0 搭建可用表单（字段、布局、规则、联动、动态数据源）。
2. 在预览页验证真实填写体验（含表格行编辑、联动拉取、校验拦截）。
3. 保存并回放表单记录，支持验收与回归。
4. 通过 JSON 导入/导出做备份、迁移和协作。

## 2. 入口与页面

常用入口如下：

1. 模板管理：`/workflow/process-management/template`
2. 表单设计器：`/workflow/designer/form`
3. 表单预览：`/workflow/designer/form-preview`
4. 已保存表单：`/workflow/designer/form-saved`

## 3. 快速上手（3 分钟）

1. 打开 `流程中心 -> 模板管理 -> 表单设计器`。
2. 左侧拖入字段（如输入框、下拉、日期）。
3. 选中字段，在右侧配置 `fieldName`、`label`、`placeholder`、`required`。
4. 点击“进入预览”，填写后点击“保存数据”。
5. 返回设计器点击“保存”，再到“已保存表单”查看或回放。

## 4. 设计器页面说明

设计器采用三栏结构：

1. 左侧：组件库 + 结构树
2. 中间：画布
3. 右侧：属性面板

顶部常用操作：

1. 导入 JSON
2. 导出内部 Schema
3. 导出 Runtime Config
4. 导出 JSON Schema
5. 克隆
6. 撤销 / 重做 / 重置
7. 已保存表单
8. 进入预览
9. 保存

## 5. 组件能力

### 5.1 字段组件

1. 基础：Input、Textarea、InputNumber、Slider
2. 选择：Select、AutoComplete、Cascader、TreeSelect、Radio、Checkbox、Switch、Segmented
3. 时间：DatePicker、TimePicker
4. 高级：Rate、ColorPicker、Mentions、Upload

### 5.2 布局组件

1. Section（分组容器）
2. Grid（两列/三列）
3. Divider（分割线）
4. Table（表格布局）

## 6. 字段核心配置

### 6.1 基础信息

建议每个字段至少配置：

1. `fieldName`：必须唯一，后续表达式/联动都依赖它
2. `label`：用户看到的显示名
3. `defaultValue`：预览默认值
4. `placeholder`：输入提示

### 6.2 显示/必填表达式（可视化）

支持两类表达式：

1. `visibleExpression`
2. `requiredExpression`

支持：

1. AND / OR 条件组
2. 运算符：`===`、`!==`、`>`、`>=`、`<`、`<=`、`contains`、`isTrue`、`isFalse`
3. 字段引用：`$field_xxx` 或 `$field.xxx`

示例：

```txt
$field_userType === 'internal'
$field_amount > 1000 && $field_needInvoice === true
```

### 6.3 校验规则（可视化）

支持规则类型：

1. `minLength`
2. `maxLength`
3. `pattern`
4. `custom`（同步校验器）
5. `async`（异步校验器）

示例：

```json
[
  { "type": "minLength", "value": 2, "message": "至少 2 个字符" },
  { "type": "custom", "value": "custom.noWhitespace" },
  { "type": "async", "value": "mock.uniqueCode", "trigger": "submit" }
]
```

## 7. 数据源与联动

### 7.1 数据源模式

1. `sourceType=static`：静态选项
2. `sourceType=api`：动态接口

API 模式：

1. `apiMode=registry`：选择 `apiKey`（推荐）
2. `apiMode=custom`：填写 `apiUrl` 或使用 `presetKey`

内置 `apiKey`：

1. `mock.cities`
2. `workflow.departments`
3. `workflow.templates`
4. `workflow.templateCategories`
5. `workflow.usersByDept`

请求触发方式：

1. `onInit`
2. `onFocus`
3. `onSearch`
4. `manual`（预览页显示“手动加载”按钮）

右侧属性面板支持“测试加载”，可先在设计态验证配置是否可用。

### 7.2 联动配置

关键项：

1. `dependsOn`
2. `paramMap`
3. `clearWhenParentChange`
4. `refetchWhenParentChange`
5. `disableWhenMissingDeps`

同时支持依赖关系图，便于排查：

1. 当前字段依赖谁
2. 当前字段会影响谁
3. 是否存在循环依赖

### 7.3 示例一：部门 -> 用户联动下拉

```json
{
  "fieldName": "userId",
  "component": "Select",
  "dataSource": {
    "sourceType": "api",
    "apiMode": "registry",
    "apiKey": "workflow.usersByDept",
    "method": "GET",
    "requestMode": "onFocus",
    "labelKey": "Name",
    "valueKey": "Sysid"
  },
  "linkage": {
    "dependsOn": ["deptId"],
    "paramMap": {
      "deptId": "$field_deptId"
    },
    "clearWhenParentChange": true,
    "refetchWhenParentChange": true,
    "disableWhenMissingDeps": true
  }
}
```

### 7.4 示例二：分类 + 关键词动态搜索模板

```json
{
  "fieldName": "templateId",
  "component": "Select",
  "dataSource": {
    "sourceType": "api",
    "apiMode": "registry",
    "apiKey": "workflow.templates",
    "method": "GET",
    "requestMode": "onSearch",
    "labelKey": "Name",
    "valueKey": "Sysid",
    "cache": false,
    "debounceMs": 300
  },
  "linkage": {
    "dependsOn": ["categoryId", "keyword"],
    "paramMap": {
      "categoryId": "$field_categoryId",
      "keyword": "$field_keyword"
    },
    "clearWhenParentChange": true,
    "refetchWhenParentChange": true
  }
}
```

### 7.5 示例三：自定义 API + 预设复用

预设中心先维护：

```json
[
  {
    "key": "employee.api",
    "label": "员工接口",
    "url": "/api/hr/employee/query",
    "method": "POST",
    "headers": {
      "X-Tenant-Id": "nmc"
    }
  }
]
```

字段配置：

```json
{
  "fieldName": "employeeId",
  "component": "Select",
  "dataSource": {
    "sourceType": "api",
    "apiMode": "custom",
    "presetKey": "employee.api",
    "requestMode": "onSearch",
    "dataPath": "data.list",
    "labelKey": "realName",
    "valueKey": "id",
    "cache": true
  }
}
```

## 8. 动态 API 字段要求（完整）

这一节是前后端联调最关键内容。

### 8.1 字段侧硬性要求（必须满足）

1. 组件必须支持数据源  
可用：`Select`、`AutoComplete`、`Cascader`、`TreeSelect`、`CheckboxGroup`、`RadioGroup`、`Segmented`。
2. `dataSource.sourceType` 必须为 `api`。
3. 必须有请求目标  
`apiMode=registry` 时配置 `apiKey`；`apiMode=custom` 时配置 `apiUrl`（或 `presetKey` 可解析成 url）。
4. 返回数据必须能映射为选项  
普通选项至少能得到 `label/value`；树形选项要能解析 `children`。

### 8.2 字段侧推荐配置（强烈建议）

1. `method`：`GET` 或 `POST`
2. `requestMode`：`onInit` / `onFocus` / `onSearch` / `manual`
3. `labelKey`、`valueKey`
4. `dataPath`（接口返回非数组时使用）
5. `baseParams`（固定参数）
6. `headers`（仅 custom 模式）
7. `cache`、`debounceMs`
8. `allowEmpty`（false 时，返回空列表会抛错）

### 8.3 联动参数规则

`linkage.paramMap` 支持值：

1. `$field_xxx`
2. `$field.xxx`
3. `$keyword`
4. 普通常量

说明：

1. `paramMap` 先组装参数。
2. `dependsOn` 字段会自动补入同名参数（若未在 `paramMap` 显式设置）。
3. 若 `dependsOn` 缺值，且 `disableWhenMissingDeps=true`，字段会禁用。

### 8.4 请求触发行为

1. `onInit`：组件初始化时请求
2. `onFocus`：组件聚焦时请求
3. `onSearch`：搜索关键词变化时请求（受 `debounceMs` 影响）
4. `manual`：仅点击“手动加载”按钮时请求

### 8.5 后端返回结构要求

普通选项（Select/RadioGroup/CheckboxGroup/Segmented/AutoComplete）建议返回：

```json
[
  { "label": "张三", "value": "u_1" },
  { "label": "李四", "value": "u_2" }
]
```

如果你返回的是业务字段，配置 `labelKey/valueKey` 即可，例如：

```json
[
  { "Name": "张三", "Sysid": 1001 },
  { "Name": "李四", "Sysid": 1002 }
]
```

树形选项（TreeSelect/Cascader）建议返回：

```json
[
  {
    "label": "总部",
    "value": "d_root",
    "children": [
      { "label": "研发部", "value": "d_rd", "isLeaf": true }
    ]
  }
]
```

如果嵌套字段不是默认命名，配置：

1. `childrenKey`
2. `leafKey`

### 8.6 dataPath 使用规则

当后端返回不是“直接数组”时，必须配置 `dataPath`。例如：

后端返回：

```json
{
  "code": 0,
  "data": {
    "list": [
      { "Name": "张三", "Sysid": 1001 }
    ]
  }
}
```

字段配置应包含：

1. `dataPath: "data.list"`
2. `labelKey: "Name"`
3. `valueKey: "Sysid"`

### 8.7 GET / POST 约定

1. `GET`：参数以 query 方式发送。
2. `POST`：参数放在 body。
3. `headers` 仅在 custom 接口模式下生效。

### 8.8 最小可用字段模板（可直接复制）

```json
{
  "fieldName": "userId",
  "component": "Select",
  "dataSource": {
    "sourceType": "api",
    "apiMode": "registry",
    "apiKey": "workflow.usersByDept",
    "method": "GET",
    "requestMode": "onFocus",
    "labelKey": "Name",
    "valueKey": "Sysid",
    "dataPath": "",
    "cache": true,
    "debounceMs": 300,
    "allowEmpty": true
  },
  "linkage": {
    "dependsOn": ["deptId"],
    "paramMap": {
      "deptId": "$field_deptId",
      "keyword": "$keyword"
    },
    "clearWhenParentChange": true,
    "refetchWhenParentChange": true,
    "disableWhenMissingDeps": true
  }
}
```

### 8.9 排错清单（动态 API 专项）

1. 没发请求：检查 `sourceType` 是否为 `api`，以及 `requestMode` 是否匹配触发动作。
2. 返回有数据但下拉空白：检查 `labelKey/valueKey` 是否正确。
3. 返回结构有包裹：补 `dataPath`。
4. 联动不生效：检查 `dependsOn` 与上游 `fieldName` 是否一字不差。
5. 依赖字段有值但仍禁用：检查 `disableWhenMissingDeps` 与依赖值是否为空串/空数组。
6. 搜索不触发：确认 `requestMode=onSearch`，并检查组件是否支持搜索。
7. manual 无按钮：确认 `requestMode=manual` 且处于预览页。
8. 空结果被判失败：把 `allowEmpty` 设为 `true` 或调整后端返回。

## 9. 表格布局增强（重点）

表格列可单独配置：

1. `component`：`Input` / `InputNumber` / `Select` / `Switch`
2. `dataIndex`
3. `placeholder`
4. `width`
5. `required`
6. `options`（Select 列）
7. `validationRules`（列级校验）

预览页保存时会执行表格列校验，失败会拦截保存并提示首条错误。

## 10. 预览、保存与回放

### 10.1 预览页会真实执行

1. 显示/必填表达式
2. 字段校验规则
3. 动态数据源触发与联动
4. 表格行编辑与列级校验

### 10.2 保存数据

点击“保存数据”后会：

1. 校验字段 + 表格
2. 写回设计器状态并持久化

### 10.3 已保存表单

`/workflow/designer/form-saved` 支持：

1. 搜索记录
2. 回放预览（带 `recordId`）
3. 打开设计器继续编辑
4. 删除记录

## 11. 导入与导出（4 个 JSON 按钮）

### 11.1 导入 JSON

导入目标是“设计器 Schema”，支持两种格式：

1. `{ "schema": {...}, "values": {...} }`
2. 直接 schema 对象（含 `nodes`，也兼容旧版 `fields`）

建议优先导入“导出内部 Schema”得到的 JSON，兼容性最好。

### 11.2 导出内部 Schema

定位：完整备份 / 迁移 / 继续在设计器编辑。  
内容：`schema`、`schemaVersion`、`exportedAt`。

### 11.3 导出 Runtime Config

定位：给运行时渲染或后端消费。  
内容：`form` + `fields` + `schemaVersion`，结构更偏运行期。

### 11.4 导出 JSON Schema

定位：值结构约束、接口校验、文档说明。  
内容：标准 JSON Schema（draft 2020-12），描述字段类型、required、默认值、标题说明。

### 11.5 四个按钮如何选

1. 要回到设计器继续改：用“导出内部 Schema”+“导入 JSON”
2. 要给运行时引擎：用“导出 Runtime Config”
3. 要给后端做参数校验：用“导出 JSON Schema”

## 12. 快捷键

1. `Ctrl/Cmd + D`：克隆选中节点
2. `Ctrl/Cmd + Z`：撤销
3. `Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z`：重做
4. `Delete / Backspace`：删除选中节点（输入中不触发）

## 13. 性能与测试（当前基线）

已覆盖测试：

1. E2E-like 场景：导入 -> 联动参数 -> 预览保存 -> 回放
2. 性能基线：大字段数、深层嵌套、大选项集

本地复现命令：

```bash
pnpm vitest run --dom apps/web-antdv-next/src/store/workflow/form-designer.performance-baseline.test.ts apps/web-antdv-next/src/store/workflow/form-designer.e2e-scenarios.test.ts
```

当前基线阈值（测试断言）：

1. 300 字段导入与索引：`< 4000ms`
2. 12 层深嵌套递归移除：`< 3000ms`
3. 3000 选项映射：`< 4000ms`

## 14. 常见问题排查

1. 预览没有内容：检查 `schema.nodes` 是否为空。
2. 动态下拉无数据：检查 `sourceType`、`apiMode`、`apiKey/apiUrl`、`labelKey/valueKey`、`dataPath`。
3. 联动不生效：检查 `dependsOn` 与上游 `fieldName` 是否一致。
4. `manual` 无法触发：确认 `requestMode=manual`，并在预览点击“手动加载”。
5. 导入失败：先检查 JSON 语法，再检查字段唯一性与必填结构。
6. 表格列错位：修改 `dataIndex` 后需确认行数据同步。

## 15. 当前边界与存储键

当前仍为前端本地持久化，不依赖后端数据库：

1. 设计数据：`workflow_form_designer_data_v1`
2. 保存记录：`workflow_form_designer_records_v1`
3. 诊断日志：`workflow_form_diagnostics_v1`

补充说明：

1. “保存”是保存设计与记录，不等同于后端发布模板。
2. 清理浏览器缓存会丢失本地记录，建议定期导出 JSON 备份。
3. 当前无后端时，建议优先使用 `mock.cities`、本地预设和假接口完成联调验收。

## 16. ApiResponse 结构对接（你当前项目）

你当前后端通用返回是：

```ts
interface ApiResponse<T = unknown> {
  Success: boolean;
  Code: number;
  Message: string;
  Data: T;
  Extras: unknown;
  Timestamp: number;
}
```

动态 API 字段对接时，重点是把选项数组定位到 `Data`。

### 16.1 字段怎么配

如果接口返回 `ApiResponse<Array<...>>`：

1. `dataPath` 配 `Data`
2. `labelKey` / `valueKey` 按业务字段配置

示例：

```json
{
  "fieldName": "userId",
  "component": "Select",
  "dataSource": {
    "sourceType": "api",
    "apiMode": "custom",
    "apiUrl": "/api/user/list",
    "method": "GET",
    "requestMode": "onFocus",
    "dataPath": "Data",
    "labelKey": "Name",
    "valueKey": "Sysid"
  }
}
```

如果接口返回 `ApiResponse<{ list: Array<...> }>`：

1. `dataPath` 配 `Data.list`

### 16.2 联动参数怎么传

你仍按原规则配：

1. `linkage.dependsOn`
2. `linkage.paramMap`

例如：

```json
{
  "linkage": {
    "dependsOn": ["deptId"],
    "paramMap": {
      "deptId": "$field_deptId",
      "keyword": "$keyword"
    }
  }
}
```

### 16.3 成功/失败语义说明（重要）

1. `registry` 模式下，内置 API 一般会判断 `Success`，失败会抛 `Message`。
2. `custom` 模式下，当前逻辑主要按 `dataPath` 取数据，不会自动按 `Success` 统一拦截。
3. 所以你在 custom 模式建议：
   `Success=false` 时后端返回 HTTP 错误码，或你使用 `adapterKey` 做统一解包与报错。

### 16.4 后端给前端的最小约定

1. 成功时：`Data` 里必须能拿到数组（或可被 `dataPath` 定位到数组）。
2. 列表项里必须包含可映射为 `label/value` 的字段。
3. 树形数据额外提供子节点字段（默认 `children`，可通过 `childrenKey` 改）。
