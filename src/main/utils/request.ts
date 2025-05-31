import axios, { AxiosError } from 'axios'
import Service from '../services/service'
import { notificationService } from '../module/notification'

const baseURL = import.meta.env.VITE_API_HOST

// 为 AxiosRequestConfig 扩展自定义属性
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipNotification?: boolean
  }
}

const request = axios.create({
  baseURL,
  timeout: 30 * 1000
})

// 添加请求拦截器
request.interceptors.request.use(
  (config) => {
    console.log('🚀 ~ interceptors config:', config.baseURL, config.url, config.data)
    // 从本地存储获取 token
    const token = Service.getInstance().store.get('Authorization') as string
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code } = response.data
    if (code === 200) {
      return response.data
    }
    if (code === 401) {
      Service.getInstance().user.logout()
      // 检查是否跳过通知
      if (!response.config.skipNotification) {
        notificationService.showErrorNotification('登录失效', '请重新登录')
      }
    }
    // 对于非 200 和 401 的业务错误，也检查 skipNotification
    if (!response.config.skipNotification && response.data.msg) {
      notificationService.showErrorNotification('操作失败', response.data.msg)
    }
    console.log('🚀 ~ data:', response.data)

    return Promise.reject(response.data)
  },
  (error: AxiosError) => {
    // 明确 error 类型为 AxiosError
    // 检查是否跳过通知
    // error.config 可能未定义，需要检查
    if (error.config && !error.config.skipNotification) {
      notificationService.showErrorNotification('请求错误', error.message)
    }
    // 对响应错误做点什么
    return Promise.reject(error)
  }
)

export default request
