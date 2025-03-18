import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  DollarSign,
  Droplets,
  Flame,
  Calendar,
  Clock,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface EnergyUsage {
  time?: string;
  day?: string;
  month?: string;  // Changed from number to string
  year?: number;
  usage: number;
}

interface EnergyDistribution {
  room?: string;
  device?: string;
  usage: number;
  percentage: string;  // Changed to required string
}

interface ProjectedBills {
  currentMonth: {
    usage: number;
    projected: number;
    cost: number;
    change: number;
    changePercent: number;
  };
  annual: {
    usage: number;
    projected: number;
    cost: number;
    change: number;
    changePercent: number;
  };
  daily: {
    average: number;
    peak: number;
    peakDate: string;
  };
  costRate: number;
}

function SummaryCard({
  title,
  icon: Icon,
  value,
  change,
  color
}: {
  title: string
  icon: React.ElementType
  value: string
  change: number
  color: string
}) {
  return (
    <div className="glass-card rounded-xl p-6 stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div className="flex items-center space-x-1">
          {change > 0 ? (
            <ArrowUp className="h-4 w-4 text-red-400" />
          ) : (
            <ArrowDown className="h-4 w-4 text-green-400" />
          )}
          <span className={`text-sm ${change > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      </div>
      <h3 className="text-2xl font-semibold text-white">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

function CostBreakdownItem({
  label,
  value,
  percentage,
  color
}: {
  label: string
  value: number
  percentage: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-medium text-white">AED {value.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-[#333333] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">{percentage}% of total</span>
      </div>
    </div>
  );
}

export function EnergyStatsPage() {
  const [timeRange, setTimeRange] = useState<'hourly' | 'daily' | 'monthly' | 'yearly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [energyData, setEnergyData] = useState<EnergyUsage[]>([]);
  const [roomData, setRoomData] = useState<EnergyDistribution[]>([]);
  const [deviceData, setDeviceData] = useState<EnergyDistribution[]>([]);
  const [projectedBills, setProjectedBills] = useState<ProjectedBills | null>(null);
  const [showRooms, setShowRooms] = useState<boolean>(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    const fetchEnergyData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/energy_usage_by_period/${timeRange}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();

        // Remove month number transformation
        const transformedData = data.map((item: any) => ({
          ...item,
          month: item.month || undefined, // Keep backend-provided month name
        }));

        setEnergyData(transformedData);
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };

    fetchEnergyData();
  }, [timeRange]);

  // Fetch energy distribution data
  // After fetching and transforming distribution data
  useEffect(() => {
    const fetchDistributionData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('http://127.0.0.1:8000/energy_distribution', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const { rooms, devices } = await response.json();

        // Transform room data
        const roomTotal = rooms.reduce((sum: number, room: any) => sum + parseFloat(room.total), 0);
        const transformedRoomData = rooms.map((room: any) => ({
          room: room.name,
          usage: room.usage,
          percentage: room.percentage.toString(),
        }));

        // Transform device data
        const deviceTotal = devices.reduce((sum: number, device: any) => sum + parseFloat(device.total), 0);
        const transformedDeviceData = devices.map((device: any) => ({
          device: device.name,
          usage: device.usage,
          percentage: device.percentage.toString(),
        }));

        setRoomData(transformedRoomData);
        setDeviceData(transformedDeviceData);
      } catch (error) {
        console.error('Error fetching distribution data:', error);
      }
    };

    fetchDistributionData();
  }, []);

  // Fetch projected bills
  useEffect(() => {
    const fetchProjectedBills = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('http://127.0.0.1:8000/projected_bills', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // Transform data if necessary
        const transformedData = {
          currentMonth: {
            usage: data.currentMonth.usage,
            projected: data.currentMonth.projected,
            cost: data.currentMonth.cost,
            change: data.currentMonth.change,
            changePercent: data.currentMonth.changePercent,
          },
          annual: {
            usage: data.annual.usage,
            projected: data.annual.projected,
            cost: data.annual.cost,
            change: data.annual.change,
            changePercent: data.annual.changePercent,
          },
          daily: {
            average: data.daily.average,
            peak: data.daily.peak,
            peakDate: data.daily.peakDate,
          },
          costRate: data.costRate,
        };

        setProjectedBills(transformedData);
      } catch (error) {
        console.error('Error fetching projected bills:', error);
      }
    };

    fetchProjectedBills();
  }, []);

  // Calculate total usage and cost
  const totalElectricity = energyData.reduce((sum, item) => sum + item.usage, 0);
  const totalWater = energyData.reduce((sum, item) => sum + item.usage, 0);
  const totalGas = energyData.reduce((sum, item) => sum + item.usage, 0);

  // Calculate current month's data
  const currentMonthData = energyData.find((item) => {
    if (typeof item.month === 'string') {
      return item.month === monthNames[currentMonth];
    }
    return item.month === currentMonth + 1;
  });

  const prevMonthData = energyData.find((item) => {
    const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
    if (typeof item.month === 'string') {
      return item.month === monthNames[prevMonthIndex];
    }
    return item.month === prevMonthIndex + 1;
  });

  const electricityChange = currentMonthData && prevMonthData
    ? ((currentMonthData.usage - prevMonthData.usage) / prevMonthData.usage) * 100
    : 0;
  const waterChange = electricityChange; // Simulate water and gas changes
  const gasChange = electricityChange;


  const staticElectricityUsage = 120.5; // Example: 120.5 kWh
  const staticElectricityChange = -2.5; // Example: -2.5% change

  const staticGasUsage = 75.3; // Example: 75.3 m³
  const staticGasChange = 1.8; // Example: 1.8% change

  const staticWaterUsage = 250.0; // Example: 250.0 gal
  const staticWaterChange = -0.5; // Example: -0.5% change

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Time Range Buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Energy Statistics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Electricity Summary Card */}
        <SummaryCard
          title="Electricity"
          icon={Zap}
          value={`${currentMonthData?.usage.toFixed(0) ?? '0.00'} kWh`} // Show current month's usage
          change={electricityChange}
          color="#EAAC82"
        />

        {/* Water Summary Card */}
        <SummaryCard
          title="Water"
          icon={Droplets}
          value={`${((currentMonthData?.usage ?? 0) * 0.075).toFixed(0)} gal`} // Multiply electricity by 0.75
          change={waterChange}
          color="#90AC95"
        />

        {/* Gas Summary Card */}
        <SummaryCard
          title="Gas"
          icon={Flame}
          value={`${((currentMonthData?.usage ?? 0) * 0.007).toFixed(2)} m³`} // Multiply electricity by 0.5
          change={gasChange}
          color="#7A9580"
        />
      </div>

      {/* Main Charts */}
      <div className="flex gap-4">
        {/* Usage Over Time Chart */}
        <div className="glass-card p-6 rounded-xl flex-1 min-w-[60%]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#EAAC82]" />
              <h2 className="text-lg font-semibold text-white">Usage Over Time</h2>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('hourly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === 'hourly' ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300 hover:bg-[#333333]'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('daily')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === 'daily' ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300 hover:bg-[#333333]'
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === 'monthly' ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300 hover:bg-[#333333]'
                  }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('yearly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === 'yearly' ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300 hover:bg-[#333333]'
                  }`}
              >
                Year
              </button>
            </div>
          </div>
          <div className="h-64 relative">
            {energyData.length > 0 ? (
              <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                {energyData.map((item, index) => {
                  const maxUsage = Math.max(...energyData.map(d => d.usage));
                  const barHeight = (item.usage / maxUsage) * 80; // Adjust 80 to control max bar height

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center w-full"
                      style={{ height: `${barHeight}%` }}
                    >
                      {/* Bar */}
                      <div
                        className="w-full bg-[#EAAC82] rounded-t transition-all duration-300"
                        style={{ height: '100%' }}
                      />
                      {/* Label */}
                      <div className="text-xs text-gray-400 mt-1">
                        {timeRange === 'hourly' && item.time
                          ? `${item.time.split(':')[0]}`
                          : timeRange === 'daily' && item.day
                            ? item.day.substring(0, 3)
                            : timeRange === 'monthly' && item.month
                              ? item.month.substring(0, 3)
                              : timeRange === 'yearly' && item.year
                                ? item.year.toString()
                                : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="glass-card p-4 rounded-xl flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-[#90AC95]" />
              <h2 className="text-lg font-semibold text-white">Energy Distribution</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRooms(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${showRooms ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300'}`}
              >
                By Room
              </button>
              <button
                onClick={() => setShowRooms(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!showRooms ? 'bg-[#90AC95] text-white' : 'bg-[#262626] text-gray-300'}`}
              >
                By Device
              </button>
            </div>
          </div>
          <div className="flex h-64">
            {/* Pie Chart Visualization */}
            <div className="w-1/2 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {showRooms ? (
                    roomData.length > 0 && roomData.map((item, index) => {
                      const total = roomData.reduce((sum, i) => sum + i.usage, 0);
                      const startAngle = roomData.slice(0, index).reduce((sum, i) => sum + i.usage, 0) / total * 360;
                      const endAngle = startAngle + (item.usage / total * 360);

                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;

                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);

                      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                      const colors = ['#EAAC82', '#D9A279', '#90AC95', '#7A9580', '#C48A61', '#8DA08E'];

                      return (
                        <path
                          key={index}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                          stroke="#262626"
                          strokeWidth="1"
                        />
                      );
                    })
                  ) : (
                    deviceData.slice(0, 6).map((item, index) => {
                      const total = deviceData.slice(0, 6).reduce((sum, i) => sum + i.usage, 0);
                      const startAngle = deviceData.slice(0, index).reduce((sum, i) => sum + i.usage, 0) / total * 360;
                      const endAngle = startAngle + (item.usage / total * 360);

                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;

                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);

                      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                      const colors = ['#EAAC82', '#D9A279', '#90AC95', '#7A9580', '#C48A61', '#8DA08E'];

                      return (
                        <path
                          key={index}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                          stroke="#262626"
                          strokeWidth="1"
                        />
                      );
                    })
                  )}
                  <circle cx="50" cy="50" r="20" fill="#262626" />
                </svg>
              </div>
            </div>
            {/* Legend */}
            <div className="w-1/2 flex flex-col justify-center space-y-2 overflow-y-auto max-h-64">
              {/* In the Pie Chart legend */}
              {showRooms ? (
                roomData.map((item, index) => {
                  const colors = ['#EAAC82', '#D9A279', '#90AC95', '#7A9580', '#C48A61', '#8DA08E'];
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-xs text-gray-300">{item.room}</span>
                      <span className="text-xs text-gray-400 ml-auto">{item.percentage}%</span>
                    </div>
                  );
                })
              ) : (
                deviceData.slice(0, 8).map((item, index) => {
                  const colors = ['#EAAC82', '#D9A279', '#90AC95', '#7A9580', '#C48A61', '#8DA08E'];
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-xs text-gray-300">{item.device}</span>
                      <span className="text-xs text-gray-400 ml-auto">{item.percentage}%</span>
                    </div>
                  );
                })
              )}
              {!showRooms && deviceData.length > 8 && (
                <div className="text-xs text-gray-400 italic">+ {deviceData.length - 8} more devices</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Cost Analysis */}
      {projectedBills && (
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="w-5 h-5 text-[#EAAC82]" />
            <h2 className="text-lg font-semibold text-white">Cost Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Month */}
            <div className="bg-[#262626] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Current Month</span>
                <span className="text-sm font-medium text-[#EAAC82]">
                  AED {projectedBills.currentMonth.cost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">vs Last Month</span>
                <span className="text-xs text-red-400">
                  {projectedBills.currentMonth.change >= 0 ? '+' : '-'}
                  AED {Math.abs(projectedBills.currentMonth.change).toFixed(2)} (
                  {Math.abs(projectedBills.currentMonth.changePercent).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Projected Annual */}
            <div className="bg-[#262626] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Projected Annual</span>
                <span className="text-sm font-medium text-[#EAAC82]">
                  AED {projectedBills.annual.cost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">vs Last Year</span>
                <span className="text-xs text-green-400">
                  {projectedBills.annual.change >= 0 ? '+' : '-'}
                  AED {Math.abs(projectedBills.annual.change).toFixed(2)} (
                  {Math.abs(projectedBills.annual.changePercent).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Average Daily & Peak Day */}
            <div className="bg-[#262626] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Average Daily</span>
                <span className="text-sm font-medium text-[#EAAC82]">
                  AED {projectedBills.daily.average.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Peak Day</span>
                <span className="text-xs text-white">
                  AED {projectedBills.daily.peak.toFixed(2)} ({projectedBills.daily.peakDate})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
