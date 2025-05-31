import request from '../utils/request'

/**
 * 获取用户积分
 * @returns
 */
export const getUserScore = async (): Promise<IUserScoreInfo> => {
  const { data } = await request.get('/mini/api/user/score')
  return data
}

/**
 * 获取用户称重统计
 * @returns
 */
export const getUserPutStat = async (): Promise<IPutInStatRes> => {
  const { data } = await request.get('/mini/api/user/putIn/stat')
  return data
}

/**
 * 获取用户投递记录
 */
export const getUserPutInRecord = async (
  params: Record<string, unknown>
): Promise<IPutInRecordRes> => {
  const res = await request.get('/mini/api/user/putIn/records', {
    params
  })
  return res as unknown as IPutInRecordRes
}

/**
 * 获取设备投递记录
 */
export const getDevicePutInRecord = async (
  params: Record<string, unknown>
): Promise<IPutInRecordRes> => {
  const res = await request.get('/mini/api/device/putIn/records', {
    params
  })
  return res as unknown as IPutInRecordRes
}
