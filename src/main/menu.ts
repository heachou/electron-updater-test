import { app, Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron'

export function createApplicationMenu(mainWindow: BrowserWindow | null) {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '查看',
      submenu: [
        {
          label: '切换开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools()
          }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  } else {
    // For Windows and Linux, add a File menu with Quit
    template.unshift({
      label: '文件',
      submenu: [{ role: 'quit' }]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // 隐藏菜单栏 (如果需要在 Windows 上显示菜单，则应删除或注释掉以下代码)
  if (process.platform === 'win32') {
    // mainWindow.setMenu(null); // 如果希望在Windows上也显示自定义菜单，注释或删除此行
  }
}
