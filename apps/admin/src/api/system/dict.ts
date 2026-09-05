import request from '@/request'
import {
  buildQueryBody,
  cond,
  type DictDataRow,
  type DictOption,
  type DictTypeRow,
  type PageResult,
  type QueryCondition
} from './types'

/** 字典类型查询条件 */
export const dictTypeConditions = (params: {
  dictName?: string
  dictType?: string
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.dictName) conditions.push(cond('dictName', 'like', params.dictName))
  if (params.dictType) conditions.push(cond('dictType', 'like', params.dictType))
  return conditions
}

export const dictTypePageApi = (
  current: number,
  size: number,
  params: { dictName?: string; dictType?: string }
) => {
  return request.post<PageResult<DictTypeRow>>({
    url: '/api/sys/dictType/page',
    data: buildQueryBody(current, size, dictTypeConditions(params), [
      { field: 'sortNo', dir: 'asc' }
    ])
  })
}

export const dictTypeSaveApi = (data: Partial<DictTypeRow>) =>
  request.post<boolean>({ url: '/api/sys/dictType/save', data })

export const dictTypeUpdateApi = (data: Partial<DictTypeRow>) =>
  request.put<boolean>({ url: '/api/sys/dictType/update', data })

export const dictTypeRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/sys/dictType/${id}` })

/** 字典数据查询条件 */
export const dictDataConditions = (params: {
  dictType?: string
  label?: string
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.dictType) conditions.push(cond('dictType', 'eq', params.dictType))
  if (params.label) conditions.push(cond('dictLabel', 'like', params.label))
  return conditions
}

export const dictDataPageApi = (
  current: number,
  size: number,
  params: { dictType?: string; label?: string }
) => {
  return request.post<PageResult<DictDataRow>>({
    url: '/api/sys/dictData/page',
    data: buildQueryBody(current, size, dictDataConditions(params), [
      { field: 'dictSort', dir: 'asc' }
    ])
  })
}

export const dictDataSaveApi = (data: Partial<DictDataRow>) =>
  request.post<boolean>({ url: '/api/sys/dictData/save', data })

export const dictDataUpdateApi = (data: Partial<DictDataRow>) =>
  request.put<boolean>({ url: '/api/sys/dictData/update', data })

export const dictDataRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/sys/dictData/${id}` })

/** 按类型取启用字典选项(下拉/标签渲染) */
export const dictOptionsApi = (dictType: string) => {
  return request.get<DictOption[]>({ url: `/api/sys/dictData/options/${dictType}` })
}
