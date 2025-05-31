import Service from '../services/service'

const getWeightDevicePort = () => {
  return Service.getInstance().store.get('weightDevicePort') as string
}

export const weightDeviceHandlers = () => {
  return {
    // 打开端口
    openWeightDevicePort: async () => {
      const client = Service.getInstance().modbusClient
      const port = getWeightDevicePort()
      await client.openPort(port, { baudRate: 115200 })
    },
    // 获取状态
    getWeightDeviceOpenedState: async () => {
      const client = Service.getInstance().modbusClient
      const port = getWeightDevicePort()
      return client.isPortOpen(port)
    },
    readWeightMultipleRegisters: async (params: {
      startAddress: number // 起始寄存器地址 (0-65535)
      registerCount: number // 读取寄存器数量 (1-125)
    }) => {
      const port = getWeightDevicePort()
      const client = Service.getInstance().modbusClient
      const rawResult = (await client.readRegisters({
        deviceAddress: 0x01,
        ...params,
        port
      })) as number[]
      return rawResult
    },
    writeWeightSingleRegisters: async (params: {
      startAddress: number // 起始寄存器地址 (0-65535)
      value: number // 要写入的值 (0-65535)
    }) => {
      const port = getWeightDevicePort()
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
