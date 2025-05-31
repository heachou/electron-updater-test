import { Alert, Modal } from 'antd'
import React from 'react'

interface IDoorOpenStatusModalProps {
  countdown: number
  onClose: () => void
}

const DoorOpenStatusModal = ({ countdown, onClose }: IDoorOpenStatusModalProps) => {
  return (
    <Modal
      open
      centered
      title={'提示'}
      width={600}
      okText="确定"
      cancelButtonProps={{
        className: 'hidden'
      }}
      okButtonProps={{
        className: 'w-40 bg-primary'
      }}
      styles={{
        body: {
          padding: 0,
          margin: 0
        }
      }}
      onClose={onClose}
      onOk={onClose}
    >
      <Alert
        className="py-3 text-base"
        description={`系统将在${countdown}秒后关闭仓门，请尽快投递`}
        type="warning"
        showIcon
      />
      <p className="text-center py-16 text-3xl font-bold">仓门已打开</p>
    </Modal>
  )
}

export default DoorOpenStatusModal
