import request from '@/request'
import type {
  CaptchaResult,
  ChangePasswordParams,
  LoginParams,
  LoginResult,
  RegisterParams,
  SysMenuNode,
  UserInfo
} from './types'

/** 获取登录图形验证码 */
export const getCaptchaApi = () => {
  return request.get<CaptchaResult>({ url: '/api/auth/captcha' })
}

/** 登录: 返回双 token(accessToken + refreshToken) */
export const loginApi = (data: LoginParams) => {
  return request.post<LoginResult>({ url: '/api/auth/login', data })
}

/** 注册 */
export const registerApi = (data: RegisterParams) => {
  return request.post<null>({ url: '/api/auth/register', data })
}

/** 登出(后端撤销当前 accessToken) */
export const logoutApi = () => {
  return request.post<null>({ url: '/api/auth/logout' })
}

/** 当前登录用户信息 */
export const getUserInfoApi = () => {
  return request.get<UserInfo>({ url: '/api/auth/me' })
}

/** 当前用户菜单树(目录/菜单, 用于动态路由与侧边导航) */
export const getMenusApi = () => {
  return request.get<SysMenuNode[]>({ url: '/api/auth/menus' })
}

/** 当前用户权限标识集合(按钮/接口级权限) */
export const getPermsApi = () => {
  return request.get<string[]>({ url: '/api/auth/permissions' })
}

/** 修改密码(成功后后端撤销全部 token, 需重新登录) */
export const changePasswordApi = (data: ChangePasswordParams) => {
  return request.post<null>({ url: '/api/auth/changePassword', data })
}
