import { callApi, createFixedLengthArray } from '@renderer/utils'
import { useCountDown, useRequest } from 'ahooks'
import { useCallback, useMemo, useState } from 'react'
import { useWeightDevice } from './useWeightDevice'
import { usePutterState } from './usePutterState'
import { message } from 'antd'

const useDeliveryAction = ({
  onCountdownEnd
}: {
  onCountdownEnd: (result: IPutInWeightRes) => void
}) => {
  const { startPollingWeightDevice } = useWeightDevice()
  const { putterState } = usePutterState()

  const [targetDate, setTargetDate] = useState<number>()

  // 开门时间和开门保持时间配置
  const openDoorTimeDurationState = useMemo(() => {
    if (!putterState) {
      return {
        door1: 0,
        door2: 0,
        door3: 0,
        door4: 0
      }
    }
    return {
      door1:
        ((putterState?.伸出时间1?.value as number) || 0) +
        ((putterState?.开门保持时间1?.value as number) || 0),
      door2:
        ((putterState?.伸出时间2?.value as number) || 0) +
        ((putterState?.开门保持时间2?.value as number) || 0),
      door3:
        ((putterState?.伸出时间3?.value as number) || 0) +
        ((putterState?.开门保持时间3?.value as number) || 0),
      door4:
        ((putterState?.伸出时间4?.value as number) || 0) +
        ((putterState?.开门保持时间4?.value as number) || 0)
    }
  }, [putterState])

  const { runAsync: openPutterDevice, loading } = useRequest(
    async (startAddress: number) => {
      return callApi('writeSingleRegisters', {
        startAddress,
        value: 1
      })
    },
    {
      manual: true,
      onError: () => {
        message.error('打开失败')
      }
    }
  )

  const { runAsync: startRefreshPollingPutterState } = useRequest(
    async () => {
      return callApi('getPutterDoorOpenedState')
    },
    {
      manual: true
    }
  )

  // 用于记录上一次的 weightState
  const beforeStart = useCallback(
    async (startAddress: number, doorKey: keyof typeof openDoorTimeDurationState) => {
      await openPutterDevice(startAddress)
      await startRefreshPollingPutterState()
      setTargetDate(Date.now() + openDoorTimeDurationState[doorKey] * 1000)
    },
    [openDoorTimeDurationState, openPutterDevice, startRefreshPollingPutterState]
  )

  const [countdown] = useCountDown({
    targetDate,
    async onEnd() {
      const weight = await startPollingWeightDevice()
      const result = await callApi('uploadPutInWeight', createFixedLengthArray(weight, 12))
      onCountdownEnd?.(result)
    }
  })

  return {
    openPutterDevice: beforeStart,
    loading,
    countdown: Math.round(countdown / 1000)
  }
}

export default useDeliveryAction
