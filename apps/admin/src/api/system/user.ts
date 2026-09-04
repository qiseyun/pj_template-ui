import request from '@/request'
import { buildQueryBody, cond, type PageResult, type QueryCondition, type SysRoleRow, type SysUserRow } from './types'

/** 条件构造: 用户名模糊 / 状态精确 */
export const userConditions = (params: { username?: string; status?: number | '' }): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.username) conditions.push(cond('username', 'like', params.username))
  if (params.status !== undefined && params.status !== '') conditions.push(cond('status', 'eq', params.status))
  return conditions
}

/** 用户分页 */
export const userPageApi = (current: number, size: number, params: { username?: string; status?: number | '' }) => {
  return request.post<PageResult<SysUserRow>>({
    url: '/api/sys/user/page',
    data: buildQueryBody(current, size, userConditions(params), [{ field: 'id', dir: 'desc' }])
  })
}

/** 用户详情 */
export const userDetailApi = (id: number) => {
  return request.get<SysUserRow>({ url: `/api/sys/user/${id}` })
}

/** 新增用户(密码明文, 后端 bcrypt 加密) */
export const userSaveApi = (data: Partial<SysUserRow>) => {
  return request.post<boolean>({ url: '/api/sys/user/save', data })
}

/** 修改用户(不传密码则不修改密码) */
export const userUpdateApi = (data: Partial<SysUserRow>) => {
  return request.put<boolean>({ url: '/api/sys/user/update', data })
}

/** 批量删除用户(逻辑删除并清理用户-角色关联) */
export const userRemoveApi = (ids: number[]) => {
  return request.post<boolean>({ url: '/api/sys/user/deleteBatch', data: { idList: ids } })
}

/** 给用户分配角色(全量覆盖) */
export const userAssignRolesApi = (userId: number, roleIds: number[]) => {
  return request.post<boolean>({ url: '/api/sys/user/assignRoles', data: { userId, roleIds } })
}

/** 查询用户已分配的角色id(分配弹窗回显) */
export const userRoleIdsApi = (userId: number) => {
  return request.get<number[]>({ url: `/api/sys/user/${userId}/roleIds` })
}

/** 查询用户已分配的角色列表 */
export const userRolesApi = (userId: number) => {
  return request.get<SysRoleRow[]>({ url: `/api/sys/user/${userId}/roles` })
}
