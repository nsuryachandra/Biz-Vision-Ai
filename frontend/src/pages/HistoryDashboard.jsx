import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Header = ({ onNewAnalysis }) => (
  <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/logo.jpeg" alt="BizVision AI" className="w-8 h-8 rounded-lg object-cover shadow-md" />
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
      </div>
    </div>
  </header>
);

const KPICard = ({ label, value, icon, colorClass, bgClass, suffix }) => (
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

const TrendChart = ({ reports }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    datasets: [],
  });

  const chartPoints = useMemo(() => {
    if (!reports || reports.length === 0) return [65, 68, 72, 70, 78, 82, 85];
    return [...reports].slice(0, 7).reverse().map(r => r.score);
  }, [reports]);

  const chartLabels = useMemo(() => {
    if (!reports || reports.length === 0) return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
    return [...reports].slice(0, 7).reverse().map(r => r.title.slice(0, 10) + '...');
  }, [reports]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 288);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    setChartData({
      labels: chartLabels,
      datasets: [
        {
          label: 'Avg Health Score',
          data: chartPoints,
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
  }, [chartPoints, chartLabels]);

  const options = {
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
        min: 0,
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

const HistoryItem = ({ report, onView }) => {
  const getScoreStyles = (score) => {
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
      <div className="flex items-center gap-5 col-span-10 flex-1 truncate">
        <div className={cn("relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border flex-shrink-0", styles.bg, styles.text, styles.border)}>
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
        <div className="truncate">
          <h4 className="font-extrabold text-foreground text-lg group-hover:text-primary transition-colors truncate">{report.title}</h4>
          <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Icon icon="lucide:calendar" /> {report.date}</span>
            <span className="flex items-center gap-1"><Icon icon="lucide:bar-chart-3" /> Demand: {report.demand}</span>
            <span className="flex items-center gap-1"><Icon icon="lucide:shield-check" /> Risk: {report.risk}</span>
          </div>
        </div>
      </div>
      <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm flex-shrink-0">
        <Icon icon="lucide:arrow-right" />
      </button>
    </div>
  );
};

const HistoryDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [reports, setReports] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    totalReports: 0,
    avgHealth: 0,
    viableIdeas: 0,
    highRisk: 0
  });

  // Fetch Dashboard Stats & History
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const dashRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard`);
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          const metrics = dashData.metrics;
          
          setKpiStats({
            totalReports: metrics.total_ideas_analyzed || 0,
            avgHealth: metrics.average_viability_score || 0,
            viableIdeas: metrics.average_opportunity_score || 0,
            highRisk: metrics.average_risk_score || 0
          });
        }

        const histRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/history`);
        if (histRes.ok) {
          const histData = await histRes.json();
          const formattedReports = histData.map((item) => ({
            id: String(item.report_id),
            title: item.idea_text || 'Untitled Startup Idea',
            score: item.viability_score || 0,
            date: item.created_at 
              ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            demand: item.viability_score >= 80 ? 'High' : item.viability_score >= 60 ? 'Medium' : 'Low',
            risk: item.viability_score >= 80 ? 'Low' : item.viability_score >= 60 ? 'Medium' : 'High'
          }));
          setReports(formattedReports);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(report => 
      report.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const handleNewAnalysis = () => {
    navigate('/');
  };

  const handleViewReport = async (id) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/report/${id}`);
      if (res.ok) {
        const reportData = await res.json();
        navigate('/intelligence-report', { state: { report: reportData } });
      } else {
        alert("Failed to load report from server.");
      }
    } catch (err) {
      console.error("Error loading report:", err);
      alert("Failed to load report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative font-sans text-foreground">
      <Header onNewAnalysis={handleNewAnalysis} />

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
              <span>Loading Dashboard...</span>
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
            label="Opportunity Index" 
            value={kpiStats.viableIdeas} 
            icon="lucide:rocket" 
            colorClass="text-secondary" 
            bgClass="bg-secondary/10" 
            suffix="/100"
          />
          <KPICard 
            label="Risk Average" 
            value={kpiStats.highRisk} 
            icon="lucide:shield" 
            colorClass="text-destructive" 
            bgClass="bg-destructive/10" 
            suffix="/100"
          />
        </div>

        {/* Trend Chart */}
        <TrendChart reports={reports} />

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

      {/* Footer / Bottom Nav for Mobile */}
      <footer className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-border/60 py-4 px-6 md:hidden">
        <div className="flex justify-around items-center">
          <button onClick={() => navigate('/history-dashboard')} className="flex flex-col items-center gap-1 text-primary">
            <Icon icon="lucide:layout-dashboard" className="text-xl" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-muted-foreground">
            <Icon icon="lucide:plus-circle" className="text-xl" />
            <span className="text-[10px] font-bold">New</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HistoryDashboard;
