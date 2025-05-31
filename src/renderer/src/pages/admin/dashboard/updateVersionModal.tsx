import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'
import { ProgressInfo } from 'electron-updater'

interface IUpdateVersionModalProps {
  open: boolean
  onClose: () => void
  versionInfo?: {
    newVersion: string
    currentVersion: string
  }
}

const UpdateVersionModal = ({ open, onClose, versionInfo }: IUpdateVersionModalProps) => {
  const { data: updateInfo, loading } = useRequest(
    async () => {
      return callApi('get-versions')
    },
    {
      ready: open
    }
  )

  const [percent, perCentSet] = useState<ProgressInfo>()

  useEffect(() => {
    const dispose = window.electron.on('updateDownloaded', () => {
      onClose()
      Modal.success({
        title: '更新下载完成',
        content: '是否立即退出并安装更新？',
        okText: '立即安装',
        cancelText: '稍后安装',
        onOk: () => {
          onClose()
          callApi('quit-and-install')
        }
      })
    })
    return () => {
      dispose()
    }
  }, [onClose, updateInfo])

  useEffect(() => {
    const dispose = window.electron.on('updateProgress', (percent) => {
      perCentSet(percent)
    })
    return () => {
      dispose()
    }
  }, [onClose])

  const handleUpdate = () => {
    callApi('start-update')
  }

  return (
    <Modal
      loading={loading}
      title="发现新版本"
      open={open}
      onOk={handleUpdate}
      onCancel={onClose}
      okText="立即更新"
      cancelText="稍后提醒"
    >
      <p>当前版本: {versionInfo?.currentVersion}</p>
      <p>最新版本: {versionInfo?.newVersion}</p>
      <p>是否立即下载并安装更新？</p>
      {percent && percent.percent > 0 && <p>更新进度: {percent.percent.toFixed(2)}%</p>}
    </Modal>
  )
}
export default UpdateVersionModal
