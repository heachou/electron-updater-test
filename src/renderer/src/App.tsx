import React from 'react'
import { useCallback, useEffect } from 'react'
import { Alert } from 'antd'
import useLocalConfigStore from './store/localStore'
import { useMount } from 'ahooks'
import { usePutterState } from './hooks/usePutterState'
import { useWeightDevice } from './hooks/useWeightDevice'

function App({ children }: { children: React.ReactNode }) {
  const getConfig = useLocalConfigStore((state) => state.getConfig)
  const config = useLocalConfigStore((state) => state.config)

  useMount(() => {
    getConfig()
  })

  const {
    startPutterDeviceEnable,
    startPollingPutterState,
    opened,
    connect: connectPutterDevice
  } = usePutterState()
  const { startPollingWeightDevice, opened: weightDeviceOpened, connect } = useWeightDevice()

  useEffect(() => {
    connectPutterDevice().then(() => {
      console.log('🚀 ~ connectPutterDevice ~ connectPutterDevice:')
      startPollingPutterState()
    })
  }, [connectPutterDevice, startPollingPutterState])

  useEffect(() => {
    connect().then(() => {
      startPollingWeightDevice()
    })
  }, [connect, startPollingWeightDevice, weightDeviceOpened])

  const listenerUserloginSuccess = useCallback(() => {
    // 用户登录成功，开启所有的定时使能选项
    startPutterDeviceEnable(true)
    // 获取一次重量
    if (weightDeviceOpened) {
      startPollingWeightDevice()
    }
  }, [startPollingWeightDevice, startPutterDeviceEnable, weightDeviceOpened])

  useEffect(() => {
    const removeListner = window.electron.on('userLoginSuccess', listenerUserloginSuccess)
    return () => {
      removeListner()
    }
  }, [listenerUserloginSuccess])

  const listenerSessionExprired = useCallback(() => {
    // 用户退出登录
    if (config?.canPutWithoutAuth) {
      startPutterDeviceEnable(true)
    } else {
      startPutterDeviceEnable(false)
    }
    // 获取一次重量
    startPollingWeightDevice()
  }, [startPollingWeightDevice, startPutterDeviceEnable, config])

  useEffect(() => {
    const removeListner = window.electron.on('sessionExpired', listenerSessionExprired)
    return () => {
      removeListner()
    }
  }, [listenerSessionExprired])

  useEffect(() => {
    if (!config) {
      return
    }
    if (!opened) {
      return
    }
    // 如果可以不登录直接投递
    if (config?.canPutWithoutAuth) {
      startPutterDeviceEnable(true)
    } else {
      // 否则，关闭所有的定时使能选项
      startPutterDeviceEnable(false)
    }
  }, [config, config?.canPutWithoutAuth, opened])

  return (
    <>
      {(!opened || !weightDeviceOpened) && (
        <div className="absolute top-2 left-2 z-10">
          {!opened && <Alert message="推杆设备未连接" type="error" />}
          {!weightDeviceOpened && <Alert message="重量秤设备未连接" type="error" />}
        </div>
      )}
      {children}
    </>
  )
}

export default App
