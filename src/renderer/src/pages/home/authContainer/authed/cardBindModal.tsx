import React, { useEffect, useRef } from 'react'
import { Button, message, Modal } from 'antd'
import { useCounter, useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'
import useBarcodeScanner from '@renderer/hooks/useBarcodeScanner'
import useUserStore from '@renderer/store/userStore'

interface Props {
  open: boolean
  onClose: () => void
}

const MAX_WAIT_TIME = 45

const CardBindModal = ({ open, onClose }: Props) => {
  const [countdown, { dec }] = useCounter(MAX_WAIT_TIME, { min: 0, max: MAX_WAIT_TIME })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const refreshUserInfo = useUserStore((state) => state.refreshUserInfo)

  useEffect(() => {
    if (open) {
      timerRef.current = setInterval(() => {
        dec()
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [dec, open])

  const { loading, run: startCardBind } = useRequest(
    async (cardNo: string) => {
      return callApi('bindCard', { cardNo })
    },
    {
      manual: true,
      ready: open,
      onSuccess: () => {
        message.success('卡号绑定成功')
        refreshUserInfo()
        onClose()
      }
    }
  )

  useBarcodeScanner({
    onScan: startCardBind,
    preventInput: true
  })

  return (
    <Modal
      title={
        <div className="flex space-x-2 items-center">
          <span>卡号绑定</span>
          {open && (
            <span className="text-sm text-gray-600 font-normal">剩余时间：{countdown} 秒</span>
          )}
        </div>
      }
      open={open}
      centered
      onCancel={() => onClose()}
      footer={[
        <Button key="back" onClick={() => onClose()} loading={loading}>
          取消
        </Button>
      ]}
      width={600}
      height={600}
    >
      <div className="flex flex-col items-center">
        <div className="flex flex-col justify-center items-center mt-4">
          <p className="text-center">请在扫码出进行扫码添加</p>
        </div>
      </div>
    </Modal>
  )
}
export default CardBindModal
