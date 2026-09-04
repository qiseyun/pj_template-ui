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
  op: 'eq' | 'ne' | 'like' | 'notLike' | 'empty' | 'notEmpty' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'notIn' | 'between'
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
export const cond = (
  field: string,
  op: QueryCondition['op'],
  value?: unknown
): QueryCondition => ({ field, op, value })

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
