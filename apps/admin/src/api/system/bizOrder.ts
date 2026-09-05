import request from '@/request'
import {
  buildQueryBody,
  cond,
  type BizOrderRow,
  type PageResult,
  type QueryCondition
} from './types'

export const orderConditions = (params: {
  orderNo?: string
  title?: string
  status?: number | ''
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.orderNo) conditions.push(cond('orderNo', 'like', params.orderNo))
  if (params.title) conditions.push(cond('title', 'like', params.title))
  if (params.status !== undefined && params.status !== '')
    conditions.push(cond('status', 'eq', params.status))
  return conditions
}

export const orderPageApi = (
  current: number,
  size: number,
  params: { orderNo?: string; title?: string; status?: number | '' }
) => {
  return request.post<PageResult<BizOrderRow>>({
    url: '/api/biz/order/page',
    data: buildQueryBody(current, size, orderConditions(params), [{ field: 'id', dir: 'desc' }])
  })
}

export const orderSaveApi = (data: Partial<BizOrderRow>) =>
  request.post<boolean>({ url: '/api/biz/order/save', data })

export const orderUpdateApi = (data: Partial<BizOrderRow>) =>
  request.put<boolean>({ url: '/api/biz/order/update', data })

export const orderRemoveApi = (id: number) =>
  request.delete<boolean>({ url: `/api/biz/order/${id}` })
