import { autoUpdater } from 'electron-updater'
import { app, dialog } from 'electron'
import Service from '../services/service'
import { sendMessageToWindow } from '../services'

export const createAutoUpdateHandlers = () => {
  const mainWindow = Service.getInstance().mainWindow

  // 自动更新事件
  autoUpdater.on('download-progress', (progress) => {
    sendMessageToWindow('updateProgress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    sendMessageToWindow('updateDownloaded')
  })

  return {
    'check-update': async () => {
      const res = await autoUpdater.checkForUpdates()
      const latestVersion = res?.updateInfo?.version
      return {
        hasUpdate: res?.updateInfo.version !== app.getVersion(),
        newVersion: latestVersion,
        currentVersion: autoUpdater.currentVersion.version
      }
    },
    'start-update': async () => {
      await autoUpdater.downloadUpdate()
    },
    'download-progress': async (progress: { percent: number }) => {
      mainWindow?.webContents.send('updateProgress', progress.percent)
    },
    'quit-and-install': async () => {
      try {
        autoUpdater.quitAndInstall(true, true)
        setTimeout(() => {
          app.relaunch()
          app.exit(0)
        }, 6000)
      } catch (e) {
        dialog.showErrorBox('Error', 'Failed to install updates')
      }
    },
    'get-versions': async () => {
      return {
        localVersion: app.getVersion(),
        remoteVersion: autoUpdater.currentVersion.version
      }
    }
  }
}
