import Service from './service'
import { createAutoUpdateHandlers } from '../ipcHandlers/autoUpdater'
import { puttingEquipmentHandlers } from '../ipcHandlers/puttingEquipment'
import * as appService from './app'
import * as weightService from './weight'
import { weightDeviceHandlers } from '../ipcHandlers/weightHandlers'
import * as scoreService from './score'
import * as configService from './config'
import * as mediaService from './media'
import { ProgressInfo } from 'electron-updater'
import * as wsService from '../module/ws'

const createIpcHandlers = () => ({
  ...puttingEquipmentHandlers(),
  ...createAutoUpdateHandlers(),
  ...weightDeviceHandlers(),
  ...appService,
  ...weightService,
  ...scoreService,
  ...configService,
  ...mediaService,
  ...wsService
})

export type IpcHandlers = ReturnType<typeof createIpcHandlers>
export type IpcHandlerKey = keyof IpcHandlers

export interface ISendMessageToWindow {
  updateProgress: (progress: ProgressInfo) => void
  updateDownloaded: () => void

  error: (error: Error) => void
  // 设备连接断开
  equipmentDisconnect: () => void
  equipmentError: (error?: Error) => void
  // 用户信息更新
  userInfoUpdated: (userInfo: UserInfo) => void
  // 登录过期
  sessionExpired: () => void
  userLoginSuccess: (user: UserInfo) => void
  // websocket
  onWsOpen: () => void
  onWsMessage: (message: string) => void
  onWsError: (error: Error) => void
  onWsClose: () => void
  // 自动更新
}

export type ISendMessageKey = keyof ISendMessageToWindow
export type ISendMessageArgs = Parameters<ISendMessageToWindow[ISendMessageKey]>

export const sendMessageToWindow = <E extends ISendMessageKey>(
  channel: E,
  ...args: Parameters<ISendMessageToWindow[E]>
) => {
  const mainWindow = Service.getInstance().mainWindow
  mainWindow?.webContents.send(channel, ...args)
}

export default createIpcHandlers
