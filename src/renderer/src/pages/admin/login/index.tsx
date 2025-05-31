import React from 'react'
import { Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'

const { Title } = Typography

const AdminLogin = () => {
  const navigate = useNavigate()

  const { run: handleAdminLogin } = useRequest(
    async (params) => {
      return callApi('adminLogin', params)
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('登录成功')
        navigate('/admin/dashboard')
      }
    }
  )

  const onFinishFailed = () => {
    message.error('请输入用户名和密码！')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <Title level={2} className="text-center text-white mb-8">
          <span className="text-white">后台管理登录</span>
        </Title>
        <Form
          name="admin_login"
          initialValues={{ remember: true }}
          onFinish={handleAdminLogin}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          size="large" // 使输入框和按钮更大
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
            <Input
              prefix={<UserOutlined className="site-form-item-icon text-gray-400" />}
              placeholder="用户名"
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码!' }]}>
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
              type="password"
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <div className="space-y-4">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
              >
                登 录
              </Button>
              <Button type="primary" onClick={() => navigate('/')} className="w-full">
                退 出
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default AdminLogin
