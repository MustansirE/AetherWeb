import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ThermostatControlProps {
  state: number; // Current thermostat state (temperature)
  minTemp?: number; // Minimum temperature (default: 16)
  maxTemp?: number; // Maximum temperature (default: 30)
  isHeating: boolean; // Whether the thermostat is in heating mode
  onIncrease: () => void; // Function to call when increasing temperature
  onDecrease: () => void; // Function to call when decreasing temperature
  isLightMode: boolean; // Whether light mode is active
}

export function ThermostatControl({
  state = 22,
  minTemp = 16,
  maxTemp = 32,
  isHeating = false,
  onIncrease,
  onDecrease,
  isLightMode = false,
}: ThermostatControlProps) {
  // Calculate the progress for the circular indicator
  const progress = ((state - minTemp) / (maxTemp - minTemp)) * 100;

  // Theme-specific colors
  const heatingColor = isLightMode ? '#D9924E' : '#EAAC82';
  const coolingColor = isLightMode ? '#6B917D' : '#8DA08E';
  
  // Mode indicator styling
  const heatingBgColor = isLightMode 
    ? 'rgba(217, 146, 78, 0.2)' 
    : 'var(--secondary-accent-translucent)';
  
  const coolingBgColor = isLightMode 
    ? 'rgba(107, 145, 125, 0.2)' 
    : 'var(--accent-color-translucent)';

  // Background color based on theme
  const bgColor = isLightMode ? 'var(--bg-secondary-light)' : 'var(--bg-secondary)';
  const circleColor = isLightMode ? 'var(--bg-tertiary-light)' : 'var(--bg-tertiary)';

  return (
    <div 
      className="flex flex-col items-center p-8 rounded-2xl w-full h-full"
      style={{ 
        backgroundColor: bgColor,
        boxShadow: isLightMode 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="relative w-64 h-64">
        {/* Outer circle for better visibility */}
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ 
            backgroundColor: circleColor,
            opacity: isLightMode ? 0.5 : 0.3
          }}
        />

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="calc(50% - 8px)"
            fill="none"
            stroke={isHeating ? heatingColor : coolingColor}
            strokeWidth="8"
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
          <div className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {state.toFixed(1)}°
          </div>
          <div 
            className="text-sm mt-2" 
            style={{ 
              color: isHeating 
                ? heatingColor 
                : coolingColor
            }}
          >
            {isHeating ? 'Heating' : 'Cooling'}
          </div>
        </div>

        {/* Control buttons */}
        <button
          onClick={onIncrease}
          disabled={state >= maxTemp}
          className="absolute top-2 left-1/2 -translate-x-1/2 p-4 transition-colors rounded-full hover:bg-opacity-10 hover:bg-white"
          style={{ 
            color: state >= maxTemp 
              ? isLightMode ? 'var(--text-muted-light)' : 'var(--text-muted)' 
              : isHeating 
                ? heatingColor 
                : coolingColor,
            cursor: state >= maxTemp ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronUp className="w-8 h-8" />
        </button>
        <button
          onClick={onDecrease}
          disabled={state <= minTemp}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 p-4 transition-colors rounded-full hover:bg-opacity-10 hover:bg-white"
          style={{ 
            color: state <= minTemp 
              ? isLightMode ? 'var(--text-muted-light)' : 'var(--text-muted)' 
              : isHeating 
                ? heatingColor 
                : coolingColor,
            cursor: state <= minTemp ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>

      {/* Mode indicators */}
      <div className="mt-4 flex gap-4">
        <div 
          className="p-3 rounded-lg transition-colors"
          style={{ 
            backgroundColor: isHeating 
              ? heatingBgColor 
              : isLightMode ? 'var(--bg-tertiary-light)' : 'var(--bg-tertiary)',
            color: isHeating 
              ? heatingColor 
              : isLightMode ? 'var(--text-muted-light)' : 'var(--text-muted)'
          }}
        >
          Heat Mode
        </div>
        <div 
          className="p-3 rounded-lg transition-colors"
          style={{ 
            backgroundColor: !isHeating 
              ? coolingBgColor 
              : isLightMode ? 'var(--bg-tertiary-light)' : 'var(--bg-tertiary)',
            color: !isHeating 
              ? coolingColor 
              : isLightMode ? 'var(--text-muted-light)' : 'var(--text-muted)'
          }}
        >
          Cool Mode
        </div>
      </div>
    </div>
  );
}