import React, { useCallback, useEffect, useRef } from 'react'
import { Button, message, Modal } from 'antd'
import { useCounter, useRequest } from 'ahooks'
import { callApi, sleep } from '@renderer/utils'
import useUserStore from '@renderer/store/userStore'

interface Props {
  open: boolean
  onClose: ({ loginSuccess }: { loginSuccess: boolean }) => void
}

const MAX_WAIT_TIME = 45

const FaceVideoModal = ({ open, onClose }: Props) => {
  const [countdown, { dec }] = useCounter(MAX_WAIT_TIME, { min: 0, max: MAX_WAIT_TIME })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const updateUserInfo = useUserStore((state) => state.updateUserInfo)
  // 拍照并上传
  const faceLoginHandler = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return Promise.reject(new Error('获取图像失败'))

    const video = videoRef.current
    const canvas = canvasRef.current

    // 设置canvas尺寸与视频一致
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 在canvas上绘制当前视频帧
    const context = canvas.getContext('2d')

    if (context) {
      return new Promise((resolve, reject) => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        // 将canvas内容转换为Blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              return Promise.reject(new Error('获取图像失败'))
            }
            const arrayBuffer = await blob.arrayBuffer()
            const imageData = {
              arrayBuffer,
              filename: 'face.jpg',
              contentType: blob.type
            }
            try {
              // 调用人脸识别API
              const result = await callApi('faceLogin', imageData)
              return resolve(result)
            } catch (error) {
              console.error('人脸识别出错:', error)
              return reject(error)
            }
          },
          'image/jpeg',
          0.9
        )
      })
    }
  }, [])

  const {
    loading: faceLoginLoading,
    cancel,
    run: startFaceLogin
  } = useRequest(
    async () => {
      return faceLoginHandler()
    },
    {
      pollingInterval: 1500,
      manual: true,
      onSuccess: (res) => {
        message.success('登录成功')
        updateUserInfo(res as UserInfo)
        cancel()
        closeCamera({ loginSuccess: true })
        cancelSleep()
      }
    }
  )

  const { run: startRace, cancel: cancelSleep } = useRequest(
    async () => {
      return sleep(MAX_WAIT_TIME * 1000)
    },
    {
      manual: true,
      onSuccess: () => {
        cancel()
        closeCamera({ loginSuccess: false })
        message.warning('人脸识别超时，请重新登录')
      }
    }
  )

  // 关闭摄像头
  const closeCamera = useCallback(
    ({ loginSuccess }: { loginSuccess: boolean }) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      onClose({ loginSuccess })
      cancel()
    },
    [cancel, onClose]
  )

  // 启动摄像头
  const startCamera = useCallback(() => {
    window.navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setTimeout(() => {
            startFaceLogin()
            startRace()
          }, 1000)
        }
      })
      .catch((error) => {
        console.error('无法访问摄像头:', error)
        message.error('无法访问摄像头，请检查权限设置')
        onClose({ loginSuccess: false })
      })
  }, [onClose, startFaceLogin, startRace])

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        startCamera()
      }, 300)
    }
    return () => {
      cancel()
      cancelSleep()
    }
  }, [cancel, cancelSleep, open, startCamera])

  return (
    <Modal
      title={
        // 修改 title 来显示倒计时
        <div className="flex space-x-2 items-center">
          <span>人脸识别</span>
          {open && (
            <span className="text-sm text-gray-600 font-normal">剩余时间：{countdown} 秒</span>
          )}
        </div>
      }
      open={open}
      onCancel={() => closeCamera({ loginSuccess: false })}
      footer={[
        faceLoginLoading && (
          <Button key="ing" size="small" type="text" loading>
            识别中
          </Button>
        ),
        <Button key="back" onClick={() => closeCamera({ loginSuccess: false })}>
          取消
        </Button>
      ]}
      width={600}
      height={600}
    >
      <div className="flex flex-col items-center">
        <video
          ref={videoRef}
          style={{ width: '100%', maxHeight: '400px', backgroundColor: '#000' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="flex flex-col justify-center items-center mt-4">
          <p className="text-center">请将面部置于摄像头前</p>
        </div>
      </div>
    </Modal>
  )
}
export default FaceVideoModal
