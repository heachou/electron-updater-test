import request from '../utils/request'

/**
 * 查询媒体列表
 */
export const getMediaList = async (params: Record<string, unknown>): Promise<IMedia[]> => {
  const { data } = await request.get('/mini/api/media/list', {
    params
  })
  return data
}
