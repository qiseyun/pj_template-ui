import request from '@/request'
import type { QuickEntryRow, WorkbenchTodoGroup } from '@/api/system/types'

/** 我的待办聚合 */
export const todoSummaryApi = () => {
  return request.get<WorkbenchTodoGroup[]>({ url: '/api/workbench/todo/summary' })
}

/** 我的快捷入口 */
export const quickListApi = () => {
  return request.get<QuickEntryRow[]>({ url: '/api/workbench/quick/list' })
}

/** 可选快捷入口(我的可访问叶子菜单) */
export const quickCandidatesApi = () => {
  return request.get<QuickEntryRow[]>({ url: '/api/workbench/quick/candidates' })
}

/** 保存我的快捷入口(整单覆盖, 按顺序) */
export const quickSaveApi = (menuIds: number[]) => {
  return request.post<QuickEntryRow[]>({ url: '/api/workbench/quick/save', data: { menuIds } })
}
