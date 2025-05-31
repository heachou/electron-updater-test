import { Card } from 'antd'
import React from 'react'
import UnAuth from './unAuth'
import useUserStore from '@renderer/store/userStore'
import Authed from './authed'

const LoginContainer = () => {
  const user = useUserStore((state) => state.userInfo)
  return (
    <div className="flex-1 min-h-0 px-2 flex justify-center items-center">
      <div className="bg-white flex w-full h-full justify-center items-center rounded-md">
        <Card className="w-full shadow-none border-none">{user ? <Authed /> : <UnAuth />}</Card>
      </div>
    </div>
  )
}

export default LoginContainer
