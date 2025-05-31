import React, { useState, useEffect, useRef } from 'react'

const RealTimeSpeechRecognition: React.FC = () => {
  const [appkey, setAppkey] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [status, setStatus] = useState<string>('未连接')
  const [messages, setMessages] = useState<string[]>([])
  const [isStartButtonDisabled, setIsStartButtonDisabled] = useState<boolean>(true)
  const [isStopButtonDisabled, setIsStopButtonDisabled] = useState<boolean>(true)
  const [isDisconnectButtonDisabled, setIsDisconnectButtonDisabled] = useState<boolean>(true)

  const websocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const logMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message])
  }

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus)
  }

  const generateUUID = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
      .replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      )
      .replace(/-/g, '')
  }

  const connectWebSocket = () => {
    if (!appkey || !token) {
      logMessage('请输入 AppKey 和 Token')
      return
    }
    const socketUrl = `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=${token}`
    websocketRef.current = new WebSocket(socketUrl)

    websocketRef.current.onopen = () => {
      updateStatus('已连接')
      logMessage('连接到 WebSocket 服务器')
      const startTranscriptionMessage = {
        header: {
          appkey: appkey,
          namespace: 'SpeechTranscriber',
          name: 'StartTranscription',
          task_id: generateUUID(),
          message_id: generateUUID()
        },
        payload: {
          format: 'pcm',
          sample_rate: 16000,
          enable_intermediate_result: true,
          enable_punctuation_prediction: true,
          enable_inverse_text_normalization: true
        }
      }
      websocketRef.current?.send(JSON.stringify(startTranscriptionMessage))
      setIsDisconnectButtonDisabled(false)
    }

    websocketRef.current.onmessage = (event) => {
      logMessage('服务端: ' + event.data)
      try {
        const message = JSON.parse(event.data as string)
        if (message.header.name === 'TranscriptionStarted') {
          setIsStartButtonDisabled(false)
          setIsStopButtonDisabled(false)
        }
      } catch (error) {
        logMessage('解析服务端消息失败: ' + error)
      }
    }

    websocketRef.current.onerror = (event) => {
      updateStatus('错误')
      logMessage('WebSocket 错误: ' + event)
      setIsStartButtonDisabled(true)
      setIsStopButtonDisabled(true)
    }

    websocketRef.current.onclose = () => {
      updateStatus('断开连接')
      logMessage('与 WebSocket 服务器断开')
      setIsStartButtonDisabled(true)
      setIsStopButtonDisabled(true)
      setIsDisconnectButtonDisabled(true)
    }
  }

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    setIsDisconnectButtonDisabled(true)
    updateStatus('未连接')
  }

  const startRecording = async () => {
    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      })
      audioInputRef.current = audioContextRef.current.createMediaStreamSource(
        audioStreamRef.current
      )
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1)

      scriptProcessorRef.current.onaudioprocess = (event: AudioProcessingEvent) => {
        const inputData = event.inputBuffer.getChannelData(0)
        const inputData16 = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; ++i) {
          inputData16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff // PCM 16-bit
        }
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(inputData16.buffer)
          // logMessage('发送音频数据块'); // This can be too verbose
        }
      }

      audioInputRef.current.connect(scriptProcessorRef.current)
      scriptProcessorRef.current.connect(audioContextRef.current.destination)
      logMessage('录音已开始')
    } catch (e) {
      logMessage('录音失败: ' + e)
    }
  }

  const stopRecording = () => {
    if (scriptProcessorRef.current && audioContextRef.current) {
      scriptProcessorRef.current.disconnect()
    }
    if (audioInputRef.current && audioContextRef.current) {
      audioInputRef.current.disconnect()
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setIsStartButtonDisabled(true)
    setIsStopButtonDisabled(true)
    logMessage('录音已停止')
  }

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      stopRecording()
      disconnectWebSocket()
    }
  }, [])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <h1>实时语音识别</h1>
      <div>
        <label htmlFor="appkey">AppKey:</label>
        <input
          type="text"
          id="appkey"
          placeholder="请输入 AppKey"
          value={appkey}
          onChange={(e) => setAppkey(e.target.value)}
          style={{ margin: '5px' }}
        />
      </div>
      <div>
        <label htmlFor="token">Token:</label>
        <input
          type="text"
          id="token"
          placeholder="请输入 Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ margin: '5px' }}
        />
      </div>
      <div
        id="status"
        style={{ marginBottom: '10px', color: status === '已连接' ? 'green' : 'red' }}
      >
        {status}
      </div>
      <div
        id="messages"
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          height: '200px',
          overflowY: 'scroll',
          marginBottom: '10px'
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <button onClick={connectWebSocket} style={{ margin: '5px' }}>
        开始连接
      </button>
      <button
        onClick={startRecording}
        disabled={isStartButtonDisabled}
        id="startButton"
        style={{ margin: '5px' }}
      >
        开始录音
      </button>
      <button
        onClick={stopRecording}
        disabled={isStopButtonDisabled}
        id="stopButton"
        style={{ margin: '5px' }}
      >
        停止录音
      </button>
      <button
        onClick={disconnectWebSocket}
        disabled={isDisconnectButtonDisabled}
        id="disconnectButton"
        style={{ margin: '5px' }}
      >
        断开连接
      </button>
    </div>
  )
}

export default RealTimeSpeechRecognition
