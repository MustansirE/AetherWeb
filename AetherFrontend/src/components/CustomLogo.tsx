import React from 'react'

export function CustomLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: 'w-12 h-12',
    default: 'w-16 h-16',
    large: 'w-24 h-24'
  }

  return (
    <div className={`relative ${sizes[size]} hover-pulse`}>
      <div className="absolute w-full h-full flex items-center justify-center">
        {/* Outer Circle */}
        <div className="absolute w-[80%] h-[80%] rounded-full border-4 border-[#D9A279] opacity-20 animate-pulse" />
        
        {/* Middle Circle */}
        <div className="absolute w-[65%] h-[65%] rounded-full border-4 border-[#D9A279] opacity-40" />
        
        {/* Inner Circle with Core */}
        <div className="absolute w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#D9A279] to-[#90AC95] flex items-center justify-center shadow-lg">
          {/* Abstract A shape */}
          <div className="relative w-[40%] h-[40%]">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform -translate-y-1/2 rotate-45" />
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform -translate-y-1/2 -rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}