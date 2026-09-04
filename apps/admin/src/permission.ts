import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import router from './router'
import { getMenusApi, getPermsApi, getUserInfoApi } from '@/api/login'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { transformMenusToRoutes } from '@/utils/menuToRoutes'
import { startNoticeSocket } from '@/utils/noticeSocket'
import { useAppStoreWithOut } from '@/store/modules/app'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

/**
 * 初始化后端下发的动态路由(菜单 + 权限码):
 * 1. 拉取当前用户信息(/auth/me)并写入用户 store;
 * 2. 拉取菜单树(/auth/menus) -> 转换为路由记录 -> addRoute;
 * 3. 拉取权限标识(/auth/permissions) -> 写入 permission store(按钮级控制)。
 */
export const ensureDynamicRoutes = async () => {
  const permissionStore = usePermissionStoreWithOut()
  if (permissionStore.isAddRouters) return false

  const userStore = useUserStoreWithOut()
  const [meResult, menusResult, permsResult] = await Promise.all([
    getUserInfoApi(),
    getMenusApi(),
    getPermsApi()
  ])

  if (meResult?.data) userStore.setUserInfo(meResult.data)
  permissionStore.setPermCodes(permsResult?.data ?? [])

  const appRoutes = transformMenusToRoutes(menusResult?.data ?? [])
  permissionStore.generateRoutes(appRoutes).forEach((route) => {
    router.addRoute(route as unknown as RouteRecordRaw)
  })
  permissionStore.setIsAddRouters(true)
  // 动态路由就绪后建立通知公告 WebSocket 实时通道
  startNoticeSocket(userStore.token)
  return true
}

export const setupPermission = async () => {
  const userStore = useUserStoreWithOut()

  if (userStore.isAuthenticated) {
    try {
      await ensureDynamicRoutes()
    } catch {
      userStore.clearSession()
    }
  }

  router.beforeEach(async (to) => {
    NProgress.start()
    useAppStoreWithOut().pageLoading = true

    if (!userStore.isAuthenticated) {
      if (NO_REDIRECT_WHITE_LIST.includes(to.path)) return true
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.path === '/login') return { path: '/' }

    try {
      const routesAdded = await ensureDynamicRoutes()
      if (routesAdded) return { path: to.fullPath, replace: true }
    } catch {
      userStore.clearSession()
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.name === 'Fallback') return { path: '/404', replace: true }
    return true
  })

  router.afterEach(() => {
    NProgress.done()
    useAppStoreWithOut().pageLoading = false
  })
}
