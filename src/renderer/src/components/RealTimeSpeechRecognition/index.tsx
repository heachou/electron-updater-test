import React, { useState, useEffect, useRef, useCallback } from 'react'
import micAvif from './mic.avif'
import micSvg from './mic.svg'
import './index.css'
import { useRequest } from 'ahooks'
import { callApi } from '@renderer/utils'

const RealTimeSpeechRecognition: React.FC = () => {
  const [ready, readySet] = useState(false)
  const [active, activeSet] = useState<boolean>(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  useRequest(async () => {
    return callApi('initMainWebSocket')
  })

  const { run: sendMsg } = useRequest(
    (data) => {
      return callApi('sendMessageToWs', data)
    },
    {
      manual: true
    }
  )

  const startRecording = useCallback(async () => {
    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
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
        console.log('🚀 ~ startRecording ~ inputData16:', inputData16)
        sendMsg(inputData16.buffer)
      }

      audioInputRef.current.connect(scriptProcessorRef.current)
      scriptProcessorRef.current.connect(audioContextRef.current.destination)
    } catch (e) {
      console.log('🚀 ~ startRecording ~ e:', e)
    }
  }, [sendMsg])

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
  }

  useEffect(() => {
    return () => {
      stopRecording()
      callApi('closeWs')
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (active) {
      stopRecording()
    } else {
      startRecording()
    }
    activeSet(!active)
  }, [active, startRecording])

  useEffect(() => {
    const handleOnReady = () => {
      readySet(true)
      // toggleRecording()
    }
    const dispose = window.electron.on('onAudioReady', handleOnReady)
    return () => {
      dispose()
    }
  }, [toggleRecording])

  useEffect(() => {
    const handleWsClose = () => {
      readySet(false)
      activeSet(false)
    }
    const dispose = window.electron.on('onWsClose', handleWsClose)
    return () => {
      dispose()
    }
  }, [])

  if (!ready) {
    return null
  }

  if (active) {
    return (
      <span
        onClick={toggleRecording}
        className="fixed z-10 cursor-pointer right-6 bottom-6 w-16 h-16 flex items-center justify-center bg-white rounded-full"
      >
        <div className="mic-btn-wave">
          <i className="outer-loop"></i>
          <i className="outer-loop auto-loop"></i>
          <i className="outer-loop auto-loop"></i>
        </div>
        <span className="bg-[#0070cc] w-12 h-12  flex items-center justify-center rounded-full z-30">
          <img src={micSvg} alt="mic" className="w-6 overflow-hidden" />
        </span>
      </span>
    )
  }

  return (
    <span
      onClick={toggleRecording}
      className="fixed z-20 cursor-pointer right-6 bottom-6 bg-white w-16 h-16 flex items-center justify-center overflow-hidden border-2 border-solid border-[#0070cc] rounded-full"
    >
      <img src={micAvif} alt="mic" className="w-6 overflow-hidden" />
    </span>
  )
}

export default RealTimeSpeechRecognition
