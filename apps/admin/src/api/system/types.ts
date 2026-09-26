/** 后端分页结果(MyBatis-Plus Page 序列化) */
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/** 后端统一请求体查询条件 */
export interface QueryCondition {
  field: string
  op:
    | 'eq'
    | 'ne'
    | 'like'
    | 'notLike'
    | 'empty'
    | 'notEmpty'
    | 'gt'
    | 'ge'
    | 'lt'
    | 'le'
    | 'in'
    | 'notIn'
    | 'between'
  value?: unknown
  value2?: unknown
}

export interface QueryOrder {
  field: string
  dir?: 'asc' | 'desc'
}

/** BaseWebController /page /list 请求体 */
export interface QueryBody {
  current: number
  size: number
  conditions?: QueryCondition[]
  orders?: QueryOrder[]
}

/** 系统用户(sys_user) */
export interface SysUserRow {
  id: number
  username: string
  password?: string | null
  nickname?: string | null
  /** 状态: 0正常 1禁用 */
  status?: number
  lastLoginTime?: string | null
  gmtCreated?: string
  gmtModified?: string
}

/** 系统角色(sys_role) */
export interface SysRoleRow {
  id: number
  roleName: string
  roleCode: string
  remark?: string | null
  status?: number
  sortNo?: number
  gmtCreated?: string
}

/** 系统菜单/权限(sys_menu), children 为树 */
export interface SysMenuRow {
  id: number
  parentId: number
  menuName: string
  /** 类型: 1目录 2菜单 3按钮 */
  menuType: 1 | 2 | 3
  path?: string | null
  component?: string | null
  permCode?: string | null
  icon?: string | null
  sortNo?: number
  status?: number
  visible?: number
  gmtCreated?: string
  children?: SysMenuRow[]
}

/** 组装查询条件 */
export const cond = (field: string, op: QueryCondition['op'], value?: unknown): QueryCondition => ({
  field,
  op,
  value
})

export const buildQueryBody = (
  current: number,
  size: number,
  conditions: QueryCondition[] = [],
  orders?: QueryOrder[]
): QueryBody => ({
  current,
  size,
  conditions,
  ...(orders ? { orders } : {})
})

/** 登录日志(sys_login_log) */
export interface SysLoginLogRow {
  id: number
  username?: string
  userId?: number | null
  ip?: string | null
  userAgent?: string | null
  /** 结果: 0成功 1失败 */
  success?: number
  message?: string | null
  loginTime?: string
  gmtCreated?: string
}

/** 在线用户(Redis accessToken 会话聚合) */
export interface OnlineUserRow {
  userId: number
  username?: string
  nickname?: string | null
  lastLoginTime?: string | null
  /** 在线会话数(多端登录) */
  sessionCount: number
  /** 最长会话剩余有效期(秒) */
  remainSeconds: number
}

/** 上传文件记录(sys_file) */
export interface FileRow {
  id: string
  originalName?: string
  ext?: string
  size?: number
  createTime?: string
}

/** 数据字典类型(sys_dict_type) */
export interface DictTypeRow {
  id: number
  dictName?: string
  dictType?: string
  remark?: string | null
  status?: number
  sortNo?: number
  gmtCreated?: string
}

/** 数据字典数据项(sys_dict_data) */
export interface DictDataRow {
  id: number
  dictType?: string
  dictLabel?: string
  dictValue?: string
  dictSort?: number
  tagType?: string
  isDefault?: number
  status?: number
  remark?: string | null
  gmtCreated?: string
}

/** 字典选项(启用状态) */
export interface DictOption {
  dictLabel: string
  dictValue: string
  tagType?: string
  isDefault?: number
}

/** 系统参数配置(sys_config) */
export interface ConfigRow {
  id: number
  configName?: string
  configKey?: string
  configValue?: string | null
  configGroup?: string
  remark?: string | null
  status?: number
  gmtModified?: string
}

/** 部门(sys_dept) */
export interface DeptRow {
  id: number
  parentId?: number
  ancestors?: string
  deptName?: string
  leader?: string | null
  phone?: string | null
  sortNo?: number
  status?: number
  children?: DeptRow[]
}

/** 操作日志(sys_oper_log) */
export interface OperLogRow {
  id: number
  module?: string
  operation?: string
  method?: string
  url?: string
  params?: string | null
  result?: string | null
  ip?: string | null
  userAgent?: string | null
  operatorId?: number | null
  operatorName?: string | null
  costMs?: number
  status?: number
  errorMsg?: string | null
  operTime?: string
}

/** 定时任务(sys_job) */
export interface SysJobRow {
  id?: number
  jobName?: string
  jobGroup?: string
  /** 调用目标: Bean名.方法名 */
  invokeTarget?: string
  cronExpr?: string
  params?: string | null
  /** 禁止并发: 0允许 1禁止 */
  concurrent?: number
  /** 状态: 0正常 1暂停 */
  status?: number
  remark?: string | null
  gmtCreated?: string
  gmtModified?: string
}

/** 定时任务执行日志(sys_job_log) */
export interface SysJobLogRow {
  id?: number
  jobId?: number
  jobName?: string
  jobGroup?: string
  invokeTarget?: string
  params?: string | null
  /** 触发方式: 0自动调度 1手动执行 */
  triggerType?: number
  /** 结果: 0成功 1失败 */
  success?: number
  jobMessage?: string | null
  exceptionInfo?: string | null
  startTime?: string
  endTime?: string
  costMs?: number
}

/** 工作台-快捷入口(QuickEntryVo) */
export interface QuickEntryRow {
  menuId: number
  title?: string
  icon?: string | null
  path?: string | null
}

/** 工作台-待办聚合分组(WorkbenchTodoVo) */
export interface WorkbenchTodoGroup {
  /** 分组类型: notice/jobAlarm 等(前端据此区分行为) */
  type: string
  title?: string
  icon?: string | null
  /** 待办总数(可能大于 items 条数) */
  total: number
  items: WorkbenchTodoItem[]
}

/** 工作台-待办条目 */
export interface WorkbenchTodoItem {
  /** 业务id(字符串) */
  id: string
  title?: string
  summary?: string | null
  time?: string
  /** 点击跳转路径(空串表示就地处理) */
  targetPath?: string
}

/** 示例业务订单(biz_order) */
export interface BizOrderRow {
  id: number
  orderNo?: string
  title?: string | null
  amount?: number
  status?: number
  remark?: string | null
  createByName?: string | null
  gmtCreated?: string
}

/** 用户行补充部门字段(接口声明合并) */
export interface SysUserRow {
  deptId?: number | null
  deptName?: string | null
}

/** 角色行补充数据范围字段(接口声明合并) */
export interface SysRoleRow {
  dataScope?: number
}

/** 文件行补充上传人(接口声明合并) */
export interface FileRow {
  uploaderName?: string | null
}
