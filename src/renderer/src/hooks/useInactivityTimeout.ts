import { useEffect, useCallback, useRef } from 'react'

// 定义用户活动的事件类型
const USER_ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll' // 添加滚动事件作为用户活动
]

/**
 * 自定义 Hook，用于在用户一段时间无操作后执行回调。
 * @param onTimeout 超时后执行的回调函数。
 * @param timeoutMs 超时时间（毫秒）。
 */
export const useInactivityTimeout = (onTimeout: () => void, timeoutMs: number) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // 使用 ref 来存储最新的 onTimeout 回调，避免 useEffect 依赖频繁变更
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current() // 调用最新的回调
    }, timeoutMs)
  }, [timeoutMs])

  const handleUserActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    // 组件挂载时立即启动计时器
    resetTimer()

    // 为定义的用户活动事件添加监听器
    USER_ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    // 组件卸载时清理定时器和事件监听器
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      USER_ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [resetTimer, handleUserActivity]) // 依赖项确保回调变化时能正确处理

  // 如果需要，可以从 Hook 返回手动重置或清除计时器的方法
  // return { resetInactivityTimer: resetTimer, clearInactivityTimer: () => clearTimeout(timerRef.current) };
}
