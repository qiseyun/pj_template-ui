/** 登录入参 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册入参 */
export interface RegisterParams {
  username: string
  password: string
  nickname?: string
}

/** 修改密码入参 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** 登录/刷新成功返回(与后端 LoginResultVo 对齐) */
export interface LoginResult {
  userId: number
  accessToken: string
  refreshToken: string
  /** accessToken 有效期(秒) */
  accessExpiresIn?: number
  /** refreshToken 有效期(秒) */
  refreshExpiresIn?: number
}

/** 当前登录用户信息(与后端 SysUserVo 对齐) */
export interface UserInfo {
  id?: number
  username?: string
  nickname?: string
  /** 状态: 0正常 1禁用 */
  status?: number
  lastLoginTime?: string
  gmtCreated?: string
}

/** 后端菜单树节点(与后端 SysMenuVo 对齐) */
export interface SysMenuNode {
  id: number
  parentId: number
  menuName: string
  /** 类型: 1目录 2菜单 3按钮 */
  menuType: number
  /** 路由路径 */
  path?: string | null
  /** 前端组件路径(菜单), 如 views/system/user/index */
  component?: string | null
  /** 权限标识(按钮/接口, 如 sys:user:save) */
  permCode?: string | null
  icon?: string | null
  sortNo?: number
  /** 状态: 0正常 1停用 */
  status?: number
  /** 是否显示: 0显示 1隐藏 */
  visible?: number
  children?: SysMenuNode[]
}
