import request from '@/request'
import {
  buildQueryBody,
  cond,
  type PageResult,
  type QueryCondition,
  type SysLoginLogRow
} from './types'

/** 构造查询条件: 用户名模糊 / 结果精确 / 登录时间区间 */
export const loginLogConditions = (params: {
  username?: string
  success?: number | ''
  loginTimeRange?: string[]
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.username) conditions.push(cond('username', 'like', params.username))
  if (params.success !== undefined && params.success !== '') {
    conditions.push(cond('success', 'eq', params.success))
  }
  if (params.loginTimeRange?.length === 2 && params.loginTimeRange[0] && params.loginTimeRange[1]) {
    conditions.push(cond('loginTime', 'ge', params.loginTimeRange[0]))
    conditions.push(cond('loginTime', 'le', params.loginTimeRange[1]))
  }
  return conditions
}

/** 登录日志分页 */
export const loginLogPageApi = (
  current: number,
  size: number,
  params: { username?: string; success?: number | ''; loginTimeRange?: string[] }
) => {
  return request.post<PageResult<SysLoginLogRow>>({
    url: '/api/sys/loginLog/page',
    data: buildQueryBody(current, size, loginLogConditions(params), [
      { field: 'loginTime', dir: 'desc' }
    ])
  })
}

/** 删除单条日志 */
export const loginLogRemoveApi = (id: number) => {
  return request.delete<boolean>({ url: `/api/sys/loginLog/${id}` })
}

/** 批量删除日志 */
export const loginLogRemoveBatchApi = (ids: number[]) => {
  return request.post<boolean>({ url: '/api/sys/loginLog/deleteBatch', data: { idList: ids } })
}

/** 清空全部日志(软删, 不可恢复) */
export const loginLogClearApi = () => {
  return request.post<boolean>({ url: '/api/sys/loginLog/clear' })
}
