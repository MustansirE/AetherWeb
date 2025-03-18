import React from 'react'
import { 
  LightbulbOff,
  Fan,
  Lock,
  Power,
  Music,
  Tv
} from 'lucide-react'

interface SmartControlProps {
  icon: React.ElementType
  label: string
  value: string | boolean
  onClick: () => void
  type: 'toggle' | 'slider'
}

export function SmartControl({ icon: Icon, label, value, onClick, type }: SmartControlProps) {
  const isActive = typeof value === 'boolean' ? value : parseInt(value as string) > 0

  return (
    <div 
      className={`glass-card p-4 rounded-xl cursor-pointer transition-all duration-300 hover-pulse
        ${isActive ? 'border-[#EAAC82] border' : 'border-transparent border'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-6 w-6 ${isActive ? 'text-[#EAAC82]' : 'text-gray-400'}`} />
        <div className={`w-8 h-4 rounded-full relative ${isActive ? 'bg-[#EAAC82]' : 'bg-gray-600'}`}>
          <div 
            className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all duration-300
              ${isActive ? 'right-0.5' : 'left-0.5'}`}
          />
        </div>
      </div>
      <div className="text-sm font-medium text-white">{label}</div>
      {type === 'slider' && (
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value as string} 
          onChange={(e) => onClick()}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      )}
    </div>
  )
}

export function SmartControlsGrid() {
  const [controls, setControls] = React.useState({
    lights: '80',
    fan: false,
    lock: true,
    tv: false,
    music: '60',
    power: true
  })

  const handleControl = (key: keyof typeof controls) => {
    setControls(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key] === '0' ? '100' : '0'
    }))
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <SmartControl
        icon={LightbulbOff}
        label="Lights"
        value={controls.lights}
        onClick={() => handleControl('lights')}
        type="slider"
      />
      <SmartControl
        icon={Fan}
        label="Fan"
        value={controls.fan}
        onClick={() => handleControl('fan')}
        type="toggle"
      />
      <SmartControl
        icon={Lock}
        label="Smart Lock"
        value={controls.lock}
        onClick={() => handleControl('lock')}
        type="toggle"
      />
      <SmartControl
        icon={Tv}
        label="TV"
        value={controls.tv}
        onClick={() => handleControl('tv')}
        type="toggle"
      />
      <SmartControl
        icon={Music}
        label="Music"
        value={controls.music}
        onClick={() => handleControl('music')}
        type="slider"
      />
      <SmartControl
        icon={Power}
        label="Power Saving"
        value={controls.power}
        onClick={() => handleControl('power')}
        type="toggle"
      />
    </div>
  )
}