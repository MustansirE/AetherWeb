import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Power } from 'lucide-react'

export function DeviceInfoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { device, roomName } = location.state || {}

  if (!device) {
    return (
      <div className="text-center text-gray-400 py-12">
        Device information not found.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/rooms-devices')}
          className="p-2 text-gray-400 hover:text-[#EAAC82] transition-colors rounded-lg hover-pulse"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-semibold text-white">Device Information</h1>
      </div>

      <div className="glass-card p-6 rounded-xl">
        <div className="grid gap-6">
          <InfoItem label="Name" value={device.name} />
          <InfoItem label="General Product Code" value={device.productCode} />
          <InfoItem label="Manufacturer" value={device.manufacturer} />
          <InfoItem label="Room" value={roomName} />
          <InfoItem label="Device ID" value={device.id} />
          <InfoItem 
            label="Average Energy Consumption (per hour)" 
            value={`${device.energyConsumption} kWh`} 
          />
          <InfoItem 
            label="Status" 
            value={
              <span className={device.isOn ? 'text-green-400' : 'text-red-400'}>
                <Power className="w-4 h-4 inline mr-1" />
                {device.status.toUpperCase()}
              </span>
            } 
          />
          <InfoItem label="Current Mode" value={device.mode} />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}