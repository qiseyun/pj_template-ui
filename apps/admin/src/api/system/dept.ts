import request from '@/request'
import type { DeptRow } from './types'

/** 部门树(管理/展示) */
export const deptTreeApi = () => {
  return request.get<DeptRow[]>({ url: '/api/sys/dept/tree' })
}

/** 部门平铺列表(父级选择) */
export const deptListAllApi = () => {
  return request.get<DeptRow[]>({ url: '/api/sys/dept/listAll' })
}

export const deptSaveApi = (data: Partial<DeptRow>) =>
  request.post<boolean>({ url: '/api/sys/dept/save', data })

export const deptUpdateApi = (data: Partial<DeptRow>) =>
  request.put<boolean>({ url: '/api/sys/dept/update', data })

export const deptRemoveApi = (id: number) => request.delete<boolean>({ url: `/api/sys/dept/${id}` })
