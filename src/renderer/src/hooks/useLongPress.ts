import { useRef, useCallback } from 'react'

interface LongPressOptions {
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void
  ms?: number // 长按阈值，默认 500ms
}

const useLongPress = ({ onLongPress, onClick, ms = 500 }: LongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressTriggered = useRef(false)

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      isLongPressTriggered.current = false // 重置状态
      // 阻止默认行为，例如触摸设备上的滚动
      // event.preventDefault();
      timerRef.current = setTimeout(() => {
        onLongPress(event)
        isLongPressTriggered.current = true
      }, ms)
    },
    [onLongPress, ms]
  )

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // 如果长按未触发，并且定义了 onClick，则执行单击回调
      if (!isLongPressTriggered.current && onClick) {
        onClick(event)
      }
      isLongPressTriggered.current = false // 重置状态
    },
    [onClick]
  )

  // 返回需要绑定到目标元素上的事件处理器
  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear, // 鼠标移出也清除定时器
    onTouchEnd: clear,
    onTouchCancel: clear // 触摸取消也清除
  }
}

export default useLongPress
