import request from '@/request'
import type { OnlineUserRow } from './types'

/** 在线用户列表 */
export const onlineListApi = () => {
  return request.get<OnlineUserRow[]>({ url: '/api/sys/online/list' })
}

/** 强踢下线(撤销该用户全部令牌, 前端立即登出) */
export const onlineKickApi = (userId: number) => {
  return request.post<boolean>({ url: '/api/sys/online/kick', data: { id: userId } })
}
