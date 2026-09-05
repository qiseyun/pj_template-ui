import request from '@/request'
import { buildQueryBody, cond, type FileRow, type PageResult, type QueryCondition } from './types'

/** 文件类型筛选分组 → 扩展名列表 */
const FILE_TYPE_GROUPS: Record<string, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
  video: ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'],
  word: ['doc', 'docx'],
  excel: ['xls', 'xlsx'],
  pdf: ['pdf'],
  zip: ['zip', 'rar', '7z']
}

/** 文件管理分页条件 */
export const filePageConditions = (params: {
  keyword?: string
  ext?: string
}): QueryCondition[] => {
  const conditions: QueryCondition[] = []
  if (params.keyword) conditions.push(cond('originalName', 'like', params.keyword))
  if (params.ext) {
    const exts = FILE_TYPE_GROUPS[params.ext]
    if (exts && exts.length > 1) {
      conditions.push(cond('ext', 'in', exts))
    } else {
      conditions.push(cond('ext', 'eq', exts ? exts[0] : params.ext))
    }
  }
  return conditions
}

export const filePageApi = (
  current: number,
  size: number,
  params: { keyword?: string; ext?: string }
) => {
  return request.post<PageResult<FileRow>>({
    url: '/api/file/page',
    data: buildQueryBody(current, size, filePageConditions(params), [
      { field: 'createTime', dir: 'desc' }
    ])
  })
}

/** 按 id 列表查询文件信息(展示组件回显) */
export const fileListByIdsApi = (idList: string[]) => {
  return request.post<FileRow[]>({ url: '/api/file/listByIds', data: { idList } })
}

/** 删除文件(磁盘+记录, 不可恢复) */
export const fileDeleteBatchApi = (idList: string[]) => {
  return request.post<boolean>({ url: '/api/file/deleteBatch', data: { idList } })
}

/** 上传单个文件(FormData; 复用统一请求封装与鉴权, 成功返回文件行) */
export const fileUpload = async (file: File): Promise<FileRow> => {
  const form = new FormData()
  form.append('file', file)
  const res = await request.post<FileRow>({ url: '/api/file/upload', data: form })
  if (!res || !res.data) {
    throw new Error('上传失败')
  }
  return res.data
}

/** 以 blob 拉取文件内容(带鉴权), 供图片预览与下载使用 */
const fetchBlobWithAuth = async (path: string): Promise<Blob> => {
  const token = (await import('@/store/modules/user')).useUserStoreWithOut().token
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) {
    throw new Error(`文件读取失败(${res.status})`)
  }
  return res.blob()
}

/** 预览图片(返回 objectURL; 调用方负责 revoke) */
export const filePreviewUrl = async (id: string): Promise<string> => {
  const blob = await fetchBlobWithAuth(`/api/file/preview/${id}`)
  return URL.createObjectURL(blob)
}

/** 获取图片 blob(展示缩略图用) */
export const fetchPreviewBlob = async (id: string): Promise<Blob> => {
  return fetchBlobWithAuth(`/api/file/preview/${id}`)
}

/** 下载文件(自动触发浏览器下载; 返回 objectURL 供上层 revoke) */
export const fileDownload = async (row: { id: string; originalName?: string }): Promise<void> => {
  const blob = await fetchBlobWithAuth(`/api/file/download/${row.id}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = row.originalName || row.id
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** 字节数格式化 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/** 是否为可预览图片扩展名 */
export const isImageExt = (ext?: string): boolean =>
  Boolean(ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext.toLowerCase()))

/** 是否为视频扩展名 */
export const isVideoExt = (ext?: string): boolean =>
  Boolean(ext && ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'].includes(ext.toLowerCase()))

/** 在线播放视频(返回 blob objectURL; 调用方负责 revoke) */
export const fileVideoUrl = async (id: string): Promise<string> => {
  const blob = await fetchBlobWithAuth(`/api/file/video/${id}`)
  return URL.createObjectURL(blob)
}
