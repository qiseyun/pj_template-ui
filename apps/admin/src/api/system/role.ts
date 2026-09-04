import request from '@/request'
import { buildQueryBody, cond, type PageResult, type QueryCondition, type SysRoleRow } from './types'

/** 条件构造: 角色名模糊 / 角色编码模糊 / 状态精确 */
export const roleConditions = (params: { roleName?: string; roleCode?: string; status?: number | '' }): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.roleName) conditions.push(cond('roleName', 'like', params.roleName))
  if (params.roleCode) conditions.push(cond('roleCode', 'like', params.roleCode))
  if (params.status !== undefined && params.status !== '') conditions.push(cond('status', 'eq', params.status))
  return conditions
}

/** 角色分页 */
export const rolePageApi = (current: number, size: number, params: { roleName?: string; roleCode?: string; status?: number | '' }) => {
  return request.post<PageResult<SysRoleRow>>({
    url: '/api/sys/role/page',
    data: buildQueryBody(current, size, roleConditions(params), [{ field: 'sortNo', dir: 'asc' }, { field: 'id', dir: 'asc' }])
  })
}

/** 全部角色列表(下拉选择用) */
export const roleListAllApi = () => {
  return request.get<SysRoleRow[]>({ url: '/api/sys/role/listAll' })
}

/** 新增角色 */
export const roleSaveApi = (data: Partial<SysRoleRow>) => {
  return request.post<boolean>({ url: '/api/sys/role/save', data })
}

/** 修改角色 */
export const roleUpdateApi = (data: Partial<SysRoleRow>) => {
  return request.put<boolean>({ url: '/api/sys/role/update', data })
}

/** 删除角色(同步清理用户-角色、角色-菜单关联) */
export const roleRemoveApi = (ids: number[]) => {
  return request.post<boolean>({ url: '/api/sys/role/deleteBatch', data: { idList: ids } })
}

/** 给角色分配菜单权限(全量覆盖) */
export const roleGrantMenusApi = (roleId: number, menuIds: number[]) => {
  return request.post<boolean>({ url: '/api/sys/role/grantMenus', data: { roleId, menuIds } })
}

/** 查询角色已分配的菜单id(授权弹窗回显) */
export const roleMenuIdsApi = (roleId: number) => {
  return request.get<number[]>({ url: `/api/sys/role/${roleId}/menuIds` })
}
