import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ThermostatControlProps {
  state: number; // Current thermostat state (temperature)
  minTemp?: number; // Minimum temperature (default: 16)
  maxTemp?: number; // Maximum temperature (default: 30)
  isHeating: boolean; // Whether the thermostat is in heating mode
  onIncrease: () => void; // Function to call when increasing temperature
  onDecrease: () => void; // Function to call when decreasing temperature
}

export function ThermostatControl({
  state = 22,
  minTemp = 16,
  maxTemp = 30,
  isHeating = false,
  onIncrease,
  onDecrease,
}: ThermostatControlProps) {
  // Calculate the progress for the circular indicator
  const progress = ((state - minTemp) / (maxTemp - minTemp)) * 100;

  return (
    <div className="flex flex-col items-center p-8 glass-card rounded-2xl">
      <div className="relative w-64 h-64">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-8 border-[#262626]"
          style={{ transform: 'rotate(-90deg)' }}
        />

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="calc(50% - 8px)"
            fill="none"
            stroke={isHeating ? '#EAAC82' : '#8DA08E'}
            strokeWidth="8"
            strokeDasharray={`${progress} 100`}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
            style={{
              strokeDasharray: '251.2',
              strokeDashoffset: `${251.2 * (1 - progress / 100)}`,
            }}
          />
        </svg>

        {/* Temperature display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white">
            {state.toFixed(1)}°
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {isHeating ? 'Heating' : 'Cooling'}
          </div>
        </div>

        {/* Control buttons */}
        <button
          onClick={onIncrease}
          className="absolute top-2 left-1/2 -translate-x-1/2 p-4 text-white hover:text-[#EAAC82] transition-colors"
        >
          <ChevronUp className="w-8 h-8" />
        </button>
        <button
          onClick={onDecrease}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 p-4 text-white hover:text-[#8DA08E] transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>

      {/* Mode indicators */}
      <div className="mt-4 flex gap-4">
        <div className={`p-3 rounded-lg transition-colors ${isHeating ? 'bg-[#EAAC82]/20 text-[#EAAC82]' : 'bg-[#262626] text-gray-400'}`}>
          Heat Mode
        </div>
        <div className={`p-3 rounded-lg transition-colors ${!isHeating ? 'bg-[#8DA08E]/20 text-[#8DA08E]' : 'bg-[#262626] text-gray-400'}`}>
          Cool Mode
        </div>
      </div>
    </div>
  );
}