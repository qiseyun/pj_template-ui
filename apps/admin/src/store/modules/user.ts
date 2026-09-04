import { defineStore } from 'pinia'
import { store } from '../index'
import type { LoginResult, UserInfo } from '@/api/login/types'
import { usePermissionStore } from './permission'
import { useTagsViewStore } from './tagsView'
import router, { resetRouter } from '@/router'

interface UserState {
  userInfo?: UserInfo
  token: string
  refreshToken: string
  rememberMe: boolean
  rememberedUsername: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    return {
      userInfo: undefined,
      token: '',
      refreshToken: '',
      rememberMe: true,
      rememberedUsername: ''
    }
  },
  getters: {
    isAuthenticated(): boolean {
      return Boolean(this.token)
    }
  },
  actions: {
    /** 登录/刷新成功后写入双 token */
    setTokens({ accessToken, refreshToken }: LoginResult) {
      this.token = accessToken
      this.refreshToken = refreshToken
    },
    /** 会话期(如自动刷新)后仅更新 accessToken */
    setAccessToken(token: string) {
      this.token = token
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
    },
    rememberUsername(username: string, remember: boolean) {
      this.rememberMe = remember
      this.rememberedUsername = remember ? username : ''
    },
    clearSession() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = undefined
      usePermissionStore().reset()
      useTagsViewStore().removeAllViews(false)
      resetRouter()
      // 关闭通知 WebSocket(动态 import 避免循环依赖)
      void import('@/utils/noticeSocket').then(({ stopNoticeSocket }) => stopNoticeSocket())
    },
    async logout() {
      this.clearSession()
      await router.replace('/login')
    }
  },
  persist: {
    key: 'vea-session-v1',
    pick: ['token', 'refreshToken', 'userInfo', 'rememberMe', 'rememberedUsername']
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
