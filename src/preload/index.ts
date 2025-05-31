import { contextBridge, ipcRenderer } from 'electron'
import { IpcHandlerKey, ISendMessageKey, IpcHandlers, ISendMessageToWindow } from '../main/services'

contextBridge.exposeInMainWorld('electron', {
  // 主进程通信方法
  invoke: async <T extends IpcHandlerKey>(channel: T, ...args: any[]) => {
    try {
      const { error, result } = await ipcRenderer.invoke(channel, ...args)
      if (error) {
        return Promise.reject(error)
      }
      return result
    } catch (error) {
      console.error(`Error invoking ${channel}:`, error)
      return Promise.reject(error) // 或者你可以返回一个默认值或处理 erro
    }
  },

  // 监听渲染进程事件
  on: <T extends ISendMessageKey>(channel: T, callback: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  }
})

// 类型定义，供渲染进程使用
declare global {
  interface Window {
    electron: {
      invoke: <T extends IpcHandlerKey>(
        channel: T,
        ...args: Parameters<IpcHandlers[T]>
      ) => Promise<ReturnType<IpcHandlers[T]>>
      on: <T extends ISendMessageKey>(
        channel: T,
        callback: (...args: Parameters<ISendMessageToWindow[T]>) => void
      ) => () => void
    }
  }
}
