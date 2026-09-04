# 前后端联调适配说明（pj_template-ui ⇄ pj_template）

> 本工程原为下载的 ElementAdmin v3 模板（vben-element-plus 系），现已完成与后端
> **pj_template**（Java 21 / Spring Boot 3.5 / MyBatis-Plus，端口 8091）的适配：
> 登录鉴权、动态路由（后端菜单驱动）、按钮级权限、系统管理页面全部接通真实后端，
> Mock 已关闭。

## 一、快速启动（联调环境）

前置：MySQL 8（库 `pj_template`，账号 root/mikuyun）、Redis(6379)、Node ≥ 22、pnpm、Java 21、Maven。

```bash
# 1) 初始化数据库(幂等, 会重建 sys_* 表)
mysql -uroot -pmikuyun --host=127.0.0.1 --default-character-set=utf8mb4 -e "source X:/my_project/template_project/pj_template/01_db/init.sql"

# 2) 启动后端(端口 8091; 首次启动自动写入种子: admin/123456 + RBAC 菜单/角色)
cd X:\my_project\template_project\pj_template
mvn -B -DskipTests package
java -jar mikuyun_main\target\mikuyun_main-1.0.0.jar

# 3) 启动前端 dev(端口 4000; /api 代理到 8091)
cd X:\my_project\template_project\pj_template-ui
pnpm install          # 首次
pnpm --filter @vea/admin dev
```

浏览器访问 http://127.0.0.1:4000 ，账号 **admin / 123456**。

> 若 4000 被占用（可能残留旧 dev 进程或本机软件占口），vite 会自动换端口；
> 若 QQ 等软件占用了 4001/某端口，可 `pnpm --filter @vea/admin dev --port 5173` 指定端口。

## 二、认证与动态路由契约

- 统一响应 `R { code, msg, data }`，成功 `code=0`；业务错误取 `msg`。
- 鉴权头：`Authorization: Bearer {accessToken}`；双 token：
  - `POST /api/auth/login` `{username,password}` → `{userId, accessToken, refreshToken, accessExpiresIn, refreshExpiresIn}`
  - `POST /api/auth/refresh` `{refreshToken}`（旧 refresh 一次性轮换）
  - `GET  /api/auth/me`（当前用户信息）
  - `POST /api/auth/logout`、`POST /api/auth/changePassword`、`POST /api/auth/register`
- 动态路由：
  - `GET /api/auth/menus` → 当前用户可见的「目录(type=1)/菜单(type=2)」树（按钮已过滤），
    前端 `src/utils/menuToRoutes.ts` 转换为 ElementAdmin 路由记录并 `addRoute`（组件路径约定 `views/xxx/index`）；
  - `GET /api/auth/permissions` → 权限标识数组（按钮/接口级），写入 permission store，
    页面用 `permissionStore.hasPerm('sys:user:save')` 控制按钮显隐。
- token 失效（HTTP 401 / code 11011~11017）由 `src/request/index.ts` 自动静默刷新并重试一次，
  仍失败则登出回登录页。

## 三、系统管理页面与后端接口

| 页面 | 路径 | 说明 | 后端接口 |
| --- | --- | --- | --- |
| 工作台 | `/dashboard/index` | 首页 | — |
| 用户管理 | `/system/user` | 分页/新增/编辑/删除/分配角色 | `/api/sys/user/*` |
| 角色管理 | `/system/role` | 分页/新增/编辑/删除/分配菜单权限 | `/api/sys/role/*` |
| 菜单管理 | `/system/menu` | 树形维护目录/菜单/按钮 | `/api/sys/menu/*` |
| 通知公告管理 | `/system/notice` | 富文本发布通知/公告(全部/角色/指定用户) + 发送历史 | `/api/notice/*` |

> 实时通知公告：`/notice/send` 成功后向在线接收人 WebSocket(通道 `/ws/notice?token=`)推送 `{type:"NOTICE"}`，
> 前端铃铛角标/抽屉即时刷新；离线用户落库，登录后按未读拉取。接收明细表 `sys_notice_receiver` 记录个人已读状态。

- 通用查询请求体（`POST /sys/xxx/page`）：
  `{current, size, conditions:[{field,op,value,value2}], orders:[{field,dir}]}`
  字段须为实体属性/列名，白名单校验；返回 `{records,total,...}`。
- 权限点：菜单管理里新增按钮级菜单（如 `sys:user:save`）后，把按钮授权给角色，
  前端即自动出现/隐藏对应操作按钮（`hasPerm`），后端切面 `@RequiresPermission` 做二次兜底
  （超级管理员角色 `admin` 自动放行，无权限返回 611400）。

## 四、关键改动文件（摘要）

**后端 `pj_template`**
- `mikuyun_business/.../config/DataInitializer.java`：种子菜单对齐前端路由模型
  （新增工作台目录/菜单、组件路径统一 `views/...`；common 角色默认仅工作台）。
- `mikuyun_business/.../controller/SysUserController.java`：page/list/detail 密码脱敏。

**前端 `pj_template-ui`**
- `apps/admin/src/request/index.ts`：Bearer 头、R{code/msg} 解析、401/1101x 静默刷新+重试。
- `apps/admin/src/api/*`：全部接口按上述契约重写；新增 `api/system/{user,role,menu,types}`。
- `apps/admin/src/utils/menuToRoutes.ts`、`src/permission.ts`、`src/store/modules/permission.ts`：
  后端菜单 → 动态路由 + 权限码。
- `apps/admin/src/icons.ts`：图标注册（后端图标别名 + `mdi:*`）。
- `apps/admin/src/views/Dashboard/index.vue`（工作台）、`views/system/{user,role,menu}/index.vue`：管理页面。
- `apps/admin/src/components/UserInfo/index.vue`：修改密码 + 退出。
- `.env*`、`vite.config.ts`、`src/main.ts`：移除 Mock（viteMockServe 插件、mock 目录、示例页
  `Level`/旧 `Dashboard` 图表页与 `api/dashboard`），dev 代理 `/api` → 8091。

## 五、验证证据（2026-09 会话实测）

- 后端：`mvn -DskipTests package` 成功；8091 启动并自动播种
  （admin 19 条菜单权限、common 仅工作台 2 条；含「通知公告管理」菜单与 `sys:notice:send/list` 权限）。
- 接口链（经 dev 代理 4000 → 8091 实测均 `code=0`）：
  login / me / menus / permissions / sys user page / sys role listAll / sys menu tree / 角色菜单 ids /
  新建用户→分配角色→以该用户登录仅见工作台→越权调 `/sys/user/save` 被拒(611400)；
  给 common 授系统菜单后其动态菜单即时变为 2 个根（验证角色授权即时生效）。
- 前端：`pnpm --filter @vea/admin ts:check` 通过；`pnpm --filter @vea/admin build` 成功。
