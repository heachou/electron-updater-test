import { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Card, Form, InputNumber, message, Switch, Typography } from 'antd'
import usePuttingEquipmentStore from '@renderer/store/puttingEquipmentStore'
import { useShallow } from 'zustand/react/shallow'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { callApi, sleep } from '@renderer/utils'
import { registerConfigs, TRegisterConfigNames } from '@/main/data'

const { Title } = Typography

// 类型定义
type RegisterConfig = {
  address: number
  name: string
  dataType: string
  decimalPoints?: number
  unit?: string
  readOnly?: boolean
  min?: number // 添加 min
  max?: number // 添加 max
}

interface UpdateTask {
  address: number
  value: number | boolean // 表单中的值
  rawValue: number // 转换后发送给 API 的值
  config: RegisterConfig // 对应的配置项
}

const PutterDeviceConfiguration = () => {
  const [form] = Form.useForm()
  const { putterState } = usePuttingEquipmentStore(
    useShallow((state) => {
      return {
        putterState: state.putterState
      }
    })
  )

  // 状态：更新队列和处理状态
  const [updateQueue, setUpdateQueue] = useState<UpdateTask[]>([])
  const isProcessingQueue = useRef(false) // 使用 ref 避免不必要的重渲染

  const initialValues = useMemo(() => {
    return registerConfigs.reduce(
      (acc, config) => {
        acc[`addr_${config.address}`] = putterState?.[config.name]?.value
        return acc
      },
      {} as Record<string, unknown>
    )
  }, [putterState])

  // 渲染配置项 (修正 InputNumber 的 min/max)
  const renderFormItem = (config: RegisterConfig) => {
    if (config.dataType === 'bool') {
      return (
        <Form.Item
          key={`item_${config.address}`} // 确保有 key
          name={`addr_${config.address}`}
          label={`${config.name}`}
          valuePropName="checked"
        >
          <Switch disabled={config.readOnly} />
        </Form.Item>
      )
    }

    if (config.readOnly) {
      return (
        <Form.Item key={`item_${config.address}`} label={`${config.name}`}>
          <span className="ant-form-text">
            {putterState?.[config.name as TRegisterConfigNames]?.value?.toString() ?? 'N/A'}{' '}
            {config.unit ?? ''}
          </span>
        </Form.Item>
      )
    }

    return (
      <Form.Item
        key={`item_${config.address}`} // 确保有 key
        name={`addr_${config.address}`}
        label={`${config.name}`}
        rules={[
          // 保留这里的 rules 以提供即时反馈
          { required: !config.readOnly, message: `请输入${config.name}` }, // 只对非只读项要求必填
          {
            validator: async (_, value) => {
              if (value === null || value === undefined || config.readOnly) {
                // 只读项不校验
                return
              }
              if (typeof value === 'number') {
                if (config.min !== undefined && value < config.min) {
                  throw new Error(`值必须大于或等于 ${config.min}`)
                }
                if (config.max !== undefined && value > config.max) {
                  throw new Error(`值必须小于或等于 ${config.max}`)
                }
              }
            }
          }
        ]}
      >
        <InputNumber
          disabled={config.readOnly}
          min={config.min} // 使用 config.min
          max={config.max} // 使用 config.max
          placeholder="请输入"
          precision={config.decimalPoints}
          addonAfter={config.unit}
          style={{ width: 160 }}
        />
      </Form.Item>
    )
  }

  // 按功能模块分组
  const moduleGroups = [
    {
      title: '环境监测',
      range: [0, 11],
      columns: 2
    },
    {
      title: '机械时序配置',
      range: [12, 26],
      columns: 3
    },
    {
      title: '门控模块1',
      range: [30, 51],
      columns: 3
    },
    {
      title: '门控模块2',
      range: [52, 73],
      columns: 3
    },
    {
      title: '门控模块3',
      range: [74, 95],
      columns: 3
    },
    {
      title: '门控模块4',
      range: [96, 117],
      columns: 3
    },
    {
      title: '照明控制',
      range: [120, 124],
      columns: 2
    }
  ]

  const navigate = useNavigate()

  const { runAsync: updatePutterConfig } = useRequest(
    async (task: UpdateTask) => {
      return callApi('writeSingleRegisters', {
        startAddress: task.address,
        value: task.rawValue // 发送转换后的原始值
      })
    },
    {
      manual: true,
      onError: (error, params) => {
        const task = params[0] as UpdateTask
        console.error(`Error updating ${task.config.name} (Address ${task.address}):`, error)
        // 可选：将失败的任务重新放回队列或标记为失败
        message.error(`更新${task.config.name}失败`)
      },
      onSuccess(data, [task]) {
        message.success(`成功更新${task.config.name}，值为${data.value}`)
      },
      onFinally: () => {
        // 不论成功或失败，都尝试处理下一个任务
        processNextTask()
      }
    }
  )

  // 处理队列中的下一个任务
  const processNextTask = useCallback(() => {
    setUpdateQueue((currentQueue) => {
      if (currentQueue.length === 0) {
        isProcessingQueue.current = false
        return [] // 返回空数组表示更新完成
      }
      const nextTask = currentQueue[0]
      updatePutterConfig(nextTask)
      return currentQueue.slice(1)
    })
  }, [updatePutterConfig]) // 依赖 updatePutterConfig

  // 启动队列处理（如果未在处理中）
  const startQueueProcessing = useCallback(() => {
    // 只有在队列不为空且未在处理中时才开始处理，避免重复处理同一个任务
    if (!isProcessingQueue.current) {
      isProcessingQueue.current = true
      processNextTask()
    }
  }, [processNextTask]) // 依赖队列长度和处理函数

  // 表单值变化时的处理函数 (修正验证逻辑)
  const handleValuesChange = useCallback(
    async (changedValues: Record<string, unknown>) => {
      // 不在这里立即触发全局验证
      await sleep(20)
      const tasksToAdd: UpdateTask[] = []
      const validationPromises: Promise<void>[] = [] // 存储验证的 Promise

      for (const key in changedValues) {
        if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
          const value = changedValues[key] as number | boolean
          const addressMatch = key.match(/^addr_(\d+)$/)

          if (addressMatch && value !== undefined && value !== null) {
            const address = parseInt(addressMatch[1], 10)
            const config = registerConfigs.find((c) => c.address === address) as RegisterConfig

            if (config && !config.readOnly) {
              // 1. 转换 rawValue
              let rawValue: number
              if (config.dataType === 'bool') {
                rawValue = value ? 1 : 0
              } else if (config.decimalPoints && typeof value === 'number') {
                rawValue = Math.round(value * Math.pow(10, config.decimalPoints))
              } else if (typeof value === 'number') {
                rawValue = value
              } else {
                console.warn(`Skipping update for ${key}: Cannot convert value ${value} to number.`)
                continue
              }

              // 2. 检查 Modbus 范围
              if (rawValue < 0 || rawValue > 65535) {
                console.warn(
                  `Skipping update for ${key}: Raw value ${rawValue} is out of uint16 range (0-65535).`
                )
                // message.error(`${config.name} 计算值 ${rawValue} 超出 Modbus 范围 (0-65535)`);
                continue // 不进行验证也不添加任务
              }
              const validationPromise = form
                .validateFields([key])
                .then(() => {
                  // 验证通过，准备添加任务
                  console.log(`Validation passed for ${key}`)
                  tasksToAdd.push({ address, value, rawValue, config })
                })
                .catch((errorInfo) => {
                  // 验证失败，Form 会显示错误，这里记录日志
                  console.log(`Validation failed for ${key}:`, errorInfo)
                })
              validationPromises.push(validationPromise)
            }
          }
        }
      }

      // 4. 等待所有验证完成
      Promise.all(validationPromises).then(() => {
        // 所有验证（可能成功或失败）都已结束
        if (tasksToAdd.length > 0) {
          console.log(`Adding ${tasksToAdd.length} tasks to the queue.`)
          setUpdateQueue((currentQueue) => [...currentQueue, ...tasksToAdd])
          // 使用 setTimeout 确保状态更新后执行
          setTimeout(startQueueProcessing, 0)
        }
      })
    },
    [form, startQueueProcessing]
  ) // 添加 form 依赖

  return (
    <div className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen relative">
      <div className="flex items-center justify-between">
        <Title level={3} className="mb-6 text-white">
          <span className="text-white">设备配置中心</span>
        </Title>
        <Button
          onClick={() => {
            navigate(-1)
          }}
        >
          返回
        </Button>
      </div>
      <Form form={form} initialValues={initialValues} onValuesChange={handleValuesChange}>
        {moduleGroups.map((group, index) => {
          const items = registerConfigs.filter(
            (c) => c.address >= group.range[0] && c.address <= group.range[1]
          )

          const colsClsMap = {
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4'
          }

          return (
            <Card
              key={index}
              title={group.title}
              className="mb-6 shadow-sm bg-white border-gray-700 text-white" // 调整样式
            >
              <div className={`grid ${colsClsMap[group.columns]} gap-x-6 gap-y-2`}>
                {/* 调整 gap */}
                {items.map((config) => (
                  <div key={config.address} className="col-span-1">
                    {renderFormItem(config)}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </Form>
    </div>
  )
}

export default PutterDeviceConfiguration
