import { callApi } from '@renderer/utils'
import { useRequest } from 'ahooks'
import { Button, Divider, message, Spin } from 'antd'
import React, { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import useUserStore from '@renderer/store/userStore'
import FaceVideoModal from './faceVideoModal'
import PhoneLoginContainer from './phoneLoginContainer'
import useBarcodeScanner from '@renderer/hooks/useBarcodeScanner'

const UnAuth = () => {
  const [cameraOpen, setCameraOpen] = useState(false)

  const updateUserInfo = useUserStore((state) => state.updateUserInfo)

  const {
    data,
    loading,
    refresh: refreshLoginQrCode
  } = useRequest(
    async () => {
      return callApi('getLoginQrCode')
    },
    {
      retryCount: 3,
      onSuccess: (res) => {
        startGetScanQrCodeResult()
        console.log('扫码登录二维码生成成功', res)
      }
    }
  )
  // 轮询扫码登录结果
  const { run: startGetScanQrCodeResult, cancel: cancelPollingScanQrCodeResult } = useRequest(
    async () => {
      if (!data?.key) return Promise.reject()
      return callApi('appLogin', {
        type: 'scan-qr-code',
        code: data?.key || ''
      }) as unknown as Promise<IScanQrCodeUserInfoRes>
    },
    {
      pollingInterval: 2000,
      manual: true,
      onSuccess: (res) => {
        const { expire, user } = res
        const isExpire = dayjs(expire).isBefore(dayjs().valueOf(), 'second')
        if (isExpire) {
          refreshLoginQrCode()
        }
        if (user?.token) {
          updateUserInfo(user)
          cancelPollingScanQrCodeResult()
        }
      },
      onError: (err) => {
        // @ts-expect-error TODO
        const msg = err?.extra?.msg
        if (msg === 'code无效') {
          refreshLoginQrCode()
          return
        }
        if (msg) {
          message.error(msg)
        }
      }
    }
  )

  const { run: handleBarcodeScan } = useRequest(
    async (code) => {
      if (!code) return Promise.reject()
      const isFromWeChat = code.startsWith('qr_code:')
      return callApi('appLogin', {
        type: isFromWeChat ? 'qr-code' : 'card-no',
        code
      }) as unknown as Promise<UserInfo>
    },
    {
      manual: true,
      onSuccess: (user) => {
        if (user?.token) {
          updateUserInfo(user)
        }
        message.success('登录成功！')
      },
      onError: () => {
        message.error('登录失败！')
      }
    }
  )

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    preventInput: true
  })

  const handleStartFaceLogin = useCallback(() => {
    setCameraOpen(true)
    cancelPollingScanQrCodeResult()
  }, [cancelPollingScanQrCodeResult])

  const handleCloseFaceLogin = useCallback(
    ({ loginSuccess }: { loginSuccess: boolean }) => {
      setCameraOpen(false)
      if (!loginSuccess) {
        startGetScanQrCodeResult()
      }
    },
    [startGetScanQrCodeResult]
  )

  return (
    <Spin spinning={loading}>
      <div className="flex space-x-2 flex-1 items-center">
        <div className="flex flex-col items-center space-y-6 text-center min-w-80">
          <p className="text-bold text-xl">二维码</p>
          <p>微信扫一扫投递垃圾</p>
          <img src={`data:image/png;base64,${data?.qrCode}`} alt="" className="w-48" />
        </div>
        <div className="flex flex-col flex-1 space-y-3">
          <PhoneLoginContainer />
          <Divider />
          <Button
            onClick={handleStartFaceLogin}
            size="large"
            className="text-xl h-12 text-white bg-primary"
          >
            人脸识别登录
          </Button>
        </div>
        <div className="flex flex-col items-center space-y-6 text-center min-w-80">
          <p className="text-bold text-xl">小程序</p>
          <p>微信扫一扫进入小程序</p>
          <img src={`data:image/png;base64,${data?.qrCode}`} alt="" className="w-48" />
        </div>
      </div>
      {/* 摄像头模态框 */}
      {cameraOpen && <FaceVideoModal open={cameraOpen} onClose={handleCloseFaceLogin} />}
    </Spin>
  )
}

export default UnAuth
