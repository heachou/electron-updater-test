import { useCountDown } from 'ahooks'
import { Modal, ModalProps } from 'antd'
import React, { useEffect, useState } from 'react'

const AutoCloseModal = ({
  children,
  duration,
  ...rest
}: React.PropsWithChildren<ModalProps & { duration: number }>) => {
  const [targetDate, setTargetDate] = useState<number>()
  const [countdown] = useCountDown({
    targetDate,
    onEnd: () => {
      if (rest.open) {
        // @ts-ignore 关闭弹窗
        rest.onCancel?.()
      }
    }
  })

  useEffect(() => {
    if (rest.open) {
      setTargetDate(Date.now() + duration * 1000)
    }
  }, [duration, rest.open])

  return (
    <Modal {...rest}>
      {children}
      <p className="text-gray-500 text-xs">将于 {Math.round(countdown / 1000)} 秒后自动关闭</p>
    </Modal>
  )
}

export default AutoCloseModal
