import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Share2,
  X,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Mail
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


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
    <div className="glass-card rounded-xl p-6 stat-card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div className="flex items-center space-x-1">
          {change > 0 ? (
            <ArrowUp className="h-4 w-4" style={{ color: 'var(--danger-text)' }} />
          ) : (
            <ArrowDown className="h-4 w-4" style={{ color: 'var(--success-color)' }} />
          )}
          <span style={{ 
            color: change > 0 ? 'var(--danger-text)' : 'var(--success-color)'
          }}>
            {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      </div>
      <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</p>
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
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>AED {value.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{percentage}% of total</span>
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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<{
    energyData: EnergyUsage[],
    roomData: EnergyDistribution[],
    deviceData: EnergyDistribution[]
  }>({
    energyData: [],
    roomData: [],
    deviceData: []
  });
  
  // Refs for capturing components for the PDF
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const costAnalysisRef = useRef<HTMLDivElement>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isSharingReport, setIsSharingReport] = useState(false);
  const statsAreaRef = useRef<HTMLDivElement>(null);

  const handlePrepareShare = async () => {
    try {
      setIsSharingReport(true);
      
      if (statsAreaRef.current) {
        const canvas = await html2canvas(statsAreaRef.current, {
          scale: 2,
          backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary') || '#ffffff'
        });
        
        const imgUrl = canvas.toDataURL('image/png');
        setShareImageUrl(imgUrl);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error generating share image:', error);
      alert('Failed to generate share image. Please try again.');
    } finally {
      setIsSharingReport(false);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!shareImageUrl) return;
    
    const text = "Check out my energy usage stats from AETHER Home System! #SmartHome #EnergyEfficiency";
    let url;
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('My AETHER Energy Report')}&body=${encodeURIComponent(text + '\n\n' + window.location.href)}`;
        break;
      default:
        return;
    }
    
    // Open a new window for sharing
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadShareImage = () => {
    if (!shareImageUrl) return;
    
    const link = document.createElement('a');
    link.href = shareImageUrl;
    link.download = `aether-energy-stats-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData({
        energyData,
        roomData,
        deviceData
      });
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      
      // Filter energy data - match by month/day/time data
      const filteredEnergyData = energyData.filter(item => {
        return (
          (item.month && item.month.toLowerCase().includes(lowercaseQuery)) ||
          (item.day && item.day.toLowerCase().includes(lowercaseQuery)) ||
          (item.time && item.time.toLowerCase().includes(lowercaseQuery))
        );
      });
      
      // Filter room data by room name
      const filteredRoomData = roomData.filter(item => 
        item.room && item.room.toLowerCase().includes(lowercaseQuery)
      );
      
      // Filter device data by device name
      const filteredDeviceData = deviceData.filter(item => 
        item.device && item.device.toLowerCase().includes(lowercaseQuery)
      );
      
      setFilteredData({
        energyData: filteredEnergyData,
        roomData: filteredRoomData,
        deviceData: filteredDeviceData
      });
    }
  }, [searchQuery, energyData, roomData, deviceData]);

  const generatePDF = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Get username from localStorage if available
      const userDataString = localStorage.getItem('user_data');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const username = userData?.name || 'User';
      
      // Set font styles
      pdf.setFont('helvetica');
      
      // Add title
      pdf.setFontSize(24);
      pdf.setTextColor(112, 140, 105); // Green color for AETHER
      pdf.text('AETHER', 105, 20, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.setTextColor(51, 51, 51); // Dark gray
      pdf.text('Energy Consumption Report', 105, 30, { align: 'center' });
      
      // Add date and user
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102); // Medium gray
      pdf.text(`Generated for ${username} on ${currentDate}`, 105, 40, { align: 'center' });
      
      // Add horizontal line
      pdf.setDrawColor(216, 199, 181); // Light brown
      pdf.line(20, 45, 190, 45);
      
      // Add summary section title
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Energy Summary', 20, 55);
      
      // Add electricity, water, and gas info
      pdf.setFontSize(14);
      pdf.setTextColor(234, 172, 130); // Electricity color
      pdf.text(`Electricity: ${getMostRecentUsage().toFixed(1)} ${getElectricityUnit()}`, 25, 65);
      
      pdf.setTextColor(144, 172, 149); // Water color
      pdf.text(`Water: ${(getMostRecentUsage() * 0.075).toFixed(1)} gal`, 25, 75);
      
      pdf.setTextColor(122, 149, 128); // Gas color
      pdf.text(`Gas: ${(getMostRecentUsage() * 0.007).toFixed(2)} m³`, 25, 85);
      
      // Capture and add charts if refs are available
      let yPosition = 95;
      
      if (barChartRef.current) {
        const barChartCanvas = await html2canvas(barChartRef.current, {
          scale: 2,
          backgroundColor: null
        });
        
        const barChartImgData = barChartCanvas.toDataURL('image/png');
        pdf.text('Usage Over Time', 20, yPosition);
        yPosition += 10;
        
        const imgWidth = 170;
        const imgHeight = (barChartCanvas.height * imgWidth) / barChartCanvas.width;
        pdf.addImage(barChartImgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      }
      
      if (pieChartRef.current) {
        const pieChartCanvas = await html2canvas(pieChartRef.current, {
          scale: 2,
          backgroundColor: null
        });
        
        const pieChartImgData = pieChartCanvas.toDataURL('image/png');
        pdf.text(`Energy Distribution (By ${showRooms ? 'Room' : 'Device'})`, 20, yPosition);
        yPosition += 10;
        
        const imgWidth = 170;
        const imgHeight = (pieChartCanvas.height * imgWidth) / pieChartCanvas.width;
        pdf.addImage(pieChartImgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      }
      
      // Check if we need to add a new page for cost analysis
      if (yPosition > 250 && costAnalysisRef.current) {
        pdf.addPage();
        yPosition = 20;
      }
      
      if (costAnalysisRef.current && projectedBills) {
        const costAnalysisCanvas = await html2canvas(costAnalysisRef.current, {
          scale: 2,
          backgroundColor: null
        });
        
        const costImgData = costAnalysisCanvas.toDataURL('image/png');
        pdf.text('Cost Analysis', 20, yPosition);
        yPosition += 10;
        
        const imgWidth = 170;
        const imgHeight = (costAnalysisCanvas.height * imgWidth) / costAnalysisCanvas.width;
        pdf.addImage(costImgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      }
      
      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(153, 153, 153);
      pdf.text('Generated by AETHER HOME SYSTEM', 105, 285, { align: 'center' });
      
      // Save the PDF
      const fileName = `aether-energy-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Theme-consistent colors
  const chartColors = {
    electricity: '#EAAC82',
    water: '#90AC95',
    gas: '#7A9580',
    secondary: '#D9A279',
    tertiary: '#C48A61',
    quaternary: '#8DA08E',
  };

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
  const totalWater = energyData.reduce((sum, item) => sum + item.usage, 0) * 0.075;
  const totalGas = energyData.reduce((sum, item) => sum + item.usage, 0) * 0.007;

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

  // Update the electricityChange calculation
  const calculateElectricityChange = () => {
    if (energyData.length < 2) return 0;

    const sortedData = [...energyData];
    const currentUsage = sortedData[sortedData.length - 1].usage;
    const previousUsage = sortedData[sortedData.length - 2].usage;

    return previousUsage === 0 ? 0 : ((currentUsage - previousUsage) / previousUsage) * 100;
  };
  
  const getMostRecentUsage = () => {
    if (energyData.length === 0) return 0;
    const sortedData = [...energyData];
    return sortedData[sortedData.length - 1].usage;
  };

  const getElectricityUnit = () => {
    switch (timeRange) {
      case 'hourly':
        return 'kWh';
      case 'daily':
      case 'monthly':
      case 'yearly':
      default:
        return 'kWh';
    }
  };

  // Then use this in your component:
  const electricityChange = calculateElectricityChange();
  const mostRecentElectricity = getMostRecentUsage();

  // Keep the same water and gas calculations but use the most recent electricity value
  const waterUsage = mostRecentElectricity * 0.075; // Same 0.075 multiplier as before
  const gasUsage = mostRecentElectricity * 0.007; // Same 0.007 multiplier as before

  // Water and gas would use the same change percentage as electricity
  const waterChange = electricityChange;
  const gasChange = electricityChange;

  return (
    <div className="space-y-6 animate-fade-in p-4">
      {/* Header with Report and Share Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Energy Statistics</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrepareShare}
            disabled={isSharingReport}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            {isSharingReport ? (
              <span className="animate-pulse">Preparing...</span>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Share
              </>
            )}
          </button>
          <button
            onClick={generatePDF}
            disabled={isGeneratingReport}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
            style={{ backgroundColor: 'var(--secondary-accent)', color: 'var(--text-on-accent)' }}
          >
            {isGeneratingReport ? (
              <span className="animate-pulse">Generating...</span>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content to be captured for sharing/PDF */}
      <div ref={statsAreaRef} className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Electricity Summary Card */}
          <SummaryCard
            title="Electricity"
            icon={Zap}
            value={`${getMostRecentUsage().toFixed(1)} ${getElectricityUnit()}`}
            change={calculateElectricityChange()}
            color={chartColors.electricity}
          />

          {/* Water Summary Card */}
          <SummaryCard
            title="Water"
            icon={Droplets}
            value={`${(getMostRecentUsage() * 0.075).toFixed(1)} gal`}
            change={calculateElectricityChange()}
            color={chartColors.water}
          />

          {/* Gas Summary Card */}
          <SummaryCard
            title="Gas"
            icon={Flame}
            value={`${(getMostRecentUsage() * 0.007).toFixed(2)} m³`}
            change={calculateElectricityChange()}
            color={chartColors.gas}
          />
        </div>

        {/* Main Charts */}
        <div className="flex gap-6 flex-col md:flex-row mb-6">
          {/* Usage Over Time Chart */}
          <div className="glass-card p-6 rounded-xl flex-1 min-w-[60%]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" style={{ color: chartColors.electricity }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Usage Over Time</h2>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange('hourly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors`}
                  style={{
                    backgroundColor: timeRange === 'hourly' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: timeRange === 'hourly' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeRange('daily')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors`}
                  style={{
                    backgroundColor: timeRange === 'daily' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: timeRange === 'daily' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors`}
                  style={{
                    backgroundColor: timeRange === 'monthly' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: timeRange === 'monthly' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeRange('yearly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors`}
                  style={{
                    backgroundColor: timeRange === 'yearly' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: timeRange === 'yearly' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="h-64 relative" ref={barChartRef}>
              {filteredData.energyData.length > 0 ? (
                <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                  {filteredData.energyData.map((item, index) => {
                    const maxUsage = Math.max(...filteredData.energyData.map(d => d.usage));
                    const barHeight = (item.usage / maxUsage) * 80; // Adjust 80 to control max bar height

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center w-full"
                        style={{ height: `${barHeight}%` }}
                      >
                        {/* Bar */}
                        <div
                          className="w-full rounded-t transition-all duration-300"
                          style={{ height: '100%', backgroundColor: chartColors.electricity }}
                        />
                        {/* Label */}
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No matching data available' : 'No data available'}
                </div>
              )}
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="glass-card p-6 rounded-xl flex-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" style={{ color: chartColors.water }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Energy Distribution</h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowRooms(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: showRooms ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: showRooms ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  By Room
                </button>
                <button
                  onClick={() => setShowRooms(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: !showRooms ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: !showRooms ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  By Device
                </button>
              </div>
            </div>
            <div className="flex h-64" ref={pieChartRef}>
              {/* Pie Chart Visualization */}
              <div className="w-1/2 flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {showRooms ? (
                      filteredData.roomData.length > 0 && filteredData.roomData.map((item, index) => {
                        const total = filteredData.roomData.reduce((sum, i) => sum + i.usage, 0);
                        const startAngle = filteredData.roomData.slice(0, index).reduce((sum, i) => sum + i.usage, 0) / total * 360;
                        const endAngle = startAngle + (item.usage / total * 360);

                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;

                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);

                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                        const colors = [
                          chartColors.electricity,
                          chartColors.secondary,
                          chartColors.water,
                          chartColors.gas,
                          chartColors.tertiary,
                          chartColors.quaternary
                        ];

                        return (
                          <path
                            key={index}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={colors[index % colors.length]}
                            stroke="var(--bg-tertiary)"
                            strokeWidth="1"
                          />
                        );
                      })
                    ) : (
                      filteredData.deviceData.slice(0, 6).map((item, index) => {
                        const total = filteredData.deviceData.slice(0, 6).reduce((sum, i) => sum + i.usage, 0);
                        const startAngle = filteredData.deviceData.slice(0, index).reduce((sum, i) => sum + i.usage, 0) / total * 360;
                        const endAngle = startAngle + (item.usage / total * 360);

                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;

                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);

                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                        const colors = [
                          chartColors.electricity,
                          chartColors.secondary,
                          chartColors.water,
                          chartColors.gas,
                          chartColors.tertiary,
                          chartColors.quaternary
                        ];

                        return (
                          <path
                            key={index}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={colors[index % colors.length]}
                            stroke="var(--bg-tertiary)"
                            strokeWidth="1"
                          />
                        );
                      })
                    )}
                    <circle cx="50" cy="50" r="20" fill="var(--bg-tertiary)" />
                  </svg>
                </div>
              </div>
              {/* Legend */}
              <div className="w-1/2 flex flex-col justify-center space-y-2 overflow-y-auto max-h-64">
                {/* In the Pie Chart legend */}
                {showRooms ? (
                  filteredData.roomData.length > 0 ? (
                    filteredData.roomData.map((item, index) => {
                      const colors = [
                        chartColors.electricity,
                        chartColors.secondary,
                        chartColors.water,
                        chartColors.gas,
                        chartColors.tertiary,
                        chartColors.quaternary
                      ];
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.room}</span>
                          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{item.percentage}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {searchQuery ? 'No matching room data' : 'No room data available'}
                    </div>
                  )
                ) : (
                  filteredData.deviceData.length > 0 ? (
                    <>
                      {filteredData.deviceData.slice(0, 8).map((item, index) => {
                        const colors = [
                          chartColors.electricity,
                          chartColors.secondary,
                          chartColors.water,
                          chartColors.gas,
                          chartColors.tertiary,
                          chartColors.quaternary
                        ];
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.device}</span>
                            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{item.percentage}%</span>
                          </div>
                        );
                      })}
                      {filteredData.deviceData.length > 8 && (
                        <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                          + {filteredData.deviceData.length - 8} more devices
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {searchQuery ? 'No matching device data' : 'No device data available'}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        {projectedBills && (
          <div className="glass-card p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }} ref={costAnalysisRef}>
            <div className="flex items-center space-x-2 mb-6">
              <DollarSign className="w-5 h-5" style={{ color: chartColors.electricity }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cost Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Month */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Month</span>
                  <span className="text-sm font-medium" style={{ color: chartColors.electricity }}>
                    AED {projectedBills.currentMonth.cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs Last Month</span>
                  <span className="text-xs" style={{ color: 'var(--danger-text)' }}>
                    {projectedBills.currentMonth.change >= 0 ? '+' : '-'}
                    AED {Math.abs(projectedBills.currentMonth.change).toFixed(2)} (
                    {Math.abs(projectedBills.currentMonth.changePercent).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Projected Annual */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Projected Annual</span>
                  <span className="text-sm font-medium" style={{ color: chartColors.electricity }}>
                    AED {projectedBills.annual.cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs Last Year</span>
                  <span className="text-xs" style={{ color: 'var(--success-color)' }}>
                    {projectedBills.annual.change >= 0 ? '+' : '-'}
                    AED {Math.abs(projectedBills.annual.change).toFixed(2)} (
                    {Math.abs(projectedBills.annual.changePercent).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Average Daily & Peak Day */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average Daily</span>
                  <span className="text-sm font-medium" style={{ color: chartColors.electricity }}>
                    AED {projectedBills.daily.average.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Peak Day</span>
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    AED {projectedBills.daily.peak.toFixed(2)} ({projectedBills.daily.peakDate})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && shareImageUrl && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="glass-card rounded-xl p-6 max-w-lg w-full mx-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Share Energy Report</h2>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            
            <div className="mb-4 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              <img 
                src={shareImageUrl} 
                alt="Energy Report" 
                className="w-full h-auto" 
              />
            </div>
            
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Share your energy usage report with your network
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="p-3 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: '#1DA1F2', color: 'white' }}
                  aria-label="Share to Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="p-3 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: '#4267B2', color: 'white' }}
                  aria-label="Share to Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="p-3 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: '#0A66C2', color: 'white' }}
                  aria-label="Share to LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => shareToSocial('email')}
                  className="p-3 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: '#EA4335', color: 'white' }}
                  aria-label="Share via Email"
                >
                  <Mail className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex justify-center pt-2">
                <button
                  onClick={downloadShareImage}
                  className="px-4 py-2 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
                >
                  Download Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}