import React, { useMemo } from 'react'
import { Carousel } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'
import { MEDIA_TYPE } from '@/main/data'
import { mediaDomain } from '@renderer/const'

const AdsPage: React.FC = () => {
  const navigate = useNavigate()

  // 处理图片点击事件
  const handleImageClick = () => {
    navigate('/')
  }

  const { data: medias } = useRequest(async () => callApi('getMediaList', {}), {
    cacheKey: 'getMediaList'
  })
  const carouselItems = useMemo(() => {
    if (!medias) return []
    return medias
      .filter((m) => m.location === MEDIA_TYPE.app_ads_slider)?.[0]
      ?.filePath.map((path, index) => ({
        id: index,
        alt: path,
        imageUrl: `${mediaDomain}${path}`
      }))
  }, [medias])

  return (
    <div className="w-screen h-screen">
      <Carousel autoplay autoplaySpeed={3000} dots={true} className="h-full">
        {carouselItems.map((item) => (
          <div key={item.id} onClick={handleImageClick} className="carousel-item">
            <img src={item.imageUrl} alt={item.alt} className="w-screen h-screen" />
          </div>
        ))}
      </Carousel>
    </div>
  )
}

export default AdsPage
