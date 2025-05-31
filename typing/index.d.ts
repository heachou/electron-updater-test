// IPC通信类型定义
interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  vendorId?: string
  productId?: string
}

// 类型定义 -----------------------------------------------------------------
interface ReadRequestParams {
  deviceAddress: number // 设备地址 (1-247)
  startAddress: number // 起始寄存器地址 (0-65535)
  registerCount: number // 读取寄存器数量 (1-125)
}

interface WriteSingleRequestParams {
  deviceAddress: number // 设备地址 (1-247)
  startAddress: number // 寄存器地址 (0-65535)
  value: number // 写入值 (0-65535)
}

interface WriteMultipleRequestParams {
  deviceAddress: number // 设备地址 (1-247)
  startAddress: number // 起始寄存器地址 (0-65535)
  values: number[] // 写入值数组 (每个元素 0-65535)
}

type DataType = 'uint16' | 'int16' | 'bool'
interface RegisterConfig {
  address: number // 寄存器地址
  name: string // 功能名称（如 "当前温度"）
  dataType: DataType // 数据类型
  decimalPoints?: number // 小数点位数（如温度可能为1位）
  unit?: string // 单位（如 "℃"）
  readOnly: boolean // 是否只读
}

/** 解析后的数据项 */
interface ParsedData {
  address: number // 寄存器地址
  name: string // 功能名称
  rawValue: number // 原始数值
  value: number | boolean // 转换后的实际值（含小数或布尔）
  unit?: string // 单位（如有）
}

interface IPutInWeightRes {
  fullInfo: boolean
  putInWeightInfo: number[]
  score: number
  weight: number
}

interface IDeviceInfoRes {
  createBy: string
  createTime: string
  updateBy: string
  updateTime: string
  remark?: null | string
  id: number
  projectId: number
  name: string
  code: string
  callCode: string
  residentialCommunity: string
  lat: string
  lng: string
  pointLocation: string
  location: string
  deviceBucketList: {
    createBy: string
    createTime: string
    updateBy: null | string
    updateTime: null | string
    remark: string
    id: number
    deviceId: number
    bucket: number
    category: '厨余垃圾' | '可回收物' | '有害垃圾' | '其他垃圾'
    weight: number
    full: boolean
  }[]
  weights: number[] | null
  full: null | boolean
  status: number
  project: {
    createBy: string
    createTime: string
    updateBy: string
    updateTime: null | string
    remark: null | string
    id: number
    name: string
    area: string
    startTime: string
    endTime: string
  }
}

interface IConfig {
  canPutWithoutAuth: boolean
}

interface IPutInStatRes {
  cnt: number
  weight: number
  score: number
}

interface IPutInRecordRes {
  total: number
  rows: {
    id: number
    weight: number
    createTime: string
    category: string
  }[]
}

interface IDeviceInfo {
  path: string
  manufacturer: string | undefined
  locationId: string | undefined
  productId: string | undefined
  vendorId: string | undefined
  open: boolean
}

interface IMedia {
  url: any
  createBy: string
  createTime: string
  updateBy: string
  updateTime: string
  remark?: string
  id: number
  location: string
  filePath: string[]
}
