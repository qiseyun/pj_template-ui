import { ElMessage } from 'element-plus'
import { useNoticeStoreWithOut } from '@/store/modules/notice'
import { useUserStoreWithOut } from '@/store/modules/user'

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 3000
let stopped = false

/** 建立(或重建)通知公告 WebSocket 连接 */
export const startNoticeSocket = (token?: string) => {
  if (!token || typeof window === 'undefined') return
  stopped = false
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${window.location.host}/ws/notice?token=${encodeURIComponent(token)}`

  try {
    socket = new WebSocket(url)
  } catch {
    return
  }

  const noticeStore = useNoticeStoreWithOut()

  socket.onopen = () => {
    retryDelay = 3000
    noticeStore.setOnline(true)
  }

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const message = JSON.parse(event.data as string) as { type?: string }
      if (message?.type === 'NOTICE') {
        noticeStore.onArrive()
      } else if (message?.type === 'KICK') {
        // 管理员强制下线: 本地立即登出(令牌已由后端撤销)
        ElMessage.warning('账号已被管理员强制下线')
        void useUserStoreWithOut().logout()
      }
    } catch {
      // 忽略无法解析的消息
    }
  }

  socket.onclose = () => {
    noticeStore.setOnline(false)
    scheduleReconnect(token)
  }

  socket.onerror = () => {
    // 错误后浏览器会触发 onclose, 统一在 onclose 处理重连
  }
}

/** 关闭通知公告 WebSocket(登出/切换账号时调用) */
export const stopNoticeSocket = () => {
  stopped = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) {
    const ws = socket
    socket = null
    ws.onclose = null
    ws.onmessage = null
    ws.onerror = null
    ws.onopen = null
    try {
      ws.close(1000, 'logout')
    } catch {
      // 忽略关闭异常
    }
  }
  const noticeStore = useNoticeStoreWithOut()
  noticeStore.setOnline(false)
}

function scheduleReconnect(token?: string) {
  if (stopped || !token) return
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    retryDelay = Math.min(retryDelay * 2, 30000)
    startNoticeSocket(token)
  }, retryDelay)
}
