import { registerConfigs } from '../data'
import Service from '../services/service'
import { parseResponseWithContext } from '../utils/modbusUtils'

const getPutterDevicePort = () => {
  return Service.getInstance().store.get('putterDevicePort') as string
}

export const puttingEquipmentHandlers = () => {
  return {
    // 打开端口
    openPuttingEquipmentPort: async () => {
      const client = Service.getInstance().modbusClient
      const port = getPutterDevicePort()
      await client.openPort(port, { baudRate: 115200 })
    },
    // 获取状态
    getPuttingEquipmentOpenedState: async () => {
      const client = Service.getInstance().modbusClient
      const port = getPutterDevicePort()
      return client.isPortOpen(port)
    },
    // 设置定时使能
    startPutterDeviceEnable: async (enable: boolean) => {
      const port = getPutterDevicePort()
      const allConfigs = registerConfigs.filter((config) => config.name.includes('定时使能'))
      const promiseList = allConfigs.map((config) => {
        return () =>
          Service.getInstance().modbusClient.writeSingleRegisters({
            deviceAddress: 0x01,
            startAddress: config.address,
            value: enable ? 1 : 0,
            port
          })
      })
      for (const promise of promiseList) {
        await promise()
      }
    },
    // 获取舱门开启状态
    getPutterDoorOpenedState: async () => {
      const port = getPutterDevicePort()
      const allConfigs = registerConfigs.filter((config) => config.name.includes('开门指令'))
      const promiseList = allConfigs.map((config) => {
        return () =>
          Service.getInstance().modbusClient.readRegisters({
            deviceAddress: 0x01,
            startAddress: config.address,
            registerCount: 1,
            port
          })
      })
      const resultList = []
      for (const promise of promiseList) {
        const res = await promise()
        resultList.push(res)
      }
      console.log(resultList)
    },

    readMultipleRegisters: async (params: {
      startAddress: number // 起始寄存器地址 (0-65535)
      registerCount: number // 读取寄存器数量 (1-125)
    }) => {
      const port = getPutterDevicePort()
      const client = Service.getInstance().modbusClient
      const rawResult = (await client.readRegisters({
        deviceAddress: 0x01,
        ...params,
        port
      })) as number[]
      const formattedResult = parseResponseWithContext(rawResult, params.startAddress)
      return formattedResult
    },
    writeSingleRegisters: async (params: {
      startAddress: number // 起始寄存器地址 (0-65535)
      value: number // 要写入的值 (0-65535)
    }) => {
      const port = getPutterDevicePort()
      const client = Service.getInstance().modbusClient
      const result = await client.writeSingleRegisters({
        deviceAddress: 0x01,
        ...params,
        port
      })
      return result
    }
  }
}
