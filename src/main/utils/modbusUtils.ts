import { registerConfigs } from '../data'
import { convertInt16, convertUInt16 } from './dataTypeUtils' // 假设转换函数放在这里或另一个工具文件中

// 定义解析后的数据接口
export interface ParsedData {
  address: number // 寄存器地址
  name: string // 功能名称
  rawValue: number // 原始数值
  value: number | boolean // 转换后的实际值（含小数或布尔）
  unit?: string // 单位（如有）
}

/**
 * 解析读响应数据，并关联功能描述
 * @param rawValues - 从 Modbus 设备读取到的原始寄存器值数组 (number[])
 * @param startAddress - 请求的起始地址
 * @returns ParsedData[] 解析后的数据数组
 */
export function parseResponseWithContext(rawValues: number[], startAddress: number): ParsedData[] {
  // 遍历每个寄存器值，匹配配置表
  return rawValues.map((rawValue, index) => {
    const currentAddress = startAddress + index
    const config = registerConfigs.find((c) => c.address === currentAddress)

    if (!config) {
      return {
        address: currentAddress,
        name: '未知寄存器',
        rawValue,
        value: rawValue // 对于未知寄存器，直接返回原始值
      }
    }

    // 根据数据类型转换值
    let value: number | boolean
    switch (config.dataType) {
      case 'int16':
        // 注意：需要一个将 number (uint16) 转换为 int16 的函数
        // 假设 convertInt16 处理 number 输入
        value = convertInt16(rawValue, config.decimalPoints)
        break
      case 'bool':
        value = rawValue !== 0
        break
      case 'uint16': // 显式处理 uint16
      default:
        // 假设 convertUInt16 处理 number 输入
        value = convertUInt16(rawValue, config.decimalPoints)
    }

    return {
      address: currentAddress,
      name: config.name,
      rawValue,
      value,
      unit: config.unit
    }
  })
}
