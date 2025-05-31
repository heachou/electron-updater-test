import { TRegisterConfigNames } from '@/main/data'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const callApi = window.electron.invoke

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 克，转 千克，保留 1 位小数, 不足 1 千克的，保留 2 位小数
export const convertToKg = (g: number = 0) => {
  const kg = g / 1000
  if (kg < 1) {
    return parseFloat(kg.toFixed(2))
  } else {
    return parseFloat(kg.toFixed(1))
  }
}

export const toDouble = (num: number) => {
  if (num < 10) {
    return `0${num}`
  }
  return `${num}`
}

export const genHourMinute = (hour: number = 0, minute: number = 0) => {
  return `${toDouble(hour)}:${toDouble(minute)}`
}

export const generateDoorTimeConfigForAllDoors = (
  putterState: Record<TRegisterConfigNames, ParsedData> | null | undefined
) => {
  console.log('putterState', putterState)
  if (!putterState) {
    return undefined // 或者返回一个默认的空配置结构
  }

  const doors: Record<
    'door1' | 'door2' | 'door3' | 'door4',
    Array<{ startTime: string; endTime: string }>
  > = {
    door1: [],
    door2: [],
    door3: [],
    door4: []
  }
  for (let i = 1; i <= 4; i++) {
    const doorKey = `door${i}` as 'door1' | 'door2' | 'door3' | 'door4'
    doors[doorKey] = []
    for (let j = 1; j <= 4; j++) {
      const startTime = `${genHourMinute(putterState?.[`门${i}开始小时${j}` as TRegisterConfigNames]?.value as number, putterState?.[`门${i}开始分钟${j}` as TRegisterConfigNames]?.value as number)}`
      const endTime = `${genHourMinute(putterState?.[`门${i}关闭小时${j}` as TRegisterConfigNames]?.value as number, putterState?.[`门${i}关闭分钟${j}` as TRegisterConfigNames]?.value as number)}`
      doors[doorKey].push({ startTime, endTime })
    }
  }
  return doors
}

// 判断当前的时间是否在给定的时间范围内
export const isTimeInRange = (startTime: string, endTime: string, currentTime: string) => {
  // 解析时间字符串
  const [startHour, startMin] = startTime.split(':')
  const [endHour, endMin] = endTime.split(':')
  const start = dayjs().set('hour', Number(startHour)).set('minute', Number(startMin))
  const end = dayjs().set('hour', Number(endHour)).set('minute', Number(endMin))
  const current = dayjs(currentTime)

  // 校验解析是否成功
  if (!start.isValid() || !end.isValid() || !current.isValid()) {
    console.error('提供给 isTimeInRange 的时间格式无效:', { startTime, endTime, currentTime })
    return false // 或者根据您的错误处理策略抛出错误
  }

  const isAfterOrSameAsStart = current.isSame(start, 'minute') || current.isAfter(start, 'minute')
  const isBeforeOrSameAsEnd = current.isSame(end, 'minute') || current.isBefore(end, 'minute')
  return isAfterOrSameAsStart && isBeforeOrSameAsEnd
}

export const createFixedLengthArray = (arr: number[], fixedLength: number = 12): number[] => {
  const result = new Array(fixedLength).fill(0)
  for (let i = 0; i < Math.min(arr.length, fixedLength); i++) {
    result[i] = arr[i]
  }
  return result
}
