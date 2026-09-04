import request from '@/request'
import type { SysMenuRow } from './types'

/** 管理端菜单树(含目录/菜单/按钮) */
export const menuTreeApi = () => {
  return request.get<SysMenuRow[]>({ url: '/api/sys/menu/tree' })
}

/** 新增菜单/目录/按钮 */
export const menuSaveApi = (data: Partial<SysMenuRow>) => {
  return request.post<boolean>({ url: '/api/sys/menu/save', data })
}

/** 修改菜单/目录/按钮 */
export const menuUpdateApi = (data: Partial<SysMenuRow>) => {
  return request.put<boolean>({ url: '/api/sys/menu/update', data })
}

/** 删除菜单(存在子菜单不允许删除; 同步清理角色-菜单关联) */
export const menuRemoveApi = (ids: number[]) => {
  return request.post<boolean>({ url: '/api/sys/menu/deleteBatch', data: { idList: ids } })
}
