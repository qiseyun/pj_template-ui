import { ElMessage } from 'element-plus'
import { createRequest, isCancel, type AxiosResponse, type RequestConfig } from '@vea/request'
import type { LoginResult } from '@/api/login/types'
import { CONTENT_TYPE, REQUEST_TIMEOUT, SUCCESS_CODE } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'

export interface ApiResponse<Data = unknown> {
  code: number
  data: Data
  message?: string
  /** 后端统一响应体使用 msg 字段 */
  msg?: string
}

type RequestMethod = 'get' | 'post' | 'put' | 'delete'

/**
 * 后端 token 相关错误码/状态(命中即触发"静默刷新 -> 重试一次"):
 * 11011 未能读取到有效token / 11012 Token无效 / 11013 Token已过期 /
 * 11014 Token已被撤销 / 11017 accessToken异常 / 401 HTTP 未授权
 */
const TOKEN_ERROR_CODES = [401, 11011, 11012, 11013, 11014, 11017]

const LOGIN_EXPIRED_MESSAGE = '登录状态已失效, 请重新登录'

/** 内部标记: 响应为 token 失效, 需刷新后重试(不抛错, 避免重复弹错误提示) */
interface ReauthMarker {
  readonly __reauth: true
}

const isReauthMarker = (value: unknown): value is ReauthMarker =>
  Boolean(value && typeof value === 'object' && (value as { __reauth?: unknown }).__reauth === true)

const normalizeRequestKey = (url = '') => url

const client = createRequest({
  axiosConfig: {
    baseURL: import.meta.env.VITE_API_BASE_PATH,
    timeout: REQUEST_TIMEOUT
  },
  beforeRequest(config) {
    const userStore = useUserStoreWithOut()
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
    return {
      ...config,
      headers: {
        // FormData 由浏览器自动生成 multipart boundary, 不能预设 application/json
        ...(isFormData ? {} : { 'Content-Type': CONTENT_TYPE }),
        // 后端约定: Authorization: Bearer {accessToken}
        ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}),
        ...config.headers
      }
    }
  },
  transformResponse(response: AxiosResponse) {
    if (response.config.responseType === 'blob') return response

    const result = response.data as ApiResponse
    if (result.code === SUCCESS_CODE) return result

    // token 失效: 静默返回标记, 由上层统一刷新后重试
    if (TOKEN_ERROR_CODES.includes(result.code)) return { __reauth: true } as ReauthMarker

    throw Object.assign(
      new Error(result.msg || result.message || `Request failed (${result.code})`),
      {
        code: result.code
      }
    )
  },
  onError(error) {
    if (!isCancel(error)) {
      // HTTP 401/403 属于鉴权失效, 由上层刷新流程处理, 不在此弹错
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 401) return
      ElMessage.error(error instanceof Error ? error.message : String(error))
    }
  },
  getRequestKey: (config) => normalizeRequestKey(config.url)
})

/** 单飞: 同一时刻只发起一次刷新请求 */
let refreshingPromise: Promise<boolean> | null = null

/** 使用 refreshToken 换取新的双 token(失败返回 false, 不抛出) */
const refreshTokens = (): Promise<boolean> => {
  const userStore = useUserStoreWithOut()
  if (!userStore.refreshToken) return Promise.resolve(false)
  if (!refreshingPromise) {
    refreshingPromise = client
      .post<ApiResponse<LoginResult>>({
        url: '/api/auth/refresh',
        data: { refreshToken: userStore.refreshToken }
      })
      .then((result) => {
        if (
          result &&
          !isReauthMarker(result) &&
          result.code === SUCCESS_CODE &&
          result.data?.accessToken
        ) {
          userStore.setTokens(result.data)
          return true
        }
        return false
      })
      .catch(() => false)
      .finally(() => {
        refreshingPromise = null
      })
  }
  return refreshingPromise
}

/** token 失效后清理会话并回到登录页 */
const forceLogout = async () => {
  await useUserStoreWithOut().logout()
}

const isHttpStatus = (error: unknown, status: number) =>
  Boolean(error && (error as { response?: { status?: number } })?.response?.status === status)

/** 按方法名调用底层 client(规避方法联合类型的签名不兼容问题) */
const callClient = (method: RequestMethod, config: RequestConfig): Promise<unknown> => {
  if (method === 'get') return client.get(config)
  if (method === 'post') return client.post(config)
  if (method === 'put') return client.put(config)
  return client.delete(config)
}

/**
 * 统一请求入口:
 * - 业务码非 0 抛错(消息取 msg/message);
 * - token 失效时"刷新一次并重试一次", 仍失败则登出回登录页。
 */
const dispatch = async <Data = unknown>(method: RequestMethod, config: RequestConfig) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await callClient(method, config)
      if (isReauthMarker(result)) {
        // 业务码级 token 失效: 首次尝试刷新后重试, 二次仍失效则登出
        if (attempt === 1 && (await refreshTokens())) continue
        await forceLogout()
        throw new Error(LOGIN_EXPIRED_MESSAGE)
      }
      return result as ApiResponse<Data>
    } catch (error) {
      // HTTP 401 未授权
      if (isHttpStatus(error, 401)) {
        if (attempt === 1 && (await refreshTokens())) continue
        await forceLogout()
        throw new Error(LOGIN_EXPIRED_MESSAGE)
      }
      throw error
    }
  }
  throw new Error(LOGIN_EXPIRED_MESSAGE)
}

export default {
  get: <Data = unknown>(config: RequestConfig) => dispatch<Data>('get', config),
  post: <Data = unknown>(config: RequestConfig) => dispatch<Data>('post', config),
  delete: <Data = unknown>(config: RequestConfig) => dispatch<Data>('delete', config),
  put: <Data = unknown>(config: RequestConfig) => dispatch<Data>('put', config),
  cancelRequest: (url: string | string[]) => {
    const keys = (Array.isArray(url) ? url : [url]).map(normalizeRequestKey)
    client.cancelRequest(keys)
  },
  cancelAllRequest: client.cancelAllRequest
}
