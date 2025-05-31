import { useEffect, useState } from 'react'

interface Versions {
  node: string
  chrome: string
  electron: string
  serialport: string
}

export function VersionInfo() {
  const [versions, setVersionions] = useState<Versions>({
    node: '',
    chrome: '',
    electron: '',
    serialport: ''
  })

  useEffect(() => {
    const getVersions = async () => {
      try {
        const versions = await window.electron.invoke('get-versions')
        setVersionions(versions)
      } catch (error) {
        console.error('Failed to get versions:', error)
      }
    }
    getVersions()
  }, [])

  return (
    <div className="text-sm text-gray-600 mb-4">
      We are using Node.js <span className="font-medium">{versions.node}</span>, Chromium{' '}
      <span className="font-medium">{versions.chrome}</span>, Electron{' '}
      <span className="font-medium">{versions.electron}</span>, and Serialport{' '}
      <span className="font-medium">{versions.serialport}</span>
    </div>
  )
}
