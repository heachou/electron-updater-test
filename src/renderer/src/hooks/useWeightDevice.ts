import { useRequest } from 'ahooks'
import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useWeightDeviceStore from '@renderer/store/weightDeviceStore'
import { callApi } from '@renderer/utils'

export const useWeightDevice = () => {
  const { opened, getOpened, openWeightDevicePort, updateWeightDeviceState } = useWeightDeviceStore(
    useShallow((state) => {
      // 添加 setRegisters
      return {
        openWeightDevicePort: state.openWeightDevicePort,
        opened: state.opened,
        getOpened: state.getOpened,
        updateWeightDeviceState: state.updateWeightDeviceState // 获取更新状态的方法
      }
    })
  )

  const connect = useCallback(async () => {
    const isOpen = await getOpened()
    if (isOpen) return
    await openWeightDevicePort()
  }, [getOpened, openWeightDevicePort])

  // TO DO bug
  const getState = useCallback(async () => {
    const res = await callApi('readWeightMultipleRegisters', { startAddress: 0, registerCount: 12 })
    console.log('🚀 ~ getState ~ res:', res)
    return res
  }, [])

  // 获取状态, 每60秒执行一次
  const { runAsync: startPollingWeightDevice, refresh: refreshWeightState } = useRequest(getState, {
    ready: opened,
    pollingInterval: 30 * 1000,
    manual: true,
    onSuccess(res) {
      updateWeightDeviceState(res)
    }
  })
  return {
    opened,
    connect,
    startPollingWeightDevice,
    refreshWeightState
  }
}
