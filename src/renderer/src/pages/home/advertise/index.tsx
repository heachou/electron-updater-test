import { MEDIA_TYPE } from '@/main/data'
import { mediaDomain } from '@renderer/const'
import { callApi, convertToKg } from '@renderer/utils'
import { useCountDown, useRequest } from 'ahooks'
import { Carousel, Card, Button, Modal, List, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

const { Text } = Typography

const Advertise = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const [targetDate, setTargetDate] = useState<number>()

  const [countdown] = useCountDown({
    targetDate,
    onEnd: () => {
      setIsModalVisible(false)
    }
  })

  const { data: bucketInfo } = useRequest(async () => callApi('getBucketInfo'), {
    cacheKey: 'getBucketInfo'
  })

  const { data: medias } = useRequest(async () => callApi('getMediaList', {}), {
    cacheKey: 'getMediaList'
  })
  const carouselItems = useMemo(() => {
    if (!medias) return []
    return medias
      .filter((m) => m.location === MEDIA_TYPE.app_home_slider)?.[0]
      ?.filePath.map((path, index) => ({
        id: index,
        alt: path,
        imageUrl: `${mediaDomain}${path}`
      }))
  }, [medias])

  const { data: putInReccordsRes, run: getPutInRecords } = useRequest(
    async () => {
      return callApi('getDevicePutInRecord', { deviceId: bucketInfo!.id, page: 1, size: 100 })
    },
    {
      ready: !!bucketInfo?.id,
      manual: true
    }
  )

  const showModal = () => {
    setIsModalVisible(true)
    getPutInRecords()
    setTargetDate(Date.now() + 60 * 1000)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  return (
    <>
      <Card
        className="mx-2 p-0 relative"
        styles={{
          body: {
            padding: 8
          }
        }}
      >
        <Carousel autoplay autoplaySpeed={10000} dots={false}>
          {carouselItems.map((item) => (
            <div key={item.id} className="h-[200px] overflow-hidden rounded">
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="w-auto h-full object-cover mx-auto"
              />
            </div>
          ))}
        </Carousel>
        <Button
          onClick={showModal}
          className="absolute right-4 top-4 bg-primary text-white"
          type="primary"
        >
          设备投递记录
        </Button>
      </Card>
      <Modal
        title="设备投递记录"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <span key="count" className="text-gray-500 mr-4">
            {Math.round(countdown / 1000)}秒将关闭弹窗
          </span>,
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>
        ]}
        width={600} // 可根据内容调整宽度
        centered
      >
        <List
          itemLayout="horizontal"
          dataSource={putInReccordsRes?.rows || []}
          pagination={{
            pageSize: 10,
            total: putInReccordsRes?.total || 0
          }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={null}
                description={
                  <div className="flex justify-between py-2">
                    <div className="flex space-x-4">
                      <Text strong>{item.category}</Text>
                      <Text>重量: {convertToKg(item.weight)} kg</Text>
                    </div>
                    <Text type="secondary">
                      时间: {dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无投递记录' }}
        />
      </Modal>
    </>
  )
}

export default Advertise
