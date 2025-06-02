import WebSocket from 'ws'
import { app } from 'electron'
import { sendMessageToWindow } from '../services'
import RPCClient from '@alicloud/pop-core'
import Service from '../services/service'
import { v4 as uuidv4 } from 'uuid'

let ws: WebSocket | null = null

interface IRpcTokenResult {
  Token: {
    Id: string
    UserId: string
    ExpireTime: number
  }
}

const WS_TOKEN_KEY = 'WS_TOKEN_KEY'

export const getWsToken = async () => {
  const store = Service.getInstance().store
  const token = store.get(WS_TOKEN_KEY) as IRpcTokenResult['Token']
  if (token && token.Id && token.ExpireTime * 1000 > Date.now()) {
    return token.Id
  }
  const client = new RPCClient({
    accessKeyId: 'LTAI5tAu3mdpBNSdZpQCYk71' || import.meta.env.VITE_ALIYUN_AK_ID,
    accessKeySecret: 'VITE_ALIYUN_AK_SECRET' || import.meta.env.VITE_ALIYUN_AK_SECRET,
    endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28'
  })
  const result: IRpcTokenResult = await client.request('CreateToken', {})
  store.set(WS_TOKEN_KEY, result.Token)
  return result.Token.Id
}

export async function initMainWebSocket() {
  const token = await getWsToken()
  const wsUrl = `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=${token}`
  ws = new WebSocket(wsUrl)

  ws.on('open', () => {
    const startTranscriptionMessage = {
      header: {
        appkey: 'sLn8vbSMMGd8LwlX' || import.meta.env.VITE_APP_ID,
        namespace: 'SpeechTranscriber',
        name: 'StartTranscription',
        task_id: uuidv4(),
        message_id: uuidv4()
      },
      payload: {
        format: 'pcm',
        sample_rate: 16000,
        enable_intermediate_result: true,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true
      }
    }

    ws.send(JSON.stringify(startTranscriptionMessage))
  })

  ws.on('message', (event) => {
    console.log('🚀 ~ ws.on ~ event:', event)
    const message = event.data ? JSON.parse(event.data) : {}
    if (message.header?.name === 'TranscriptionStarted') {
      // // 启用开始录音按钮
      sendMessageToWindow('onAudioReady')
    }
  })

  ws.on('error', (error) => {
    sendMessageToWindow('onWsError', error)
  })

  ws.on('close', (code, reason: Buffer) => {
    console.log('🚀 ~ ws.on ~ reason:', reason.toString())
    console.log('🚀 ~ ws.on ~ code:', code)
    sendMessageToWindow('onWsClose')
    ws = null
  })

  // 可以在应用退出前关闭连接
  app.on('before-quit', () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  })
  return true
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
