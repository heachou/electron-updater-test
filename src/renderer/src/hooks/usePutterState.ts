import { registerConfigs } from '@/main/data'
import usePuttingEquipmentStore from '@renderer/store/puttingEquipmentStore'
import { callApi } from '@renderer/utils'
import { useRequest } from 'ahooks'
import { useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'

// 辅助函数：查找配置
const findConfig = (address: number) => registerConfigs.find((c) => c.address === address)

export const usePutterState = () => {
  const { opened, getOpened, openPuttingEquipmentPort, updatePutterState, putterState } =
    usePuttingEquipmentStore(
      useShallow((state) => {
        // 添加 setRegisters
        return {
          openPuttingEquipmentPort: state.openPuttingEquipmentPort,
          opened: state.opened,
          getOpened: state.getOpened,
          updatePutterState: state.updatePutterState, // 获取更新状态的方法
          putterState: state.putterState // 获取状态
        }
      })
    )

  const connect = useCallback(async () => {
    const isOpen = await getOpened()
    if (isOpen) return
    await openPuttingEquipmentPort()
  }, [getOpened, openPuttingEquipmentPort])

  const getState = useCallback(async () => {
    if (!registerConfigs) {
      return
    }

    // 1. 对配置按地址排序
    const sortedConfigs = [...registerConfigs].sort((a, b) => a.address - b.address)

    const allResults: ParsedData[] = []
    const chunkSize = 16 // 每次读取的最大数量

    let currentBlockStartAddress = -1
    let currentBlockRegisterCount = 0

    try {
      // 2. 遍历排序后的配置，识别连续块
      for (let i = 0; i < sortedConfigs.length; i++) {
        const config = sortedConfigs[i]
        const currentAddress = config.address

        if (currentBlockStartAddress === -1) {
          // 开始新块
          currentBlockStartAddress = currentAddress
          currentBlockRegisterCount = 1
        } else {
          // 检查是否连续
          const previousAddress = sortedConfigs[i - 1].address
          if (currentAddress === previousAddress + 1) {
            // 地址连续，增加块计数
            currentBlockRegisterCount++
          } else {
            // 地址不连续，处理上一个块
            await readBlock(
              currentBlockStartAddress,
              currentBlockRegisterCount,
              chunkSize,
              allResults
            )
            // 开始新块
            currentBlockStartAddress = currentAddress
            currentBlockRegisterCount = 1
          }
        }

        // 如果是最后一个配置，处理当前块
        if (i === sortedConfigs.length - 1) {
          await readBlock(
            currentBlockStartAddress,
            currentBlockRegisterCount,
            chunkSize,
            allResults
          )
        }
      }
      return allResults
    } catch (error) {
      console.error('Error reading registers:', error)
    }
  }, [])

  const initialedRef = useRef(false)
  // 获取状态, 每60秒执行一次
  const {
    cancel: cancelGetPutterDeviceStateInterval,
    runAsync: startPollingPutterState,
    refresh: refreshPutterState
  } = useRequest(getState, {
    pollingInterval: 60 * 1000,
    manual: true,
    onSuccess: (result) => {
      if (result) {
        updatePutterState(result)
      }
      initialedRef.current = true
    }
  })
  // 开启或关闭定时使能  开始/停止
  const { runAsync: startPutterDeviceEnable } = useRequest(
    async (flag: boolean) => {
      return callApi('startPutterDeviceEnable', flag)
    },
    {
      manual: true,
      onSuccess: (result) => {
        startPollingPutterState()
      }
    }
  )

  return {
    opened,
    connect,
    getState,
    startPutterDeviceEnable,
    startPollingPutterState,
    refreshPutterState: refreshPutterState,
    putterState
  }
}

// 辅助函数：读取一个地址块（如果块太大则分片）
async function readBlock(
  blockStartAddress: number,
  blockRegisterCount: number,
  chunkSize: number,
  resultsArray: ParsedData[]
) {
  if (blockRegisterCount <= 0) return
  for (
    let currentChunkStart = blockStartAddress;
    currentChunkStart < blockStartAddress + blockRegisterCount;
    currentChunkStart += chunkSize
  ) {
    const remainingInBlock = blockStartAddress + blockRegisterCount - currentChunkStart
    const countForThisChunk = Math.min(chunkSize, remainingInBlock)

    if (countForThisChunk <= 0) continue

    try {
      const chunkResult = await callApi('readMultipleRegisters', {
        startAddress: currentChunkStart,
        registerCount: countForThisChunk
      })

      if (chunkResult) {
        // 过滤掉那些不在原始配置中的地址的结果（虽然理论上不应该发生）
        const filteredResult = chunkResult.filter((item: ParsedData) => findConfig(item.address))
        resultsArray.push(...filteredResult)
      }
    } catch (error) {
      console.error(
        `Failed to read chunk: startAddress=${currentChunkStart}, count=${countForThisChunk}`,
        error
      )
      // 可以选择继续读取下一个块，或者在这里抛出错误停止整个过程
      // throw error; // 如果需要停止
    }
  }
}
