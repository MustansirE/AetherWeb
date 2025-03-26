import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { GuestLoginPage } from './pages/GuestLoginPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { HomePage } from './pages/HomePage'
import { RoomsAndDevicesPage } from './pages/RoomsAndDevicesPage'
import { EnergyStatsPage } from './pages/EnergyStatsPage'
import { AmbianceModePage } from './pages/AmbianceModePage'
import { RoutinePage } from './pages/RoutinePage'
import { DeviceSharingPage } from './pages/DeviceSharingPage'
import { MyGuestPage } from './pages/MyGuestPage'
import { SettingsPage } from './pages/SettingsPage'
import { DeviceInfoPage } from './pages/DeviceInfoPage'
import { GuestHomePage } from './pages/GuestHomePage'
import { TutorialPage } from './pages/Tutorial'
import { ThemeProvider } from './pages/ThemeContext.tsx';

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/guest-login" element={<GuestLoginPage />} />
        <Route path="/guest-dashboard" element={<GuestHomePage />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rooms-devices" element={<RoomsAndDevicesPage />} />
          <Route path="device/:id" element={<DeviceInfoPage />} />
          <Route path="energy-stats" element={<EnergyStatsPage />} />
          <Route path="ambiance" element={<AmbianceModePage />} />
          <Route path="routines" element={<RoutinePage />} />
          <Route path="device-sharing" element={<DeviceSharingPage />} />
          <Route path="my-guests" element={<MyGuestPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App