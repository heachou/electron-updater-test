import ReactDOM from 'react-dom/client'
import './index.css'
import { HashRouter, Route, Routes } from 'react-router-dom'
import NotFound from './pages/notFound'
import AdsPage from './pages/ads'
import Home from './pages/home'
import AdminLogin from './pages/admin/login'
import AdminMDashboard from './pages/admin/dashboard'
import PutterDeviceConfiguration from './pages/admin/putter'
import App from './App'
import SystemConfig from './pages/admin/system'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ads" element={<AdsPage />} />
        {/* 配置页面 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminMDashboard />} />
        <Route path="/admin/putter" element={<PutterDeviceConfiguration />} />
        <Route path="/admin/system" element={<SystemConfig />} />
        {/* 404 页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  </App>
)
