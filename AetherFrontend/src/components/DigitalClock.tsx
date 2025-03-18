import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface DigitalClockProps {
  showSeconds?: boolean
  showDate?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function DigitalClock({ 
  showSeconds = true, 
  showDate = true,
  size = 'medium'
}: DigitalClockProps) {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    
    return () => {
      clearInterval(timer)
    }
  }, [])
  
  // Format time with leading zeros
  const formatTime = (num: number) => {
    return num.toString().padStart(2, '0')
  }
  
  const hours = formatTime(time.getHours())
  const minutes = formatTime(time.getMinutes())
  const seconds = formatTime(time.getSeconds())
  
  // Format date
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const dateString = time.toLocaleDateString('en-AE', options)
  
  // Size classes
  const sizeClasses = {
    small: {
      container: 'p-3',
      time: 'text-xl',
      date: 'text-xs',
      icon: 'w-4 h-4'
    },
    medium: {
      container: 'p-4',
      time: 'text-3xl',
      date: 'text-sm',
      icon: 'w-5 h-5'
    },
    large: {
      container: 'p-6',
      time: 'text-4xl',
      date: 'text-base',
      icon: 'w-6 h-6'
    }
  }
  
  return (
    <div className={`glass-card rounded-xl ${sizeClasses[size].container}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Clock className={`text-[#EAAC82] ${sizeClasses[size].icon}`} />
        <h2 className="text-white font-medium">UAE Time</h2>
      </div>
      
      <div className={`font-bold text-white ${sizeClasses[size].time}`}>
        {hours}:{minutes}{showSeconds ? `:${seconds}` : ''}
      </div>
      
      {showDate && (
        <div className={`text-gray-400 mt-1 ${sizeClasses[size].date}`}>
          {dateString}
        </div>
      )}
    </div>
  )
}