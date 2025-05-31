import { parseResponseWithContext } from '../utils/modbusUtils'
import Service from './service'

export const setLocalConfig = (key: keyof IConfig, value: IConfig[keyof IConfig]): IConfig => {
  const store = Service.getInstance().store
  let config = store.get('config') as IConfig
  if (!config) {
    config = {} as IConfig
  }
  config[key] = value
  store.set('config', config)
  return config
}

export const getLocalConfig = (): IConfig => {
  const store = Service.getInstance().store
  const config = store.get('config') as IConfig
  return config || {}
}

// 检查端口是否为舱门设备
// 读取 24，25,25 号寄存器，如果是舱门设备，返回 当前时间
// 否则返回 0,0,0
export const checkPortIsPutterDevice = async (port: string) => {
  const client = Service.getInstance().modbusClient
  const rawResult = (await client.readRegisters({
    deviceAddress: 0x01,
    startAddress: 24,
    registerCount: 3,
    port
  })) as number[]
  const formattedResult = parseResponseWithContext(rawResult, 24)
  const [hour, minute, second] = formattedResult

  const isPutterDevice =
    (hour.value as number) >= 0 &&
    (hour.value as number) <= 23 &&
    (minute.value as number) >= 0 &&
    (minute.value as number) <= 59 &&
    (second.value as number) >= 0 &&
    (second.value as number) <= 59 &&
    hour.value !== minute.value &&
    minute.value !== second.value &&
    second.value !== 0
  if (isPutterDevice) {
    Service.getInstance().store.set('putterDevicePort', port)
  } else {
    Service.getInstance().store.set('weightDevicePort', port)
  }
  return { isPutterDevice }
}
