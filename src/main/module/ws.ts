import WebSocket from 'ws'
import { app, BrowserWindow } from 'electron'
import { sendMessageToWindow } from '../services'

let mainWindow: BrowserWindow | null = null

let ws: WebSocket | null = null

export function initMainWebSocket(window: BrowserWindow) {
  mainWindow = window
  const wsUrl = 'ws://localhost:8080'
  ws = new WebSocket(wsUrl)

  ws.on('open', () => {
    sendMessageToWindow('onWsOpen')
  })

  ws.on('message', (data) => {
    const message = data.toString()
    if (mainWindow) {
      sendMessageToWindow('onWsMessage', message)
    }
  })

  ws.on('error', (error) => {
    console.log('🚀 ~ ws.on ~ error:', error)
    sendMessageToWindow('onWsError', error)
  })

  ws.on('close', (code, reason) => {
    console.log('🚀 ~ ws.on ~ reason:', reason)
    console.log('🚀 ~ ws.on ~ code:', code)
    sendMessageToWindow('onWsClose')
  })

  // 可以在应用退出前关闭连接
  app.on('before-quit', () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  })

  return ws
}

export function sendMessageToWs(message: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message)
  }
}

export function closeWs() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close()
  }
}

export function getWs() {
  return ws
}

export function getWsStatus() {
  return ws?.readyState
}
