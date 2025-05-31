import useLocalConfigStore from '@renderer/store/localStore'
import { Button, Card, Form, Switch } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const SystemConfig = () => {
  const config = useLocalConfigStore((state) => state.config)
  const updateConfig = useLocalConfigStore((state) => state.updateConfig)
  const navigate = useNavigate()
  return (
    <div className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen relative space-y-4">
      <Button onClick={() => navigate(-1)}>返回</Button>
      <Card title="系统配置">
        <Form
          initialValues={{
            ...config
          }}
        >
          <Form.Item label="未登录允许投递" name={'canPutWithoutAuth'}>
            <Switch onChange={(checked: boolean) => updateConfig('canPutWithoutAuth', checked)} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default SystemConfig
