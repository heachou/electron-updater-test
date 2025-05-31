import { sendMessageToWindow } from '.'
import Store from 'electron-store'

const TOKEN_KEY = 'Authorization'
const USER_INFO_KEY = 'userInfo'

class UserService {
  private store: Store

  constructor() {
    // 获取 electron-store 实例
    this.store = new Store()
  }

  /**
   * 保存用户 Token
   * @param token - 用户 Token
   */
  public saveToken(token: string): void {
    this.store.set(TOKEN_KEY, token)
  }

  /**
   * 获取用户 Token
   * @returns 用户 Token 或 undefined
   */
  public getToken(): string | undefined {
    return this.store.get(TOKEN_KEY) as string | undefined
  }

  /**
   * 删除用户 Token
   */
  public deleteToken(): void {
    this.store.delete(TOKEN_KEY)
  }

  /**
   * 保存用户信息
   * @param userInfo - 用户信息对象
   */
  public saveUserInfo(userInfo: UserInfo): void {
    this.store.set(USER_INFO_KEY, userInfo)
    sendMessageToWindow('userInfoUpdated', userInfo)
  }

  /**
   * 获取用户信息
   * @returns 用户信息对象 或 undefined
   */
  public getUserInfo(): UserInfo | undefined {
    return this.store.get(USER_INFO_KEY) as UserInfo | undefined
  }

  /**
   * 删除用户信息
   */
  public deleteUserInfo(): void {
    this.store.delete(USER_INFO_KEY)
  }

  /**
   * 用户登出（清除 Token 和用户信息）
   */
  public logout(): void {
    this.deleteToken()
    this.deleteUserInfo()
    sendMessageToWindow('sessionExpired')
  }
}

export default UserService
