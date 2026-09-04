import request from '@/request'
import type { PageResult } from '@/api/system/types'
import type { NoticeMyQuery, NoticeRow, NoticeSendPayload } from './types'

/** 我的未读数量 */
export const myUnreadCountApi = () => {
  return request.get<number>({ url: '/api/notice/my/unreadCount' })
}

/** 我的通知/公告分页 */
export const myNoticePageApi = (data: NoticeMyQuery) => {
  return request.post<PageResult<NoticeRow>>({ url: '/api/notice/my/page', data })
}

/** 我的详情(阅读富文本) */
export const myNoticeDetailApi = (id: number) => {
  return request.get<NoticeRow>({ url: `/api/notice/my/${id}` })
}

/** 标记已读 */
export const markNoticeReadApi = (idList: number[]) => {
  return request.post<boolean>({ url: '/api/notice/my/read', data: { idList } })
}

/** 发送通知/公告 */
export const sendNoticeApi = (data: NoticeSendPayload) => {
  return request.post<{ noticeId: number; targetCount: number; onlineCount: number }>({
    url: '/api/notice/send',
    data
  })
}

/** 管理端历史分页 */
export const noticeHistoryPageApi = (data: { current: number; size: number; type?: 0 | 1 | 2 }) => {
  return request.post<PageResult<NoticeRow>>({ url: '/api/notice/page', data })
}

/** 管理端详情 */
export const noticeDetailApi = (id: number) => {
  return request.get<NoticeRow>({ url: `/api/notice/${id}` })
}
