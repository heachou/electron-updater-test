import { ModbusClient } from './../module/modbusClient'
import { BrowserWindow } from 'electron'
import Store from 'electron-store'
import UserService from './user'

class Service {
  public mainWindow: BrowserWindow | null = null
  public modbusClient: ModbusClient = ModbusClient.getInstance()
  public store: Store = new Store()
  public user: UserService = new UserService()
  private static instance: Service

  private constructor() {}

  public setInstance({ mainWindow }: { mainWindow: BrowserWindow | null }) {
    this.mainWindow = mainWindow
  }

  // 获取单例实例的静态方法
  public static getInstance(): Service {
    if (!Service.instance) {
      Service.instance = new Service()
    }
    return Service.instance
  }
  //
}

export default Service
