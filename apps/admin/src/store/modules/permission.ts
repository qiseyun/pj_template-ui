import { defineStore } from 'pinia'
import { constantRouterMap } from '@/router'
import { generateRoutesByServer } from '@/utils/routerHelper'
import { store } from '../index'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  /** 当前用户权限标识集合(按钮/接口级权限, 来自 /auth/permissions) */
  permCodes: string[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    permCodes: []
  }),
  getters: {
    hasPerm(state) {
      return (code: string) => (code ? state.permCodes.includes(code) : true)
    }
  },
  actions: {
    generateRoutes(routers: AppCustomRouteRecordRaw[]): AppRouteRecordRaw[] {
      const routerMap = generateRoutesByServer(routers)
      this.addRouters = routerMap
      this.routers = constantRouterMap.concat(routerMap)
      return this.addRouters
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setPermCodes(codes: string[]): void {
      this.permCodes = codes ?? []
    },
    reset(): void {
      this.routers = []
      this.addRouters = []
      this.isAddRouters = false
      this.permCodes = []
    }
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
