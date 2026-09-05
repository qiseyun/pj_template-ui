import request from '@/request'
import { buildQueryBody, cond, type ConfigRow, type PageResult, type QueryCondition } from './types'

export const configConditions = (params: {
  configName?: string
  configGroup?: string
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.configName) conditions.push(cond('configName', 'like', params.configName))
  if (params.configGroup) conditions.push(cond('configGroup', 'eq', params.configGroup))
  return conditions
}

export const configPageApi = (
  current: number,
  size: number,
  params: { configName?: string; configGroup?: string }
) => {
  return request.post<PageResult<ConfigRow>>({
    url: '/api/sys/config/page',
    data: buildQueryBody(current, size, configConditions(params), [{ field: 'id', dir: 'desc' }])
  })
}

export const configSaveApi = (data: Partial<ConfigRow>) =>
  request.post<boolean>({ url: '/api/sys/config/save', data })

export const configUpdateApi = (data: Partial<ConfigRow>) =>
  request.put<boolean>({ url: '/api/sys/config/update', data })

export const configRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/sys/config/${id}` })

export const configRemoveBatchApi = (ids: number[]) =>
  request.post<boolean>({ url: '/api/sys/config/deleteBatch', data: { idList: ids } })
