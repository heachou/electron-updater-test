import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SettingOutlined, // 推杆设置
  CloudSyncOutlined, // 版本检测 (云同步/更新图标)
  LogoutOutlined,
  CloseCircleFilled,
  CheckCircleFilled,
  SettingFilled // 退出系统
} from '@ant-design/icons'
import { Button, Card, Tag, Typography, message } from 'antd' // 用于标题和可能的退出提示
import { useMount, useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'
import { usePutterState } from '@renderer/hooks/usePutterState'
import usePuttingEquipmentStore from '@renderer/store/puttingEquipmentStore'
import useWeightDeviceStore from '@renderer/store/weightDeviceStore'
import UpdateVersionModal from './updateVersionModal'

const { Title } = Typography

// 定义模块接口
interface AdminModule {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  path?: string // 导航路径 (可选)
  action?: () => void // 点击动作 (可选)
}

const AdminMDashboard = () => {
  const navigate = useNavigate()
  const { putterState, startPollingPutterState, opened } = usePutterState()

  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, versionInfoSet] = useState({
    newVersion: '',
    currentVersion: ''
  })
  console.log('🚀 ~ AdminMDashboard ~ updateAvailable:', updateAvailable)

  useMount(() => {
    if (!opened) {
      return
    }
    // 更新配置
    startPollingPutterState()
  })

  const checkUpdate = useCallback(async () => {
    try {
      message.info('正在检查更新...')
      const { hasUpdate, newVersion, currentVersion } = await callApi('check-update')
      if (!hasUpdate) {
        message.destroy()
        message.success('当前已是最新版本')
      } else {
        setUpdateAvailable(true)
        versionInfoSet({
          newVersion: newVersion!,
          currentVersion
        })
      }
    } catch (error) {
      console.error('Failed to check update:', error)
    }
  }, [])

  // 定义模块列表
  const modules: AdminModule[] = [
    {
      key: 'putter-system',
      title: '整体设置',
      description: '配置整体系统参数',
      icon: <SettingFilled className="text-4xl text-red-400" />,
      path: '/admin/system'
    },
    {
      key: 'putter-settings',
      title: '推杆设置',
      description: '配置设备推杆参数',
      icon: <SettingOutlined className="text-4xl text-cyan-400" />,
      path: '/admin/putter'
    },
    // {
    //   key: 'weight-calibration',
    //   title: '称重校准',
    //   description: '校准垃圾箱称重传感器',
    //   icon: <ExperimentOutlined className="text-4xl text-lime-400" />,
    //   path: '/admin/calibration',
    // },
    {
      key: 'version-check',
      title: '版本检测',
      description: '检查并更新系统软件版本',
      icon: <CloudSyncOutlined className="text-4xl text-amber-400" />,
      action: () => checkUpdate()
    },
    {
      key: 'exit-system',
      title: '退出系统',
      description: '安全退出后台管理系统',
      icon: <LogoutOutlined className="text-4xl text-rose-500" />,
      action: () => {
        navigate('/')
      }
    }
  ]

  const handleModuleClick = (module: AdminModule) => {
    if (module.path) {
      navigate(module.path)
    } else if (module.action) {
      module.action()
    }
  }

  const { data: deviceList = [], runAsync: refreshDeviceList } = useRequest(async () => {
    return callApi('listDevices')
  })

  const filterDeviceList = useMemo(() => {
    return deviceList.filter((device) => {
      return device.path.includes('usbserial')
    })
  }, [deviceList])
  // 确定烟雾报警状态和颜色
  const smokeStatusText = putterState?.烟雾报警标志?.value ? '报警' : '正常'
  const smokeStatusColor = putterState?.烟雾报警标志?.value ? 'error' : 'success'
  const smokeStatusIcon = putterState?.烟雾报警标志?.value ? (
    <CloseCircleFilled />
  ) : (
    <CheckCircleFilled />
  )

  const tempStatusText = putterState?.温度报警标志?.value ? '报警' : '正常'
  const tempStatusColor = putterState?.温度报警标志?.value ? 'error' : 'success'
  const tempStatusIcon = putterState?.温度报警标志?.value ? (
    <CloseCircleFilled />
  ) : (
    <CheckCircleFilled />
  )

  const { data: deviceCode } = useRequest(async () => {
    return callApi('getAppId')
  })

  const setPutterDeviceOpened = usePuttingEquipmentStore((state) => state.getOpened)
  const setWeightDeviceOpened = useWeightDeviceStore((state) => state.getOpened)

  const toggleStatus = async (device: IDeviceInfo) => {
    if (device.open) {
      await callApi('closeDevice', {
        path: device.path
      })
    } else {
      await callApi('openDevice', {
        path: device.path
      })
      const result = await callApi('checkPortIsPutterDevice', device.path)
      // 如果是推杆设备，需要进行初始化
      if (result.isPutterDevice) {
        await setPutterDeviceOpened()
        message.success('推杆设备初始化成功')
      } else {
        await setWeightDeviceOpened()
        message.success('称重设备初始化成功')
      }
    }
    await refreshDeviceList()
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
        <Title level={2} className="text-center text-white mb-12">
          <span className="text-white">系统设置模块</span>
        </Title>
        <Card
          title="设备列表"
          className="shadow-sm mb-4"
          extra={
            <Button type="link" onClick={refreshDeviceList}>
              刷新
            </Button>
          }
        >
          {filterDeviceList.map((device) => (
            <div key={device.path} className="mb-2">
              <div className="space-x-10 flex items-center">
                <div>
                  <span className="text-gray-400">设备路径:</span> {device.path}
                  <span className="">({device.open ? '已打开' : '未开启'})</span>
                </div>
                <Button onClick={() => toggleStatus(device)}>
                  {device.open ? '断开' : '打开'}
                </Button>
              </div>
            </div>
          ))}
        </Card>
        <Card title="实时状态" className="shadow-sm mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-blue-600 font-semibold mb-2">烟雾状态</h3>
              <p className="text-2xl">
                {putterState?.当前烟雾?.value ?? '- -'}
                <span className="text-sm ml-2 text-gray-500">ppm</span>
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-blue-600 font-semibold mb-2">烟雾报警标志</h3>
              <div className="flex space-x-4">
                <Tag icon={smokeStatusIcon} color={smokeStatusColor} className="text-lg px-4 py-1">
                  {smokeStatusText}
                </Tag>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-orange-600 font-semibold mb-2">当前温度</h3>
              <p className="text-2xl">
                {putterState?.当前温度?.value ?? '- -'}
                <span className="text-sm ml-2 text-gray-500">℃</span>
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-green-600 font-semibold mb-2">温度报警标志</h3>
              <div className="flex space-x-4">
                <Tag icon={tempStatusIcon} color={tempStatusColor} className="text-lg px-4 py-1">
                  {tempStatusText}
                </Tag>
              </div>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((module) => (
            <div
              key={module.key}
              onClick={() => handleModuleClick(module)}
              className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-in-out hover:bg-opacity-70 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1"
            >
              <div className="mb-4">{module.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-100">{module.title}</h3>
              <p className="text-sm text-gray-400">{module.description}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-300 py-3 text-sm">设备编号：{deviceCode}</p>
      </div>
      <UpdateVersionModal
        open={updateAvailable}
        onClose={() => setUpdateAvailable(false)}
        versionInfo={versionInfo}
      />
    </>
  )
}

export default AdminMDashboard
