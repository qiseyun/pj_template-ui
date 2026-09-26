import request from '@/request'
import { buildQueryBody, cond, type PageResult, type QueryCondition, type SysJobRow } from './types'

export const jobConditions = (params: {
  keyword?: string
  jobGroup?: string
  status?: number | ''
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.keyword) {
    conditions.push(cond('jobName', 'like', params.keyword))
    conditions.push(cond('invokeTarget', 'like', params.keyword))
  }
  if (params.jobGroup) conditions.push(cond('jobGroup', 'eq', params.jobGroup))
  if (params.status !== undefined && params.status !== '') {
    conditions.push(cond('status', 'eq', params.status))
  }
  return conditions
}

export const jobPageApi = (
  current: number,
  size: number,
  params: { keyword?: string; jobGroup?: string; status?: number | '' }
) => {
  return request.post<PageResult<SysJobRow>>({
    url: '/api/sys/job/page',
    data: buildQueryBody(current, size, jobConditions(params), [{ field: 'id', dir: 'desc' }])
  })
}

export const jobSaveApi = (data: Partial<SysJobRow>) =>
  request.post<boolean>({ url: '/api/sys/job/save', data })

export const jobUpdateApi = (data: Partial<SysJobRow>) =>
  request.put<boolean>({ url: '/api/sys/job/update', data })

/** 启停: status 0正常 1暂停 */
export const jobStatusApi = (id: number, status: number) =>
  request.put<boolean>({ url: '/api/sys/job/status', data: { id, status } })

/** 立即执行一次(手动触发) */
export const jobRunApi = (id: number) => request.post<string>({ url: `/api/sys/job/run/${id}` })

export const jobRemoveApi = (id: number) => request.delete<boolean>({ url: `/api/sys/job/${id}` })

export const jobRemoveBatchApi = (ids: number[]) =>
  request.post<boolean>({ url: '/api/sys/job/deleteBatch', data: { idList: ids } })
