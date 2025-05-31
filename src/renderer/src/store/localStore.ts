import { callApi } from '@renderer/utils'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface IUseUserInfoState {
  config: IConfig | null
}

interface IUserInfoDispatch {
  getConfig: () => void
  updateConfig: (key: keyof IConfig, value: IConfig[keyof IConfig]) => void
}

const useLocalConfigStore = create<IUseUserInfoState & IUserInfoDispatch>()(
  immer((set) => ({
    config: null,
    async getConfig() {
      const result = await callApi('getLocalConfig')
      set({
        config: result
      })
    },
    async updateConfig(key: keyof IConfig, value: IConfig[keyof IConfig]) {
      const config = await callApi('setLocalConfig', key, value)
      set({
        config
      })
      return config
    }
  }))
)

export default useLocalConfigStore
