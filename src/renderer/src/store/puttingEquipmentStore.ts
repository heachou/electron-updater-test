import { TRegisterConfigNames } from '@/main/data'
import { callApi } from '@renderer/utils'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface PutEquipmentState {
  putterState: Record<TRegisterConfigNames, ParsedData> | undefined
  opened: boolean
  openPuttingEquipmentPort: () => Promise<void>
  onDisconnect: () => void
  getOpened: () => Promise<boolean>
  updatePutterState: (newState: ParsedData[]) => void
}

const usePuttingEquipmentStore = create<PutEquipmentState>()(
  immer((set) => ({
    putterState: undefined,
    // 状态
    opened: false,
    getOpened: async () => {
      const result = await callApi('getPuttingEquipmentOpenedState')
      set((state) => {
        state.opened = result
      })
      return result
    },
    openPuttingEquipmentPort: async () => {
      try {
        await callApi('openPuttingEquipmentPort')
        setTimeout(() => {
          set((state) => {
            state.opened = true
          })
        }, 1000)
      } catch (error) {
        console.log(error)
        set((state) => {
          state.opened = false
        })
        return Promise.reject(error)
      }
    },
    onDisconnect: () => {
      set((state) => {
        state.opened = false
      })
    },
    // 更新state
    updatePutterState: (newState: ParsedData[]) => {
      set((state) => {
        state.putterState = {
          ...state.putterState,
          ...newState.reduce(
            (acc, cur) => {
              acc[cur.name as TRegisterConfigNames] = cur
              return acc
            },
            {} as Record<TRegisterConfigNames, ParsedData>
          )
        }
      })
    }
  }))
)

export default usePuttingEquipmentStore
