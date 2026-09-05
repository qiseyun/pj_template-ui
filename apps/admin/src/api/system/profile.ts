import request from '@/request'
import type { UserInfo } from '@/api/login/types'

/** 当前用户信息(个人中心回显) */
export const getProfileApi = () => {
  return request.get<UserInfo>({ url: '/api/auth/me' })
}

/** 更新个人资料(昵称/头像) */
export const updateProfileApi = (data: { nickname?: string; avatar?: string | null }) => {
  return request.put<UserInfo>({ url: '/api/auth/profile', data })
}
