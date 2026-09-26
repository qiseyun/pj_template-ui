import request from '@/request'
import {
  buildQueryBody,
  cond,
  type PageResult,
  type QueryCondition,
  type SysJobLogRow
} from './types'

export const jobLogConditions = (params: {
  jobId?: number | ''
  jobName?: string
  success?: number | ''
  triggerType?: number | ''
  timeRange?: string[]
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.jobId !== undefined && params.jobId !== '') {
    conditions.push(cond('jobId', 'eq', params.jobId))
  }
  if (params.jobName) conditions.push(cond('jobName', 'like', params.jobName))
  if (params.success !== undefined && params.success !== '') {
    conditions.push(cond('success', 'eq', params.success))
  }
  if (params.triggerType !== undefined && params.triggerType !== '') {
    conditions.push(cond('triggerType', 'eq', params.triggerType))
  }
  if (params.timeRange?.length === 2 && params.timeRange[0] && params.timeRange[1]) {
    conditions.push(cond('startTime', 'ge', params.timeRange[0]))
    conditions.push(cond('startTime', 'le', params.timeRange[1]))
  }
  return conditions
}

export const jobLogPageApi = (
  current: number,
  size: number,
  params: { jobId?: number | ''; jobName?: string; success?: number | ''; triggerType?: number | ''; timeRange?: string[] }
) => {
  return request.post<PageResult<SysJobLogRow>>({
    url: '/api/sys/jobLog/page',
    data: buildQueryBody(current, size, jobLogConditions(params), [
      { field: 'startTime', dir: 'desc' }
    ])
  })
}

export const jobLogRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/sys/jobLog/${id}` })

export const jobLogRemoveBatchApi = (ids: number[]) =>
  request.post<boolean>({ url: '/api/sys/jobLog/deleteBatch', data: { idList: ids } })

export const jobLogClearApi = () => request.post<boolean>({ url: '/api/sys/jobLog/clear' })
