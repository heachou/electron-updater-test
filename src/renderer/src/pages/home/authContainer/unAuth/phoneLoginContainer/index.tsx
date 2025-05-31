import { useState, useMemo } from 'react'
import { Input, Button, message, Space } from 'antd'
import { MobileOutlined, KeyOutlined, LoginOutlined } from '@ant-design/icons' // 引入图标
import { useRequest, useCountDown } from 'ahooks'
import { callApi } from '@renderer/utils'
import useUserStore from '@renderer/store/userStore'

const PhoneLoginContainer = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [targetDate, setTargetDate] = useState<number>() // 用于 ahooks 的 useCountDown
  const updateUserInfo = useUserStore((state) => state.updateUserInfo) // 获取更新用户信息的函数

  const [countdown] = useCountDown({ targetDate }) // 倒计时 hook

  // --- 手机号码格式校验 ---
  const isPhoneValid = useMemo(() => /^1\d{10}$/.test(phone), [phone])

  // --- 发送验证码请求 ---
  const { loading: sendCodeLoading, run: sendCodeRun } = useRequest(
    async (phoneNumber: string) => {
      return callApi('sendPhoneCode', phoneNumber)
    },
    {
      manual: true, // 手动触发
      onSuccess: () => {
        message.success('验证码已发送，请注意查收')
        setTargetDate(Date.now() + 60000) // 设置倒计时为 60 秒
      },
      onError: (error) => {
        console.log('🚀 ~ PhoneLoginContainer ~ error:', error)
        // 错误提示，优先使用后端返回的 message
        // @ts-expect-error ////
        message.error(error?.extra?.msg || '发送验证码失败，请稍后重试')
      }
    }
  )

  // --- 处理发送验证码点击事件 ---
  const handleSendCode = () => {
    if (isPhoneValid) {
      sendCodeRun(phone)
    } else {
      message.warning('请输入有效的 11 位手机号码')
    }
  }

  // --- 手机号+验证码登录请求 ---
  const { loading: loginLoading, run: loginRun } = useRequest(
    async (phoneNumber: string, verificationCode: string) => {
      const userInfo: UserInfo = await callApi('phoneLogin', {
        phone: phoneNumber,
        code: verificationCode
      })
      return userInfo
    },
    {
      manual: true, // 手动触发
      onSuccess: (userInfo) => {
        if (userInfo) {
          message.success('登录成功！')
          updateUserInfo(userInfo) // 更新全局用户状态
        } else {
          // 如果 API 可能在业务上成功但未返回 userInfo
          message.error('登录失败，未获取到用户信息')
        }
      },
      onError: (error) => {
        message.error(error?.message || '登录失败，请检查手机号或验证码')
      }
    }
  )

  // --- 处理登录点击事件 ---
  const handleLogin = () => {
    // 假设验证码固定为 6 位
    if (!isPhoneValid) {
      message.warning('请输入有效的 11 位手机号码')
      return
    }
    if (code.length !== 6) {
      message.warning('请输入 6 位验证码')
      return
    }
    loginRun(phone, code)
  }

  // --- 计算按钮禁用状态 ---
  // 发送验证码按钮：手机号无效 或 正在发送 或 正在倒计时
  const isSendCodeDisabled = !isPhoneValid || sendCodeLoading || countdown > 0
  // 登录按钮：手机号无效 或 验证码长度不足 或 正在登录
  const isLoginDisabled = !isPhoneValid || code.length !== 6 || loginLoading

  return (
    <div className="flex flex-col space-y-4 p-6 rounded-xl shadow-sm w-full mx-auto border border-gray-200">
      <h2 className="text-xl text-gray-600 font-bold">手机号码登录</h2>
      <Space direction="vertical" size="large" className="w-full">
        {/* 手机号输入 */}
        <Input
          prefix={<MobileOutlined className="text-gray-400 mr-2" />} // 图标和输入框间距
          placeholder="请输入 11 位手机号码"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // 只允许输入数字
          maxLength={11}
          size="large" // 使用大尺寸输入框
          allowClear
          type="tel"
          className="rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" // Tailwind 样式
        />
        {/* 验证码输入与发送按钮 */}
        <div className="flex items-center space-x-3">
          <Input
            prefix={<KeyOutlined className="text-gray-400 mr-2" />}
            placeholder="请输入验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // 只允许输入数字
            maxLength={6} // 假设验证码为 6 位
            size="large"
            className="flex-grow rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <Button
            type="primary"
            ghost // 使用幽灵按钮样式
            onClick={handleSendCode}
            loading={sendCodeLoading}
            disabled={isSendCodeDisabled}
            size="large"
            className={`w-36 flex-shrink-0 rounded-md transition duration-150 ease-in-out ${isSendCodeDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`} // Tailwind 样式
          >
            {countdown > 0 ? `${Math.round(countdown / 1000)}s 后重发` : '获取验证码'}
          </Button>
        </div>
        {/* 登录按钮 */}
        <Button
          type="primary"
          icon={<LoginOutlined />}
          onClick={handleLogin}
          loading={loginLoading}
          disabled={isLoginDisabled}
          size="large"
          className={`w-full rounded-md transition duration-150 ease-in-out ${isLoginDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`} // Tailwind 样式
        >
          登 录
        </Button>
      </Space>
    </div>
  )
}

export default PhoneLoginContainer
