import request from '@/request'
import {
  buildQueryBody,
  cond,
  type OperLogRow,
  type PageResult,
  type QueryCondition
} from './types'

export const operLogConditions = (params: {
  keyword?: string
  status?: number | ''
  timeRange?: string[]
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.keyword) {
    conditions.push(cond('module', 'like', params.keyword))
    conditions.push(cond('operatorName', 'like', params.keyword))
  }
  if (params.status !== undefined && params.status !== '') {
    conditions.push(cond('status', 'eq', params.status))
  }
  if (params.timeRange?.length === 2 && params.timeRange[0] && params.timeRange[1]) {
    conditions.push(cond('operTime', 'ge', params.timeRange[0]))
    conditions.push(cond('operTime', 'le', params.timeRange[1]))
  }
  return conditions
}

export const operLogPageApi = (
  current: number,
  size: number,
  params: { keyword?: string; status?: number | ''; timeRange?: string[] }
) => {
  return request.post<PageResult<OperLogRow>>({
    url: '/api/sys/operLog/page',
    data: buildQueryBody(current, size, operLogConditions(params), [
      { field: 'operTime', dir: 'desc' }
    ])
  })
}

export const operLogRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/sys/operLog/${id}` })

export const operLogRemoveBatchApi = (ids: number[]) =>
  request.post<boolean>({ url: '/api/sys/operLog/deleteBatch', data: { idList: ids } })

export const operLogClearApi = () => request.post<boolean>({ url: '/api/sys/operLog/clear' })
