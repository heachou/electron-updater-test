import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { createApplicationMenu } from './menu'
import { autoUpdater } from 'electron-updater'
import createIpcHandlers from './services'
import Service from './services/service'
import { encodeError } from './utils'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

// 自动更新配置
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })
  // 创建并设置应用程序菜单
  createApplicationMenu(mainWindow)

  // 保存 mainWindow 实例
  Service.getInstance().setInstance({ mainWindow })
  // 注册 IPC 处理程序
  Object.entries(createIpcHandlers()).forEach(([channel, handler]) => {
    ipcMain.handle(channel, async (_, ...args) => {
      try {
        return {
          // @ts-expect-error 类型问题
          result: await handler(...args)
        }
      } catch (error) {
        return {
          error: encodeError(error as Error, channel)
        }
      }
    })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    Service.getInstance().store.clear()
    Service.getInstance().setInstance({ mainWindow: null })
  })
  // 禁止缩放
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时,将会聚焦到 mainWindow 这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('ready', createWindow)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

process.on('message', (msg) => {
  if (msg === 'electron-vite&type=hot-reload') {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.reload()
    }
  }
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  console.log('🚀 ~ app.on ~ callback:', callback)
  console.log('🚀 ~ app.on ~ certificate:', certificate)
  console.log('🚀 ~ app.on ~ error:', error)
  event.preventDefault()
  callback(true) // 强制接受证书
})
