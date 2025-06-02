import { Card } from 'antd'
import UnAuth from './unAuth'
import useUserStore from '@renderer/store/userStore'
import Authed from './authed'
import { QrcodeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'
import AutoCloseModal from '@renderer/components/autoCloseModal'

const LoginContainer = () => {
  const [open, showDeviceCodeModal] = useState(false)
  const user = useUserStore((state) => state.userInfo)

  const { data: code } = useRequest(async () => {
    return callApi('getAppId')
  })

  return (
    <>
      <div className="flex-1 min-h-0 px-2 relative">
        <div className="bg-white flex w-full h-full justify-center items-center rounded-md">
          <Card className="w-full shadow-none border-none">{user ? <Authed /> : <UnAuth />}</Card>
        </div>
        <span
          className="absolute right-4 bottom-2 flex items-center justify-center space-x-1 cursor-pointer text-gray-700"
          onClick={() => showDeviceCodeModal(true)}
        >
          <span className="text-xs">设备码</span>
          <QrcodeOutlined className="text-2xl" />
        </span>
      </div>
      <AutoCloseModal
        title="设备码"
        open={open}
        onCancel={() => showDeviceCodeModal(false)}
        footer={null}
        width={400}
        centered
        duration={40}
      >
        <div className="text-center flex items-center flex-col space-y-2">
          {code && <QRCodeSVG value={code} />}
          <div>设备码：{code}</div>
        </div>
      </AutoCloseModal>
    </>
  )
}

export default LoginContainer
