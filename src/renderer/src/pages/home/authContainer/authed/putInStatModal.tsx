import React, { useEffect } from 'react'
import { Modal, Table, Typography, Statistic, Space, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs' // 用于格式化日期
import { useRequest } from 'ahooks'
import { callApi, convertToKg } from '@renderer/utils'

const { Title } = Typography

interface PutInStatModalProps {
  visible: boolean
  onClose: () => void
}

const PutInStatModal: React.FC<PutInStatModalProps> = ({ visible, onClose }) => {
  const {
    loading: statLoading,
    data: stat,
    run: getStat
  } = useRequest(
    async () => {
      return callApi('getUserPutStat')
    },
    {
      manual: true
    }
  )

  const {
    loading: tableLoading,
    run: getTableData,
    data: tableData
  } = useRequest(
    async (params) => {
      return callApi('getUserPutInRecord', params)
    },
    {
      manual: true
    }
  )

  useEffect(() => {
    if (visible) {
      getStat()
      getTableData({
        page: 1,
        pageSize: 100
      })
    }
  }, [getStat, getTableData, visible])

  const columns: ColumnsType<{
    id: number
    weight: number
    createTime: string
  }> = [
    {
      title: '投递时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      defaultSortOrder: 'descend'
    },
    {
      title: '垃圾类别',
      dataIndex: 'category',
      key: 'category',
      render: (category?: string) => category || '-'
    },
    {
      title: '重量 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      align: 'right',
      render: (weight: number) => convertToKg(weight),
      sorter: (a, b) => a.weight - b.weight
    }
  ]

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null} // 可以自定义 footer，例如一个关闭按钮
      width={800} // 根据内容调整宽度
      centered
    >
      <Spin spinning={statLoading}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>投递记录</Title>
          <Space size="large" wrap>
            <Statistic title="投递总次数" value={stat?.cnt} />
            <Statistic
              title="投递总重量 (kg)"
              value={convertToKg(stat?.weight || 0)}
              precision={2}
            />
            <Statistic title="获得总积分" value={stat?.score} />
          </Space>
        </div>
        <Title level={5} style={{ marginBottom: 16 }}>
          详细记录（仅展示仅 100 条）
        </Title>
        <Table
          columns={columns}
          loading={tableLoading}
          rowKey={'id'}
          dataSource={tableData?.rows || []} // 为 Table 的每一行添加唯一的 key
          pagination={{ pageSize: 5, showSizeChanger: false }} // 简单的分页配置
          size="small"
        />
      </Spin>
    </Modal>
  )
}

export default PutInStatModal
