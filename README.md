# pj_template-ui（ElementAdmin v3 管理后台前端）

> 基于 **ElementAdmin v3 / vue-element-plus-admin**（Vue 3 + Element Plus + TypeScript + Vite 的 pnpm monorepo）二次开发的管理后台前端，已适配真实后端 **[pj_template](../pj_template)**（Spring Boot，端口 8091）：登录/双 Token、后端菜单驱动的动态路由、按钮级权限、用户/角色/菜单管理页均已接通，**不再使用 Mock**。
>
> ⚠️ 前后端联调/启动/账号/接口契约请先读 **[README-前后端联调适配.md](./README-前后端联调适配.md)**；本文件讲“仓库结构 + 重要文件 + 开发规范”。

---

## 目录

- [技术栈与版本](#技术栈与版本)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [仓库结构总览](#仓库结构总览)
- [根目录文件是干嘛的？（含一堆 .json）](#根目录文件是干嘛的含一堆-json)
- [主应用 apps/admin 结构](#主应用-appsadmin-结构)
- [核心机制](#核心机制)
- [共享包 packages](#共享包-packages)
- [后续开发规范](#后续开发规范)
- [常见问题 FAQ](#常见问题-faq)

---

## 技术栈与版本

| 类别 | 选型 | 说明 |
| --- | --- | --- |
| 语言/框架 | Vue 3.5、TypeScript 6 | TypeScript 走 pnpm catalog 统一版本 |
| 构建 | Vite 8（rolldown 内核） | 构建产物极快 |
| UI | Element Plus 2.14 | 组件**按需显式引入**（不全局注册） |
| 路由 | Vue Router 5 | hash 模式，业务路由全部由后端菜单下发 |
| 状态 | Pinia 4 | 配合 pinia-plugin-persistedstate 持久化会话 |
| 国际化 | Vue I18n 11 | `src/locales` 按需编译 |
| 样式 | UnoCSS + Less | 工具类 + `<style lang="less" scoped>` |
| 请求 | Axios（@vea/request 封装） | 统一 R{code,msg,data} 契约 |
| 文档 | VitePress 1（apps/docs） | 独立文档站（本仓库已简化使用） |
| 质量 | Oxlint / Prettier / Stylelint | 无 Git Hooks，手动执行 `pnpm lint` / `pnpm format:check` / `pnpm style:check` / `pnpm typecheck` |
| 版本/发布 | pnpm workspace catalog + release-please | 依 Conventional Commits 生成 CHANGELOG |

> Node 要求：`^20.19 || ^22.13 || >=24`（仓库 `.node-version` 建议 22.19.0）；pnpm `>=9.5`（仓库锁定 `pnpm@9.15.3`）。

---

## 快速开始

前置：MySQL、Redis 与后端服务已按联调文档启动。

```bash
# 1) 安装依赖（首次）
pnpm install

# 2) 启动管理后台开发服务器（默认 http://localhost:4000）
pnpm dev:admin
# 或等价：pnpm --filter @vea/admin dev

# 3) 打包（mode=pro，输出 dist-pro/）
pnpm build:admin
```

浏览器打开 `http://localhost:4000`，默认账号 **admin / 123456**（后端启动时自动创建，登录后建议尽快在右上角“修改密码”处更换）。

> 若 4000 被占用（Vite 会自动顺延端口），或想固定端口：
> `pnpm dev:admin -- --port 5173`。注意本机个别软件（如 QQ）会占用 127.0.0.1:4001，撞上就换端口。

---

## 常用命令

根目录 `package.json` 的 scripts 全部命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev:admin` | 启动 Admin 开发服务器（端口 4000，`/api` 代理到 8091 后端） |
| `pnpm build:admin` | Admin 生产构建（`--mode pro`，输出 `apps/admin/dist-pro/`） |
| `pnpm build:admin:dev` / `build:admin:test` | 分别按 `dev` / `test` 环境变量构建 |
| `pnpm preview:admin` | 本地预览生产构建产物 |
| `pnpm typecheck:admin` | 仅对 Admin 做 vue-tsc 类型检查 |
| `pnpm typecheck` | 对 Admin + @vea/* 全部包类型检查 |
| `pnpm dev:docs` / `build:docs` / `preview:docs` | VitePress 文档站（端口 4002） |
| `pnpm lint` / `lint:fix` | Oxlint 全仓检查 / 自动修复 |
| `pnpm format:check` / `lint:format` | Prettier 校验 / 全仓格式化 |
| `pnpm style:check` / `lint:style` | Stylelint 校验 / 修复 |
| `pnpm clean` / `clean:cache` | 清理 node_modules / 缓存 |
| `pnpm i` | 等价 `pnpm install` |

单包运行/测试：

```bash
pnpm --filter @vea/hooks test
pnpm --filter @vea/request test
```

---

## 仓库结构总览

```text
pj_template-ui/
├─ apps/                      # 可运行的应用
│  ├─ admin/                  # ★ 主管理后台（业务都在这）
│  └─ docs/                   # VitePress 文档站（可选，与业务无关）
├─ packages/                  # 与业务无关的共享源码包（由应用直接编译）
│  ├─ components/             # @vea/components：Icon/图标注册、LocaleDropdown、ThemeSwitch
│  ├─ hooks/                  # @vea/hooks：useCrud（列表 CRUD 状态）、useForm/required
│  ├─ request/                # @vea/request：createRequest（Axios 封装，带取消/拦截钩子）
│  └─ styles/                 # @vea/styles：全局 reset 与主题 CSS 变量
├─ .vscode/ .idea/            # 编辑器配置（非工程逻辑）
├─ node_modules/              # pnpm 安装产物（勿手改；pnpm-lock.yaml 负责锁定）
├─ package.json               # 根工程：workspace 脚本 + engines + packageManager
├─ pnpm-workspace.yaml        # workspace 声明 + catalog（统一依赖版本）
├─ pnpm-lock.yaml             # 依赖锁定文件（勿手改，由 pnpm install 维护）
└─ README*.md                 # 说明文档（本文件 + 联调适配文档）
```

> `packages/*` 是**源码工作区包**（`workspace:*` 引入），不是预构建 npm 包：Vite 应用会直接编译它们的 TS/Vue 源码，改 `packages` 里的代码无需先 build。

---

## 根目录文件是干嘛的？（含一堆 .json）

你看到的“很多 .json / .config”绝大多数是**工程工具配置**，开发中通常**不需要手改**，看懂即可。

### 1) 依赖与版本

| 文件 | 作用 | 备注 |
| --- | --- | --- |
| `package.json` | 根工程：所有脚本（scripts）、Node/pnpm 版本要求（engines）、packageManager | 与 apps/*/package.json、packages/*/package.json 一起构成各包清单 |
| `pnpm-workspace.yaml` | 声明 monorepo 成员（`apps/*`、`packages/*`）+ **catalog 目录** | catalog 是“依赖版本唯一来源”：`element-plus`、`vue`、`typescript`、`rimraf` 用 `catalog:` 引用，改版本只改这里 |
| `pnpm-lock.yaml` | 依赖树锁定文件 | ⛔ 永远不要手改，由 `pnpm install` 维护 |
| `.npmrc` | pnpm 全局配置 | 当前仅 `auto-install-peers=false`（不自动装 peer 依赖） |
| `.node-version` | 推荐 Node 版本（22.19.0） | 供 nvm/fnm 等工具读取 |

### 2) 代码质量工具（Lint/格式/样式）

| 文件 | 工具 | 作用 |
| --- | --- | --- |
| `.oxlintrc.json` | Oxlint | JS/TS/Vue 快速检查：`correctness` 提为 error；关闭无伤大雅的规则（如 no-explicit-any 仅 warn 级别处理）；忽略 node_modules/dist |
| `.prettierrc.json` | Prettier | 统一格式化：**无分号、单引号、行宽 100、2 空格、去尾逗号** |
| `.prettierignore` | Prettier | 不参与格式化的路径 |
| `.stylelintrc.json` | Stylelint | 校验 less/scss/css/vue/html 样式写法，兼容 `:deep`、less 指令与 rpx 单位 |
| `.stylelintignore` | Stylelint | 不参与样式检查的路径 |
| `.postcssrc.json` | PostCSS | 目前仅启用 autoprefixer |

> 项目**未配置 Git Hooks**（无 Husky / lint-staged / Commitlint）。代码检查与格式化需要手动执行：`pnpm lint`、`pnpm format:check`、`pnpm style:check`、`pnpm typecheck`。

### 3) 构建 / 发布 / 兼容性

| 文件 | 作用 |
| --- | --- |
| `apps/admin/vite.config.ts` | Admin 构建配置：别名 `@/`→src、`/api` dev 代理 → 127.0.0.1:8091（剥 `/api` 前缀）、Vue/JSX、unplugin-element-plus（按需样式）、vue-i18n 资源插件、UnoCSS |
| `apps/admin/uno.config.ts` | UnoCSS（原子类）配置 |
| `apps/admin/.env.base` / `.env.dev` / `.env.pro` / `.env.test` | 环境变量：见下表 |
| `.browserslistrc` | 浏览器兼容范围（Chrome>31/FF>31/IE≥11 等，影响 css 前缀等） |
| `apps/admin/index.html` | SPA 入口 HTML |
| `.release-please-config.json` | release-please 发版配置（根据 Conventional Commits 生成 CHANGELOG、打 tag） |
| `.release-please-manifest.json` | release-please 当前版本记录（仓库根 "." 版本 3.1.0） |
| `CHANGELOG.md` | 变更日志（release-please/手动生成） |
| `LICENSE` | MIT 协议 |

`apps/admin/.env*` 变量含义：

| 变量 | 含义 |
| --- | --- |
| `VITE_API_BASE_PATH` | 接口前缀（默认空；接口 URL 自带 `/api` 前缀经代理转发） |
| `VITE_BASE_PATH` | 资源 base 路径（构建部署到子路径时改这里） |
| `VITE_APP_TITLE` | 浏览器标题/品牌名 |
| `VITE_SOURCEMAP` | 是否产出 sourcemap |
| `VITE_OUT_DIR` | 构建输出目录（pro→`dist-pro`，dev/test 各自目录） |
| `VITE_USE_CSS_SPLIT` | 是否切割 CSS |

> Vite 模式：`dev` 脚本用 `--mode base`（读 `.env.base`）；`build` 用 `--mode pro`，依此类推。新增自定义 `VITE_*` 变量时，记得在 `apps/admin/types/env.d.ts` 里补类型声明。

### 4) 编辑器 / 忽略清单

| 文件 | 作用 |
| --- | --- |
| `.gitignore` | Git 忽略（node_modules、dist*、日志、.idea 私有配置等） |
| `.vscode/` `.idea/` | 各自编辑器的推荐配置/工作区文件 |

---

## 主应用 apps/admin 结构

```text
apps/admin/
├─ public/                # 静态资源（logo 等）
├─ src/
│  ├─ main.ts             # 应用入口：store → 权限守卫注册 → i18n → 全局组件 → ElementPlus → router → mount
│  ├─ App.vue             # 根组件（含 ElConfigProvider、主题与 keep-alive）
│  ├─ permission.ts       # ★ 路由守卫：拉取 用户信息/菜单/权限码 → addRoute；未登录跳 /login
│  ├─ api/                # ★ 后端接口模块
│  │  ├─ login/           #   登录/登出/注册/改密/me/菜单树/权限码
│  │  └─ system/          #   系统管理：types(公共类型+查询体构造) user/role/menu
│  ├─ request/index.ts    # ★ 请求封装：Bearer 头、R{code,msg,data} 解析、401/1101x 自动刷新重试
│  ├─ router/index.ts     # 静态路由壳（/、/redirect、/login、/404、兜底）
│  ├─ store/
│  │  ├─ index.ts         #   pinia 实例
│  │  └─ modules/         #   app(主题/折叠/加载) locale permission(路由表+权限码) tagsView user(会话) 
│  ├─ utils/
│  │  ├─ routerHelper.ts  #   Layout 与 #/## 语义、动态组件加载（glob ../views/**）
│  │  └─ menuToRoutes.ts  # ★ 后端菜单树 → vue-router 路由记录（顶层保留 /）
│  ├─ icons.ts            # ★ 图标注册表（@iconify/vue/offline；支持别名与 mdi:xxx）
│  ├─ components/         # 项目级 UI 组件（ContentWrap/UserInfo/Menu/TagsView/Breadcrumb/…）
│  ├─ layout/             # 布局（Layout.vue 及 AppView/ToolHeader/PrimaryNav/LayoutSwitcher 等）
│  ├─ views/              # ★ 页面：Login/Error/Redirect + Dashboard(工作台) + system/{user,role,menu}
│  ├─ locales/            # zh-CN / en 文案（vue-i18n）
│  ├─ plugins/            # elementPlus(仅注册 ElLoading)、vueI18n
│  ├─ hooks/              # useLocale / useTheme / useTitle
│  ├─ config/             # app.ts(标题等) / locale.ts
│  ├─ constants/index.ts  # 请求成功码、超时、路由白名单等
│  └─ assets/             # imgs / svgs
├─ types/                 # 全局类型：router.d.ts(路由 meta/自定义路由)、env.d.ts(import.meta.env)
├─ .env.*                 # 环境变量
├─ tsconfig.json          # TS 配置（vue-tsc 用）
├─ uno.config.ts          # UnoCSS
└─ vite.config.ts         # 构建/开发代理
```

### 关键目录开发约定（重要）

- **页面一律放 `src/views/<模块>/<页面>/index.vue`**；后端菜单记录里 `component` 字段填 `views/<模块>/<页面>/index`（不带 `.vue`、不带 `views` 前缀），前端由 `menuToRoutes` + `routerHelper` 动态加载。静态业务路由**不要**写在 `router/index.ts`（只放登录/404/重定向壳）。
- **接口模块一律放 `src/api/<模块>/`**，URL 形如 `/api/xxx`，统一走 `@/request`。
- **Element Plus 组件必须显式 import**（本模板不全局注册），参考 `views/Login/components/LoginForm.vue` 或 `views/system/user/index.vue` 的写法；只 import 用到的组件即可。
- **页面用到的图标要先在 `icons.ts` 注册**（离线 Iconify，无 CDN）；支持注册“别名”（如 `user`、`role`、`menu`）与 `mdi:xxx` 两种写法。

---

## 核心机制

### 1) 认证与会话（双 Token）
- 后端签发 `accessToken + refreshToken`；前端存 Pinia 并持久化到 localStorage（key `vea-session-v1`）。
- 每个请求带 `Authorization: Bearer <accessToken>`。
- 响应业务码命中 token 失效集合（11011/11012/11013/11014/11017 或 HTTP 401）时，`src/request/index.ts` 会**单飞静默刷新**（refreshToken 轮换）后重试一次；仍失败则清会话回登录页。
- 登出调用 `/auth/logout` 撤销后端 token；修改密码成功后后端撤销该用户全部 token（需重新登录）。

### 2) 后端驱动动态路由（本仓库核心）
- 登录后 `permission.ts` 并行拉取：`/auth/me`（用户信息）、`/auth/menus`（当前用户可见目录/菜单树）、`/auth/permissions`（按钮级权限码）。
- `src/utils/menuToRoutes.ts` 把菜单树转成 ElementAdmin 路由记录（目录→`#` Layout 容器、更深分组→`##`、菜单→`views/...` 页面；顶层路径保留 `/`；自动补 `redirect`），再 `router.addRoute` 注册。
- 前端**只有一份后端下发的路由表**，不维护第二份按角色过滤的路由表：换角色/换权限 → 重登或刷新即生效。

### 3) 按钮级权限
- 权限码经 `/auth/permissions` 写入 `permission` store；页面用 `permissionStore.hasPerm('sys:user:save')` 控制按钮显隐。
- 后端用 `@RequiresPermission` 做二次兜底（超管角色 `admin` 自动放行，否则 611400 无权限）。**前端隐藏只是体验，真正的鉴权在后端。**

### 4) 请求与响应契约
- 统一信封 `R { code, msg, data }`，业务成功 `code=0`；非 0 由请求层弹错（取 `msg`）。
- 分页：`POST /api/sys/xxx/page`，请求体 `{ current, size, conditions:[{field,op,value,value2}], orders:[{field,dir}] }`（字段白名单过滤防注入），响应 `{ records, total, ... }`。新增/修改/删除走 BaseWebController 约定（`save/update/deleteBatch` 等）。

---

## 共享包 packages

| 包 | 内容 | 何时使用 |
| --- | --- | --- |
| `@vea/components` | `Icon`、`registerIcons`、`LocaleDropdown`、`ThemeSwitch` | 全局图标/语言/主题切换 |
| `@vea/hooks` | `useCrud`（列表+增删改查状态机）、`useForm`/`required` | 列表页/表单页可直接复用（本项目页面目前为显式写法，也可迁移使用） |
| `@vea/request` | `createRequest`（Axios 实例 + beforeRequest/transformResponse/onError/取消） | 业务请求封装（`apps/admin/src/request/index.ts` 就是它的消费者） |
| `@vea/styles` | reset 与主题 CSS 变量 | `main.ts` 全局引入 |

> 边界铁律：**packages 内不允许 import 任何 Admin 的业务代码**（store/router/api/views）。只有“业务无关、契约稳定”的能力才下沉到 packages；业务代码一律放 apps/admin。

---

## 后续开发规范

### 新增一个“管理页面 + 后端菜单 + 按钮权限”的完整流程
1. **建页面组件**：`src/views/<module>/<page>/index.vue`（模板参考 `views/system/user/index.vue`）；页面显式 import 用到的 Element Plus 组件；需要操作按钮时用 `permissionStore.hasPerm('sys:xxx:save')` 包裹。
2. **写接口**：`src/api/<module>/xxx.ts` + `types.ts`，函数命名 `xxxApi`，全部走 `@/request`，URL 带 `/api` 前缀。
3. **配置菜单**：在「菜单管理」页面新增目录/菜单/按钮（或后端 `DataInitializer` 加种子），菜单 `component` 填 `views/<module>/<page>/index`，按钮填 `permCode`（如 `sys:user:save`）。
4. **授权**：在「角色管理」把菜单/按钮授权给角色；admin 角色自动拥有全部。
5. **验证**：刷新页面看到动态路由与按钮权限生效；用非 admin 账号验证越权接口被后端 611400 拒绝。

### 编码约定
- **命名**：目录/文件小写（`views/system/user`），组件文件 PascalCase（`.vue`）或 kebab 目录内 `index.vue`；函数用 `camelCase`，接口模块统一 `xxxApi` 后缀，Store 用 `useXxxStore`，页面外用 `useXxxStoreWithOut`。
- **请求**：禁止绕过 `@/request` 直接 new Axios；禁止在前端拼接/信任后端返回的排序条件之外的自定义查询（后端有白名单）。
- **类型**：接口出入参与后端实体对齐（`api/system/types.ts` 为样例）；尽量少用 `any`（虽未开启强 lint 报错）。
- **样式**：默认 `<style lang="less" scoped>`；优先取 CSS 变量（`var(--el-*)` 与 `@vea/styles` 主题变量）；需要 unocss 工具类直接写在 class 上；改动后跑 `pnpm style:check`。
- **国际化**：静态文案建议进 `locales/{zh-CN,en}.ts` 用 key 引用；后端下发的菜单名等动态文案直接用中文（缺失 key 时 i18n 原样回显）。
- **提交信息**：仍按 Conventional Commits 书写（release-please 依赖它生成 CHANGELOG 与版本号），例如 `feat: 新增用户管理页面`。项目没有 Git Hooks，提交前请自行跑 `pnpm typecheck` + `pnpm lint`。
- **不要提交**：`node_modules/`、`dist*`、本地密钥/环境差异内容。

### 环境与发布
- 改接口代理/端口 → `vite.config.ts`；改业务环境变量 → `.env.*`（并同步 `types/env.d.ts`）。
- 生产部署：把 `apps/admin` 构建产物托管，并在网关将 `/api` 反代到后端 8091（参考联调文档）；后端生产务必改 `mikuyun.jwt.key`。

### 待办清理（可选，不影响运行）
- `apps/admin/package.json` 中 `echarts`、`mockjs`、`vite-plugin-mock` 已不再被代码引用（Mock 已整体移除），可按需 `pnpm remove` 并更新 lockfile。

---

## 常见问题 FAQ

| 现象 | 原因/处理 |
| --- | --- |
| 登录成功但停在登录页 | 旧版有“顶层路由丢 `/`”的 bug 已修复；仍复现请强刷（Ctrl+F5）清旧模块缓存 |
| 登录后侧边栏空白 | 后端未启动/菜单未授权：检查 `/auth/menus` 返回；给角色在「角色管理」授权 |
| 新菜单图标不显示 | 图标名没在 `src/icons.ts` 注册（离线 Iconify 不联网） |
| el-xxx 组件不生效/告警 Failed to resolve component | 页面忘了显式 import Element Plus 组件 |
| 改完接口地址没生效 | `vite.config.ts` 代理改动需重启 dev |
| 端口被占（4000/4001） | QQ 等软件会占 127.0.0.1:4001；用 `pnpm dev:admin -- --port 5173` 换端口 |
| 想开 Mock 演示 | 本仓库已删除全部 Mock，业务直连后端；如需纯前端演示另建分支 |

---

## 相关文档
- [README-前后端联调适配.md](./README-前后端联调适配.md)：启动步骤、接口契约、验证证据与已知边界（先读这份再联调）。
- `apps/admin/src/views/system/*`、`apps/admin/src/utils/menuToRoutes.ts`、`apps/admin/src/request/index.ts`：理解机制的最佳示例代码。
