import { Notification, NotificationConstructorOptions } from 'electron'

/**
 * 通知服务类
 * 封装 Electron 的 Notification 功能
 */
class NotificationService {
  /**
   * 显示基本通知
   * @param title 通知标题
   * @param body 通知内容
   * @param onClick 点击通知的回调函数
   */
  showNotification(title: string, body: string, onClick?: () => void): Notification {
    const notification = new Notification({
      title,
      body,
      silent: false
    })

    if (onClick) {
      notification.on('click', onClick)
    }

    notification.show()
    return notification
  }

  /**
   * 显示高级通知，支持更多自定义选项
   * @param options 通知选项
   * @param onClick 点击通知的回调函数
   */
  showAdvancedNotification(
    options: NotificationConstructorOptions,
    onClick?: () => void
  ): Notification {
    const notification = new Notification(options)

    if (onClick) {
      notification.on('click', onClick)
    }

    notification.show()
    return notification
  }

  /**
   * 显示成功通知
   * @param title 通知标题
   * @param body 通知内容
   * @param onClick 点击通知的回调函数
   */
  showSuccessNotification(title: string, body: string, onClick?: () => void): Notification {
    return this.showNotification(`✅ ${title}`, body, onClick)
  }

  /**
   * 显示错误通知
   * @param title 通知标题
   * @param body 通知内容
   * @param onClick 点击通知的回调函数
   */
  showErrorNotification(title: string, body: string, onClick?: () => void): Notification {
    return this.showNotification(`❌ ${title}`, body, onClick)
  }

  /**
   * 显示警告通知
   * @param title 通知标题
   * @param body 通知内容
   * @param onClick 点击通知的回调函数
   */
  showWarningNotification(title: string, body: string, onClick?: () => void): Notification {
    return this.showNotification(`⚠️ ${title}`, body, onClick)
  }

  /**
   * 显示带有图标的通知
   * @param title 通知标题
   * @param body 通知内容
   * @param icon 图标路径
   * @param onClick 点击通知的回调函数
   */
  showNotificationWithIcon(
    title: string,
    body: string,
    icon: string,
    onClick?: () => void
  ): Notification {
    const notification = new Notification({
      title,
      body,
      icon,
      silent: false
    })

    if (onClick) {
      notification.on('click', onClick)
    }

    notification.show()
    return notification
  }
}

// 导出通知服务实例
export const notificationService = new NotificationService()

// 导出默认实例
export default notificationService
