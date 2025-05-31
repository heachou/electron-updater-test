import { sendMessageToWindow } from '../services'
import ModbusRTU from 'modbus-serial' // 引入 modbus-serial

// 这里先用 any，具体类型根据库的文档或实际返回确定
type ModbusResponseData = unknown

export class ModbusClient {
  // 使用 Map 存储每个端口对应的 modbus-serial 客户端实例
  private modbusClients = new Map<string, ModbusRTU>()
  private static instance: ModbusClient

  private constructor() {}

  public static getInstance(): ModbusClient {
    if (!ModbusClient.instance) {
      ModbusClient.instance = new ModbusClient()
    }
    return ModbusClient.instance
  }

  public async openPort(portPath: string, options = { baudRate: 115200 }): Promise<void> {
    if (this.modbusClients.has(portPath)) {
      const existingClient = this.modbusClients.get(portPath)
      if (existingClient?.isOpen) {
        console.warn(`Modbus client for port ${portPath} is already open.`)
        return // 已经打开，直接返回
      } else {
        // 客户端存在但已关闭，清理旧实例
        this.modbusClients.delete(portPath)
      }
    }

    return new Promise((resolve, reject) => {
      const client = new ModbusRTU() // 创建 modbus-serial 客户端

      // 添加生命周期监听器，必须在 connect 之前设置
      this.addClientLifecycleListeners(portPath, client)
      console.log('openPort', portPath, options)
      // 使用 modbus-serial 的 connect 方法
      client
        .connectRTUBuffered(portPath, {
          ...options
        })
        .then(() => {
          console.log(`Modbus client connected successfully on port ${portPath}.`)
          this.modbusClients.set(portPath, client) // 存储 modbus-serial 客户端实例
          client.open(resolve)
        })
        .catch((err) => {
          console.error(`Error connecting modbus client on port ${portPath}:`, err)
          // this.modbusClients.delete(portPath); // 确保在错误时清理
          reject(new Error(`Failed to open port ${portPath}: ${err.message}`))
        })
    })
  }

  public isPortOpen(portPath: string): boolean {
    // 通过 modbus-serial 客户端的状态判断
    const client = this.modbusClients.get(portPath)
    return !!client && client.isOpen
  }

  public async closePort(portPath: string): Promise<void> {
    const client = this.modbusClients.get(portPath)

    if (client && client.isOpen) {
      return new Promise((resolve) => {
        // modbus-serial 的 close 是异步的，并且会触发 'close' 事件
        client.close(() => {
          console.log(`Modbus client for port ${portPath} command to close issued.`)
          // 清理逻辑移到 'close' 事件监听器中

          resolve()
        })
      })
    } else {
      // 如果客户端不存在或已关闭，确保从 Map 中移除
      this.modbusClients.delete(portPath)
      return Promise.resolve()
    }
  }

  // 使用 modbus-serial 的 API 读取寄存器
  // 注意：返回类型可能需要根据实际需要调整，这里返回库的原始响应或 number[]
  public async readRegisters(
    params: ReadRequestParams & { port: string }
  ): Promise<ModbusResponseData | number[]> {
    const client = this.modbusClients.get(params.port)
    if (!client || !client.isOpen) {
      throw new Error(`Port ${params.port} is not open or modbus client not available.`)
    }

    try {
      // 设置目标设备 ID
      client.setID(params.deviceAddress)

      // client.setTimeout(3000);

      const response = await client.readHoldingRegisters(params.startAddress, params.registerCount)
      // 你可以根据需要返回整个响应对象或仅返回 data 数组
      return response.data // 返回解析后的数字数组
    } catch (error) {
      console.error(`Error reading registers on port ${params.port}:`, error)
      throw error // 重新抛出错误，让调用者处理
    }
  }

  // 使用 modbus-serial 的 API 写入单个寄存器
  // 注意：返回类型可能需要根据实际需要调整
  public async writeSingleRegisters(
    params: WriteSingleRequestParams & { port: string }
  ): Promise<{ address: number; value: number }> {
    const client = this.modbusClients.get(params.port)
    if (!client || !client.isOpen) {
      throw new Error(`Port ${params.port} is not open or modbus client not available.`)
    }

    try {
      // 设置目标设备 ID
      client.setID(params.deviceAddress)
      // 设置超时 (可选)
      client.setTimeout(3000)
      // 调用 modbus-serial 的写单个寄存器方法
      // writeRegister 返回 Promise<{ address: number, value: number }>
      const response = await client.writeRegister(params.startAddress, params.value)
      return response as unknown as Promise<{ address: number; value: number }> // 返回库的响应对象
    } catch (error) {
      console.error(`Error writing single register on port ${params.port}:`, error)
      throw error
    }
  }

  // 简化监听器，只处理 modbus-serial 客户端的生命周期事件
  private addClientLifecycleListeners(portPath: string, client: ModbusRTU) {
    // modbus-serial 客户端的 close 事件
    client.on('close', () => {
      // 从 Map 中移除实例
      this.modbusClients.delete(portPath)
      // 发送断开连接消息
      sendMessageToWindow('equipmentDisconnect')
    })

    // modbus-serial 客户端本身的 error 事件
    client.on('error', (error) => {
      console.error(`Error on modbus client for port ${portPath}:`, error)
      // 发生错误时，通常连接会关闭，触发 'close' 事件进行清理
      // 可以选择在这里发送错误消息
      sendMessageToWindow('equipmentError')
      // 尝试显式关闭以确保清理，closePort 会处理 client 不存在或已关闭的情况
      this.closePort(portPath).catch((err) =>
        console.error(`Failed to close port ${portPath} after error:`, err)
      )
    })
  }
}
