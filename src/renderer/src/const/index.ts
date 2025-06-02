export const LOGOUT_DELAY_SECONDS = 1800 // 180 秒

export const mediaDomain =
  process.env.NODE_ENV === 'development'
    ? 'https://test.cj88.net/dev-api'
    : 'https://cj88.net/prod-api'

export const defaultAvatarUrl =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
