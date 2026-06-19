import React, { useState, useEffect, useRef, useCallback } from 'react';
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
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Interfaces ---

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: string;
  colorClass: string;
  bgClass: string;
}

interface CompetitorProps {
  initials: string;
  name: string;
  rating: number;
  reviews: string;
  badge?: string;
  tags: { label: string; type: 'success' | 'destructive' }[];
  colorClass: string;
}

interface ProductDemandProps {
  name: string;
  price: string;
  percentage: number;
  demandLevel: string;
  colorClass: string;
}

// --- Sub-components ---

const ReportHeader: React.FC<{
  title: string;
  isSaved: boolean;
  onSave: () => void;
  onDownload: () => void;
  onShare: () => void;
  isLoading: boolean;
}> = ({ title, isSaved, onSave, onDownload, onShare, isLoading }) => (
  <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <Icon icon="lucide:sparkles" className="text-white text-sm" />
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Intelligence Report</span>
          <span className="text-sm font-semibold truncate max-w-[200px] md:max-w-md">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onDownload}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm font-medium transition-colors"
        >
          <Icon icon="lucide:download" /> PDF
        </button>
        <button 
          onClick={onShare}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm font-medium transition-colors"
        >
          <Icon icon="lucide:share-2" /> Share
        </button>
        <button 
          onClick={onSave}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all",
            isSaved 
              ? "bg-success/10 text-success border border-success/20" 
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          <Icon icon={isSaved ? "lucide:check" : "lucide:save"} />
          {isLoading ? "Saving..." : isSaved ? "Saved" : "Save to Workspace"}
        </button>
      </div>
    </div>
  </header>
);

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, trend, colorClass, bgClass }) => (
  <div className="bg-card border border-border/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-colors opacity-10", bgClass)}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgClass, colorClass)}>
        <Icon icon={icon} className="text-xl" />
      </div>
      {trend && (
        <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-md flex items-center gap-1">
          <Icon icon="lucide:trending-up" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-3xl font-extrabold text-foreground">{value}</h3>
        {subtitle && <span className="text-sm text-muted-foreground font-medium">{subtitle}</span>}
      </div>
    </div>
  </div>
);

const ExecutiveSummary: React.FC = () => (
  <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 lg:col-span-2 flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center">
        <Icon icon="lucide:file-text" className="text-2xl text-tertiary" />
      </div>
      <div>
        <h3 className="text-2xl font-extrabold tracking-tight">Executive Summary</h3>
        <p className="text-sm text-muted-foreground font-medium">AI Consulting Insight</p>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-2xl leading-relaxed text-foreground font-light mb-8">
        "This startup shows <strong className="font-bold text-primary">strong market demand</strong> with manageable competition and <strong className="font-bold text-tertiary">high product demand signals</strong>. Risk remains moderate, and growth potential is highly promising over the next 24 months."
      </p>
      
      <div className="flex flex-wrap gap-3">
        {["Favorable Demographics", "Low Entry Barrier", "High Margin Potential"].map((tag) => (
          <div key={tag} className="flex items-center gap-2 text-sm font-semibold text-foreground bg-muted/50 border border-border px-4 py-2 rounded-lg">
            <Icon icon="lucide:check-circle-2" className="text-success" /> {tag}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ViabilityScore: React.FC<{ score: number }> = ({ score }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 flex flex-col items-center justify-center relative overflow-hidden">
      <h3 className="text-lg font-bold text-foreground mb-6 text-center w-full">Overall Viability</h3>
      
      <div className="relative w-52 h-52 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8" 
            className="text-tertiary drop-shadow-md transition-all duration-1000 ease-out" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold tracking-tighter text-foreground">{score}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Score</span>
        </div>
      </div>
      
      <div className="w-full grid grid-cols-2 gap-4">
        <div className="text-center bg-muted/30 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Demand</p>
          <p className="text-lg font-extrabold text-tertiary">91<span className="text-xs text-muted-foreground font-medium">/100</span></p>
        </div>
        <div className="text-center bg-muted/30 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Risk</p>
          <p className="text-lg font-extrabold text-success">14<span className="text-xs text-muted-foreground font-medium">/100</span></p>
        </div>
      </div>
    </div>
  );
};

const MarketIntelligenceChart: React.FC<{ 
  timeRange: string; 
  onRangeChange: (range: string) => void;
}> = ({ timeRange, onRangeChange }) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  const data: ChartData<"line"> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Search Interest',
        data: [45, 52, 48, 61, 59, 75, 82, 80, 88, 95, 91, 100],
        borderColor: '#06B6D4',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return undefined;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#06B6D4',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
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
        ticks: { font: { family: 'Inter', weight: '500' }, color: '#64748B', stepSize: 20 },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Icon icon="lucide:line-chart" className="text-xl text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Market Intelligence</h3>
            <p className="text-sm text-muted-foreground font-medium">Search volume & industry growth trends</p>
          </div>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border self-start">
          {['12M', '5Y', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                timeRange === range ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80 w-full overflow-hidden relative">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

const CompetitorIntelligence: React.FC = () => {
  const competitors: CompetitorProps[] = [
    {
      initials: 'PB',
      name: 'Pawsome Bites',
      rating: 4.8,
      reviews: '2.4k',
      badge: 'Market Leader',
      colorClass: 'bg-primary',
      tags: [
        { label: 'Brand Loyalty', type: 'success' },
        { label: 'High Price', type: 'destructive' }
      ]
    },
    {
      initials: 'GN',
      name: 'GreenNose',
      rating: 4.2,
      reviews: '842',
      colorClass: 'bg-secondary',
      tags: [
        { label: 'Eco-friendly', type: 'success' },
        { label: 'Limited Range', type: 'destructive' }
      ]
    }
  ];

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Icon icon="lucide:crosshair" className="text-xl text-amber-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">Competitor Intelligence</h3>
          <p className="text-sm text-muted-foreground font-medium">Top players in the region</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {competitors.map((comp, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-border/50 hover:shadow-md transition-shadow bg-background/50">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold text-sm", comp.colorClass)}>
                  {comp.initials}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{comp.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-0.5">
                    <Icon icon="lucide:star" /> {comp.rating} <span className="text-muted-foreground font-medium">({comp.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              {comp.badge && (
                <span className="bg-muted text-foreground px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  {comp.badge}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {comp.tags.map((tag, tIdx) => (
                <span 
                  key={tIdx} 
                  className={cn(
                    "text-[10px] px-2 py-1 rounded font-bold",
                    tag.type === 'success' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductDemandAnalysis: React.FC = () => {
  const products: ProductDemandProps[] = [
    {
      name: 'Grain-Free Chicken Kibble',
      price: '₹1,200 avg',
      percentage: 83,
      demandLevel: 'Very High Demand',
      colorClass: 'bg-tertiary'
    },
    {
      name: 'Organic Salmon Treats',
      price: '₹450 avg',
      percentage: 66,
      demandLevel: 'High Demand',
      colorClass: 'bg-secondary'
    }
  ];

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
          <Icon icon="lucide:shopping-bag" className="text-xl text-tertiary" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">Product Demand</h3>
          <p className="text-sm text-muted-foreground font-medium">Shopping interest analysis</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {products.map((prod, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>{prod.name}</span>
              <span className={cn(prod.colorClass.replace('bg-', 'text-'))}>{prod.price}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
              <div className={cn("h-full rounded-full", prod.colorClass)} style={{ width: `${prod.percentage}%` }}></div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider text-right">{prod.demandLevel}</p>
          </div>
        ))}

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Validated Names</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm flex items-center gap-1.5">
              <Icon icon="lucide:check-circle-2" className="text-xs" /> NaturaPet.com
            </span>
            <span className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-semibold border border-border">Pawganic.in</span>
            <span className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-semibold border border-border">EarthBowls.co</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinalRecommendation: React.FC<{ 
  onGenerate: () => void; 
  onSave: () => void;
  isLoading: boolean;
}> = ({ onGenerate, onSave, isLoading }) => (
  <div className="bg-primary rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-white">
    <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary/40 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/30 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/4"></div>
    
    <div className="relative z-10 flex-1">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase">
          Final Verdict
        </span>
        <span className="flex items-center gap-1 text-success font-bold text-sm">
          <Icon icon="lucide:shield-check" className="text-lg" /> 82% Confidence
        </span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Proceed with Launch</h2>
      
      <p className="text-lg text-white/80 max-w-2xl leading-relaxed font-light">
        Strong market demand, growing trends, and healthy product demand signals indicate a highly favorable environment for this business model in your target region.
      </p>
    </div>

    <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
      <button 
        onClick={onGenerate}
        disabled={isLoading}
        className="bg-white text-primary hover:bg-white/90 px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
      >
        <Icon icon={isLoading ? "lucide:loader-2" : "lucide:rocket"} className={cn("text-xl", isLoading && "animate-spin")} />
        {isLoading ? "Generating Plan..." : "Generate Business Plan"}
      </button>
      <button 
        onClick={onSave}
        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <Icon icon="lucide:bookmark" /> Save Report
      </button>
    </div>
  </div>
);

// --- Main Component ---

const IntelligenceReport: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('12M');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleDownloadPDF = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Report downloaded successfully as PDF.');
    }, 1500);
  }, []);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Report link copied to clipboard!');
    });
  }, []);

  const handleSaveToWorkspace = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(prev => !prev);
    }, 1000);
  }, []);

  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
    // In a real app, this would trigger a data fetch
  }, []);

  const handleGenerateBusinessPlan = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Business Plan generation started! You will be notified when it is ready.');
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative font-sans text-foreground">
      <ReportHeader 
        title="Organic Pet Food in Hyderabad" 
        isSaved={isSaved}
        onSave={handleSaveToWorkspace}
        onDownload={handleDownloadPDF}
        onShare={handleShare}
        isLoading={isLoading}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 space-y-8 pb-32">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <KPICard 
            title="Health Score" 
            value={82} 
            subtitle="/100" 
            icon="lucide:activity" 
            trend="Top 5%" 
            colorClass="text-tertiary" 
            bgClass="bg-tertiary/10" 
          />
          <KPICard 
            title="Market Demand" 
            value="High" 
            icon="lucide:bar-chart-3" 
            colorClass="text-secondary" 
            bgClass="bg-secondary/10" 
          />
          <KPICard 
            title="Competition" 
            value="Medium" 
            icon="lucide:swords" 
            colorClass="text-amber-600" 
            bgClass="bg-amber-500/10" 
          />
          <KPICard 
            title="Risk Level" 
            value="Low" 
            icon="lucide:shield-check" 
            colorClass="text-success" 
            bgClass="bg-success/10" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ExecutiveSummary />
          <ViabilityScore score={82} />
        </div>

        {/* Market Intelligence Chart */}
        <MarketIntelligenceChart 
          timeRange={selectedTimeRange} 
          onRangeChange={handleTimeRangeChange} 
        />

        {/* Competitor & Product Demand Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CompetitorIntelligence />
          <ProductDemandAnalysis />
        </div>

        {/* Final Recommendation */}
        <FinalRecommendation 
          onGenerate={handleGenerateBusinessPlan} 
          onSave={handleSaveToWorkspace}
          isLoading={isGenerating}
        />

      </main>

      {/* Mobile Action Bar (Optional enhancement) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 flex gap-3 z-40">
        <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted font-bold text-sm">
          <Icon icon="lucide:download" /> PDF
        </button>
        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted font-bold text-sm">
          <Icon icon="lucide:share-2" /> Share
        </button>
      </div>
    </div>
  );
};

export default IntelligenceReport;