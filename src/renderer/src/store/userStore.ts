import { LOGOUT_DELAY_SECONDS } from '@renderer/const'
import { callApi } from '@renderer/utils'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface IUseUserInfoState {
  userInfo: UserInfo | null
  logoutTimerId: NodeJS.Timeout | null // 新增：存储定时器 ID
  scoreData: IUserScoreInfo | null
}

interface IUserInfoDispatch {
  updateUserInfo: (userInfo: UserInfo) => void
  refreshUserInfo: () => Promise<void>
  logout: () => void // 显式声明 logout 类型
  getScoreData: () => Promise<void> // 新增：获取用户积分数据
}

const useUserStore = create<IUseUserInfoState & IUserInfoDispatch>()(
  immer((set, get) => ({
    userInfo: null,
    logoutTimerId: null, // 初始化定时器 ID
    scoreData: null, // 初始化 scoreData
    getScoreData: async () => {
      const scoreData = await callApi('getUserScore')
      set((state) => {
        state.scoreData = scoreData
      })
    },
    updateUserInfo: async (userInfo: UserInfo) => {
      get().getScoreData()
      set((state) => {
        // 清除可能存在的旧定时器
        if (state.logoutTimerId) {
          clearTimeout(state.logoutTimerId)
          state.logoutTimerId = null
        }
        state.userInfo = userInfo
        // 启动新的登出定时器
        state.logoutTimerId = setTimeout(() => {
          get().logout()
        }, LOGOUT_DELAY_SECONDS * 1000) // 转换为毫秒
      })
    },

    refreshUserInfo: async () => {
      const userInfo = await callApi('getUserInfo')
      get().updateUserInfo({
        ...userInfo,
        token: get().userInfo?.token || ''
      })
    },

    logout: () => {
      set((state) => {
        // 清除定时器（无论是手动调用 logout 还是定时器触发）
        if (state.logoutTimerId) {
          clearTimeout(state.logoutTimerId)
          state.logoutTimerId = null
        }
        // 重置用户信息
        state.userInfo = null
        state.scoreData = null
      })
      // 调用 API 处理登出（这个可以放在 set 外面，因为它是一个副作用）
      callApi('handleUserLogout')
    }
  }))
)

export default useUserStore
