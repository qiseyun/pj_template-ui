import { defineStore } from 'pinia'
import { store } from '../index'
import { myUnreadCountApi } from '@/api/notice'

export interface NoticeState {
  /** 未读总数 */
  unread: number
  /** WebSocket 是否在线 */
  online: boolean
  /** 最近一次收到新消息的时间戳(用于触发抽屉刷新) */
  lastArriveAt: number
}

export const useNoticeStore = defineStore('notice', {
  state: (): NoticeState => ({
    unread: 0,
    online: false,
    lastArriveAt: 0
  }),
  actions: {
    /** 重新拉取未读数 */
    async refreshUnread() {
      try {
        const res = await myUnreadCountApi()
        this.unread = res?.data ?? 0
      } catch (error) {
        // 请求层已提示; 未读数保持原值
      }
    },
    setUnread(count: number) {
      this.unread = count
    },
    setOnline(online: boolean) {
      this.online = online
    },
    /** WebSocket 收到新消息提醒 */
    onArrive() {
      this.lastArriveAt = Date.now()
      void this.refreshUnread()
    }
  }
})

export const useNoticeStoreWithOut = () => {
  return useNoticeStore(store)
}
