import { INACTIVITY_TIMEOUT_MS } from '@renderer/const'
import { useInactivityTimeout } from '@renderer/hooks/useInactivityTimeout'
import Advertise from './advertise'
import AuthContainer from './authContainer'
import TrashList from './trashList'
import { useNavigate } from 'react-router-dom'
import useLongPress from '@renderer/hooks/useLongPress'

const Home = () => {
  const navigate = useNavigate()

  useInactivityTimeout(() => {
    navigate('/ads')
  }, INACTIVITY_TIMEOUT_MS)

  const longPressEvents = useLongPress({
    onLongPress: () => {
      navigate('/admin/login')
    }
  })
  return (
    <div className="relative">
      <div className="bg-primary h-screen pt-2 flex flex-col space-y-2">
        <Advertise />
        <AuthContainer />
        <TrashList />
      </div>
      <span
        {...longPressEvents}
        className="absolute cursor-pointer select-none px-4 py-1 rounded left-1/2 -translate-x-1/2 w-40 text-center bg-primary text-white top-0"
      >
        城洁环保
      </span>
    </div>
  )
}

export default Home
