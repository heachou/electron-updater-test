import React from 'react'
import { useRef, useEffect } from 'react'
import { Modal } from 'antd'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'

type ModalType = 'info' | 'success' | 'error' | 'warning'
// 定义 Modal.info() 等函数返回的实例类型，主要需要 destroy 和 update 方法
type ModalControl = ReturnType<ModalStaticFunctions[ModalType]>

interface AutoCloseModalConfig {
  title: React.ReactNode
  content: React.ReactNode
  durationMs?: number // 倒计时关闭的时间，单位毫秒
  type?: ModalType
  onClose?: () => void // 关闭后的回调
  centered?: boolean
  maskClosable?: boolean
  footer?: React.ReactNode // 允许自定义 footer，默认为 null
}

export const useAutoCloseModal = () => {
  const [modal, contextHolder] = Modal.useModal()
  const modalInstanceRef = useRef<ModalControl | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentOnCloseRef = useRef<(() => void) | undefined>(undefined)

  const showModal = (config: AutoCloseModalConfig) => {
    // 清理上一个可能存在的 modal 和 interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (modalInstanceRef.current) {
      modalInstanceRef.current.destroy()
      modalInstanceRef.current = null
    }

    currentOnCloseRef.current = config.onClose
    const duration = config.durationMs === undefined ? 3000 : config.durationMs // 默认3秒
    const modalType = config.type || 'info'

    if (!['info', 'success', 'error', 'warning'].includes(modalType)) {
      console.error('useAutoCloseModal: Unsupported modal type provided.')
      return
    }

    let secondsRemaining = Math.ceil(duration / 1000)

    const getModalContent = (remaining: number) => (
      <div>
        {config.content}
        {duration > 0 && remaining > 0 && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: 'grey' }}>
            将在 {remaining} 秒后自动关闭...
          </p>
        )}
      </div>
    )

    // 如果持续时间小于等于0，则立即关闭（或不显示倒计时并允许手动关闭，取决于设计）
    // 这里我们让它显示，然后立即触发关闭逻辑
    if (duration <= 0) {
      modalInstanceRef.current = modal[modalType]({
        title: config.title,
        content: getModalContent(0), // 显示内容，但不显示倒计时文本
        footer: config.footer === undefined ? null : config.footer,
        centered: config.centered === undefined ? true : config.centered,
        maskClosable: config.maskClosable === undefined ? false : config.maskClosable,
        onOk: () => currentOnCloseRef.current?.(), // 如果有OK按钮，确保回调
        onCancel: () => currentOnCloseRef.current?.() // 如果有关闭按钮，确保回调
      })
      // 立即销毁并执行回调
      // 使用 setTimeout 确保 modal 实例已创建完毕
      setTimeout(() => {
        if (modalInstanceRef.current) {
          modalInstanceRef.current.destroy()
          modalInstanceRef.current = null
        }
        currentOnCloseRef.current?.()
      }, 0)
      return
    }

    modalInstanceRef.current = modal[modalType]({
      title: config.title,
      content: getModalContent(secondsRemaining),
      footer: config.footer === undefined ? null : config.footer,
      centered: config.centered === undefined ? true : config.centered,
      maskClosable: config.maskClosable === undefined ? false : config.maskClosable
      // onOk 和 onCancel 通常在 info/success 等类型的 modal 中不直接通过按钮触发，
      // 而是通过 destroy()。如果需要按钮，可以自定义 footer。
    })

    intervalRef.current = setInterval(() => {
      secondsRemaining--
      if (modalInstanceRef.current) {
        modalInstanceRef.current.update({
          content: getModalContent(secondsRemaining)
        })
      }

      if (secondsRemaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (modalInstanceRef.current) {
          modalInstanceRef.current.destroy()
          modalInstanceRef.current = null
        }
        currentOnCloseRef.current?.()
      }
    }, 1000)
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (modalInstanceRef.current) {
        // 调用 destroy 而不是 update，因为组件卸载时 modal 也应该消失
        modalInstanceRef.current.destroy()
        modalInstanceRef.current = null
      }
    }
  }, [])

  return { showModal, contextHolder }
}
