import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TYPES
 */
interface Report {
  id: string;
  title: string;
  score: number;
  date: string;
  demand: 'Low' | 'Medium' | 'High';
  risk: 'Low' | 'Medium' | 'High';
}

interface KPIStats {
  totalReports: number;
  avgHealth: number;
  viableIdeas: number;
  highRisk: number;
}

/**
 * SUB-COMPONENTS
 */

const Header: React.FC<{ onNewAnalysis: () => void; onProfileClick: () => void }> = ({ onNewAnalysis, onProfileClick }) => (
  <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <Icon icon="lucide:sparkles" className="text-white text-sm" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          BizVision<span className="text-primary">AI</span>
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Icon icon="lucide:plus" /> New Analysis
        </button>
        <div 
          onClick={onProfileClick}
          className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all"
        >
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </header>
);

interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass: string;
  bgClass: string;
  suffix?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon, colorClass, bgClass, suffix }) => (
  <div className="bg-card border border-border/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-6 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-colors opacity-5 group-hover:opacity-10", bgClass)}></div>
    <div className="flex items-center gap-3 mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgClass, colorClass)}>
        <Icon icon={icon} className="text-xl" />
      </div>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
    </div>
    <div className="flex items-baseline gap-1">
      <h3 className="text-4xl font-extrabold text-foreground">{value}</h3>
      {suffix && <span className="text-sm text-muted-foreground font-medium">{suffix}</span>}
    </div>
  </div>
);

const TrendChart: React.FC = () => {
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    datasets: [],
  });

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 288);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    setChartData({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
      datasets: [
        {
          label: 'Avg Health Score',
          data: [65, 68, 72, 70, 78, 82, 85],
          borderColor: '#4F46E5',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#4F46E5',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 12,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
        displayColors: false,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', weight: '500' }, color: '#64748B' },
      },
      y: {
        grid: { color: '#E2E8F0', borderDash: [5, 5] },
        ticks: { font: { family: 'Inter', weight: '500' }, color: '#64748B', stepSize: 10 },
        min: 40,
        max: 100,
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon="lucide:trending-up" className="text-xl text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Intelligence Trend</h3>
            <p className="text-sm text-muted-foreground font-medium">Average health score of validated ideas over time</p>
          </div>
        </div>
      </div>
      <div className="h-72 w-full overflow-hidden relative">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

interface HistoryItemProps {
  report: Report;
  onView: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ report, onView }) => {
  const getScoreStyles = (score: number) => {
    if (score >= 80) return { bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/20', label: 'High', labelBg: 'bg-tertiary' };
    if (score >= 60) return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', label: 'Medium', labelBg: 'bg-amber-500' };
    return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: 'Risk', labelBg: 'bg-destructive' };
  };

  const styles = getScoreStyles(report.score);

  return (
    <div 
      onClick={() => onView(report.id)}
      className="group flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-background/50 hover:bg-card hover:shadow-md hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-center gap-5">
        <div className={cn("relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border", styles.bg, styles.text, styles.border)}>
          {report.score}
          {report.score >= 80 && (
            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-sm flex items-center gap-0.5">
              <Icon icon="lucide:trending-up" /> High
            </div>
          )}
          {report.score < 60 && (
            <div className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-sm flex items-center gap-0.5">
              <Icon icon="lucide:triangle-alert" /> Risk
            </div>
          )}
        </div>
        <div>
          <h4 className="font-extrabold text-foreground text-lg group-hover:text-primary transition-colors">{report.title}</h4>
          <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><Icon icon="lucide:calendar" /> {report.date}</span>
            <span className="flex items-center gap-1"><Icon icon="lucide:bar-chart-3" /> Demand: {report.demand}</span>
            <span className="flex items-center gap-1"><Icon icon="lucide:shield-check" /> Risk: {report.risk}</span>
          </div>
        </div>
      </div>
      <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
        <Icon icon="lucide:arrow-right" />
      </button>
    </div>
  );
};

/**
 * MAIN COMPONENT
 */
const HistoryDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([
    { id: '1', title: 'Organic Pet Food in Hyderabad', score: 82, date: 'Oct 24, 2023', demand: 'High', risk: 'Low' },
    { id: '2', title: 'AI Content Generator for Lawyers', score: 65, date: 'Oct 21, 2023', demand: 'Medium', risk: 'Medium' },
    { id: '3', title: 'Crypto Wallet for Teenagers', score: 42, date: 'Oct 18, 2023', demand: 'Low', risk: 'High' },
    { id: '4', title: 'Sustainable Fashion Marketplace', score: 78, date: 'Oct 15, 2023', demand: 'High', risk: 'Medium' },
    { id: '5', title: 'Hyperlocal Delivery for Seniors', score: 89, date: 'Oct 12, 2023', demand: 'High', risk: 'Low' },
  ]);

  const kpiStats: KPIStats = {
    totalReports: 24,
    avgHealth: 78,
    viableIdeas: 15,
    highRisk: 3
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => 
      report.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const handleNewAnalysis = () => {
    setIsLoading(true);
    // Simulate navigation or modal opening
    setTimeout(() => {
      setIsLoading(false);
      alert("Redirecting to New Analysis flow...");
    }, 1000);
  };

  const handleViewReport = (id: string) => {
    alert(`Viewing detailed report for ID: ${id}`);
  };

  const handleProfileClick = () => {
    alert("Opening user profile settings...");
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative font-sans text-foreground">
      <Header onNewAnalysis={handleNewAnalysis} onProfileClick={handleProfileClick} />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 space-y-8 pb-32">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Intelligence Dashboard</h1>
            <p className="text-muted-foreground font-medium text-sm">Overview of your validated startup ideas and historical performance.</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
              <Icon icon="lucide:loader-2" className="animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Aggregate KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <KPICard 
            label="Total Reports" 
            value={kpiStats.totalReports} 
            icon="lucide:folder-open" 
            colorClass="text-primary" 
            bgClass="bg-primary/10" 
          />
          <KPICard 
            label="Avg. Health Score" 
            value={kpiStats.avgHealth} 
            icon="lucide:activity" 
            colorClass="text-tertiary" 
            bgClass="bg-tertiary/10" 
            suffix="/100"
          />
          <KPICard 
            label="Viable Ideas" 
            value={kpiStats.viableIdeas} 
            icon="lucide:rocket" 
            colorClass="text-secondary" 
            bgClass="bg-secondary/10" 
          />
          <KPICard 
            label="High Risk Alerts" 
            value={kpiStats.highRisk} 
            icon="lucide:triangle-alert" 
            colorClass="text-destructive" 
            bgClass="bg-destructive/10" 
          />
        </div>

        {/* Trend Chart */}
        <TrendChart />

        {/* History List */}
        <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Icon icon="lucide:history" className="text-xl text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">History Access</h3>
                <p className="text-sm text-muted-foreground font-medium">Recent startup validations</p>
              </div>
            </div>
            
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search reports..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <HistoryItem key={report.id} report={report} onView={handleViewReport} />
              ))
            ) : (
              <div className="py-12 text-center">
                <Icon icon="lucide:search-x" className="mx-auto text-4xl text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No reports found matching your search.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer / Bottom Nav for Mobile (Optional enhancement) */}
      <footer className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-border/60 py-4 px-6 md:hidden">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Icon icon="lucide:layout-dashboard" className="text-xl" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Icon icon="lucide:plus-circle" className="text-xl" />
            <span className="text-[10px] font-bold">New</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Icon icon="lucide:settings" className="text-xl" />
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HistoryDashboard;