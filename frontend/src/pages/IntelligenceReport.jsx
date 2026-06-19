import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

const ReportHeader = ({ isSaved, onSave, onDownload, onShare, isLoading }) => (
  <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/history-dashboard" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-foreground transition-colors">
          <Icon icon="lucide:arrow-left" className="text-xl" />
        </Link>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Intelligence Report</span>
          <span className="text-sm font-bold text-indigo-600">BizVision AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onDownload}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm font-medium transition-colors"
        >
          <Icon icon="lucide:download" className="text-indigo-600" /> PDF
        </button>
        <button 
          onClick={onShare}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm font-medium transition-colors"
        >
          <Icon icon="lucide:share-2" className="text-indigo-600" /> Share
        </button>
        <button 
          onClick={onSave}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all",
            isSaved 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          <Icon icon={isSaved ? "lucide:check" : "lucide:save"} />
          {isLoading ? "Saving..." : isSaved ? "Saved" : "Save to Workspace"}
        </button>
      </div>
    </div>
  </header>
);

const KPICard = ({ title, value, subtitle, icon, trend, colorClass, bgClass }) => (
  <div className="bg-card border border-border/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-colors opacity-10", bgClass)}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgClass, colorClass)}>
        <Icon icon={icon} className="text-xl" />
      </div>
      {trend && (
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
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

const ExecutiveSummary = ({ text }) => (
  <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 lg:col-span-2 flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
        <Icon icon="lucide:file-text" className="text-2xl text-indigo-600" />
      </div>
      <div>
        <h3 className="text-2xl font-extrabold tracking-tight">Executive Summary</h3>
        <p className="text-sm text-muted-foreground font-medium">AI Consulting Insight</p>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-lg leading-relaxed text-foreground font-normal mb-8">
        {text}
      </p>
      
      <div className="flex flex-wrap gap-3">
        {["Favorable Demographics", "Low Entry Barrier", "High Margin Potential"].map((tag) => (
          <div key={tag} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-4 py-2 rounded-lg">
            <Icon icon="lucide:check-circle-2" className="text-emerald-500" /> {tag}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ViabilityScore = ({ score, demand, risk }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColorClass = score >= 80 
    ? "text-emerald-500" 
    : score >= 60 
      ? "text-indigo-600" 
      : "text-amber-500";

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
            className={cn("drop-shadow-md transition-all duration-1000 ease-out", strokeColorClass)} 
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
        <div className="text-center bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Demand</p>
          <p className="text-lg font-extrabold text-indigo-600">{demand}<span className="text-xs text-muted-foreground font-medium">/100</span></p>
        </div>
        <div className="text-center bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Risk</p>
          <p className="text-lg font-extrabold text-emerald-600">{risk}<span className="text-xs text-muted-foreground font-medium">/100</span></p>
        </div>
      </div>
    </div>
  );
};

const MarketIntelligenceChart = ({ trends, timeRange, onRangeChange }) => {
  const chartRef = useRef(null);

  const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const defaultPoints = [45, 52, 48, 61, 59, 75, 82, 80, 88, 95, 91, 100];

  const labels = trends && trends.length > 0 ? trends.map(t => t.date) : defaultLabels;
  
  const chartPoints = trends && trends.length > 0 ? trends.map(t => {
    if (t.values && t.values.length > 0) {
      const firstVal = t.values[0];
      const val = Number(firstVal.extracted_value !== undefined ? firstVal.extracted_value : firstVal.value);
      if (!isNaN(val)) return val;
    }
    if (t.value !== undefined && t.value !== null) {
      const val = Number(t.value);
      if (!isNaN(val)) return val;
    }
    return 0;
  }) : defaultPoints;

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Search Interest',
        data: chartPoints,
        borderColor: '#6366F1',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return undefined;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderWidth: 3.5,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#6366F1',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
      },
    ],
  };

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
        ticks: { 
          font: { family: 'Inter', weight: '500', size: 11 }, 
          color: '#64748B',
          maxTicksLimit: 8,
          maxRotation: 0,
          minRotation: 0
        },
      },
      y: {
        grid: { color: '#E2E8F0', borderDash: [5, 5] },
        ticks: { font: { family: 'Inter', weight: '500', size: 11 }, color: '#64748B', stepSize: 20 },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Icon icon="lucide:line-chart" className="text-xl text-indigo-600" />
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

const CompetitorIntelligence = ({ competitors }) => {
  const defaultCompetitors = [
    {
      initials: 'PB',
      name: 'Pawsome Bites',
      rating: 4.8,
      reviews: '2.4k',
      badge: 'Market Leader',
      colorClass: 'bg-indigo-600',
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
      colorClass: 'bg-cyan-500',
      tags: [
        { label: 'Eco-friendly', type: 'success' },
        { label: 'Limited Range', type: 'destructive' }
      ]
    }
  ];

  const mappedCompetitors = competitors && competitors.length > 0
    ? competitors.slice(0, 4).map((c, idx) => ({
        initials: c.title ? c.title.slice(0, 2).toUpperCase() : 'CO',
        name: c.title || 'Competitor',
        rating: Number(c.rating) || 4.0,
        reviews: c.reviews ? String(c.reviews) : '0',
        badge: idx === 0 ? 'Market Leader' : undefined,
        colorClass: idx % 2 === 0 ? 'bg-indigo-600' : 'bg-cyan-500',
        tags: [
          { label: c.address ? c.address.split(',')[0] : 'Local', type: 'success' }
        ]
      }))
    : defaultCompetitors;

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
        {mappedCompetitors.map((comp, idx) => (
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
                <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
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
                    tag.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
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

const ProductDemandAnalysis = ({ isIndia, currencySymbol, currencyUnit, tamVal, samVal, somVal }) => {
  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
          <Icon icon="lucide:shopping-bag" className="text-xl text-cyan-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">Product Demand & TAM</h3>
          <p className="text-sm text-muted-foreground font-medium">Shopping interest & market sizes</p>
        </div>
      </div>

      <div className="space-y-6 flex-1 justify-center flex flex-col">
        <div>
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>TAM (Total Addressable Market)</span>
            <span className="text-indigo-600">{currencySymbol}{tamVal}{currencyUnit}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>SAM (Serviceable Addressable Market)</span>
            <span className="text-cyan-600">{currencySymbol}{samVal}{currencyUnit}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, Math.round((samVal / tamVal) * 100))}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold mb-1">
            <span>SOM (Serviceable Obtainable Market)</span>
            <span className="text-purple-600">{currencySymbol}{somVal}{currencyUnit}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-purple-600" style={{ width: `${Math.min(100, Math.round((somVal / tamVal) * 100))}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrandNameRationale = ({ businessNames }) => {
  const defaultNames = [
    { name: 'NaturaPet.com', brand_uniqueness: 85, popularity: 8, competition: 3, rationale: 'Fits organic positioning perfectly, signaling trust and natural ingredients.' },
    { name: 'Pawganic.in', brand_uniqueness: 72, popularity: 7, competition: 4, rationale: 'Highly relevant regional suffix with direct connection to organic pet lifestyle.' }
  ];

  const names = businessNames && businessNames.length > 0 ? businessNames : defaultNames;

  return (
    <div className="bg-card rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon icon="lucide:tags" className="text-xl text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">AI Suggested Names & Rationale</h3>
          <p className="text-sm text-muted-foreground font-medium">Detailed meaning and target suitability check</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {names.map((n, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-border/50 bg-background/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-lg font-extrabold text-foreground">{n.name}</span>
                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-lg">
                  Uniqueness: {n.brand_uniqueness}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                {n.rationale || "AI validation suggests high relevance and brand potential for your business domain."}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon icon="lucide:star" className="text-amber-500" /> Popularity: {n.popularity}/10
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="lucide:swords" className="text-red-500" /> Competition: {n.competition}/10
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FinalRecommendation = ({ verdict, score, onGenerate, onSave, isLoading }) => (
  <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-white">
    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/25 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/4"></div>
    
    <div className="relative z-10 flex-1">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase">
          Final Verdict
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-bold text-sm bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/25">
          <Icon icon="lucide:shield-check" className="text-lg text-emerald-400" /> {score}% Confidence
        </span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
        {score > 60 ? "Proceed with Launch" : "Proceed with Caution"}
      </h2>
      
      <p className="text-lg text-white/90 max-w-2xl leading-relaxed font-light">
        {verdict}
      </p>
    </div>

    <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
      <button 
        onClick={onGenerate}
        disabled={isLoading}
        className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
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

const IntelligenceReport = () => {
  const location = useLocation();
  const reportPayload = location.state?.report;

  const fallbackReport = {
    metadata: {
      idea_text: 'Organic Pet Food in Hyderabad',
      location: 'Hyderabad, India',
      business_type: 'E-commerce & Manufacturing'
    },
    scores: {
      viability: 82,
      demand: 91,
      opportunity: 88,
      risk: 14,
      competition: 50
    },
    analysis: {
      executive_summary: 'This startup shows strong market demand with manageable competition and high product demand signals. Risk remains moderate, and growth potential is highly promising over the next 24 months.',
      market_analysis: 'The addressable market in Hyderabad is expanding rapidly due to rising disposable income and pet humanization trends.',
      competitor_analysis: 'A few local brands exist but none offer premium organic-certified formulations, presenting a clear market opening.',
      trend_analysis: 'Search query analytics show a consistent 25% year-on-year growth in searches for organic dog food in Telangana.',
      risk_analysis: 'Key exposures include high initial supply chain overhead and ingredient quality assurance standards.',
      final_recommendation: 'Strong market demand, growing trends, and healthy product demand signals indicate a highly favorable environment for this business model.'
    },
    business_names: [
      { name: 'NaturaPet.com', brand_uniqueness: 85, popularity: 8, competition: 3, rationale: 'Premium organic brand name.' },
      { name: 'Pawganic.in', brand_uniqueness: 72, popularity: 7, competition: 4, rationale: 'Highly relevant regional suffix.' }
    ],
    competitors: [
      { title: 'Pawsome Bites', rating: 4.8, reviews: 240, address: 'Jubilee Hills, Hyderabad' },
      { title: 'GreenNose Feeders', rating: 4.2, reviews: 84, address: 'Gachibowli, Hyderabad' }
    ],
    trends: [
      { date: 'Jan', value: 45 },
      { date: 'Feb', value: 52 },
      { date: 'Mar', value: 48 },
      { date: 'Apr', value: 61 },
      { date: 'May', value: 59 },
      { date: 'Jun', value: 75 },
      { date: 'Jul', value: 82 },
      { date: 'Aug', value: 80 },
      { date: 'Sep', value: 88 },
      { date: 'Oct', value: 95 },
      { date: 'Nov', value: 91 },
      { date: 'Dec', value: 100 }
    ]
  };

  const report = reportPayload || fallbackReport;
  const { metadata, scores, analysis, business_names, competitors, trends } = report;

  const [selectedTimeRange, setSelectedTimeRange] = useState('12M');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isIndia = 
    (metadata.location && /india|hyderabad|mumbai|delhi|bangalore|pune|chennai|kolkata/i.test(metadata.location)) ||
    (metadata.idea_text && /india|hyderabad|mumbai|delhi|bangalore|pune|chennai|kolkata/i.test(metadata.idea_text));

  const isLocal = /hotel|veg|restaurant|shop|cafe|store|salon|bakery|dhabha|spa|boutique|delivery/i.test(metadata.idea_text || '');

  let currencySymbol;
  let currencyUnit;
  let tamValue;
  
  if (isIndia) {
    currencySymbol = '₹';
    if (isLocal) {
      tamValue = 25; 
      currencyUnit = ' Cr';
    } else {
      tamValue = 4500; 
      currencyUnit = ' Cr';
    }
  } else {
    currencySymbol = '$';
    if (isLocal) {
      tamValue = 12; 
      currencyUnit = 'M';
    } else {
      tamValue = 84; 
      currencyUnit = 'B';
    }
  }

  const demand = scores?.demand || 50;
  const tamVal = tamValue;
  const samVal = Math.round(tamVal * (demand / 100));
  const somVal = Math.round(samVal * 0.15); 

  const handleDownloadPDF = useCallback(() => {
    window.print();
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
    }, 800);
  }, []);

  const handleTimeRangeChange = useCallback((range) => {
    setSelectedTimeRange(range);
  }, []);

  const handleGenerateBusinessPlan = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Business Plan generation started! Check back shortly.');
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative font-sans text-foreground">
      <ReportHeader 
        isSaved={isSaved}
        onSave={handleSaveToWorkspace}
        onDownload={handleDownloadPDF}
        onShare={handleShare}
        isLoading={isLoading}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 space-y-8 pb-32">
        
        {/* Venture Statement Callout */}
        <div className="p-8 rounded-[2rem] bg-gradient-to-r from-card to-card/50 border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wider">
              <Icon icon="lucide:sparkles" /> Validated Venture Idea
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              "{metadata?.idea_text || 'Startup Concept'}"
            </h1>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Icon icon="lucide:map-pin" className="text-sm text-indigo-600" /> {metadata?.location || 'Global'}</span>
              <span className="flex items-center gap-1"><Icon icon="lucide:briefcase" className="text-sm text-indigo-600" /> {metadata?.business_type || 'General'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-3.5 py-2 rounded-xl self-start md:self-center">
            <Icon icon="lucide:check-circle-2" className="text-sm text-emerald-500" /> AI Validated Pipeline
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <KPICard 
            title="Health Score" 
            value={scores?.viability || 50} 
            subtitle="/100" 
            icon="lucide:activity" 
            trend="Top 5%" 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
          />
          <KPICard 
            title="Market Demand" 
            value={scores?.demand ? `${scores.demand}/100` : "Medium"} 
            icon="lucide:bar-chart-3" 
            colorClass="text-cyan-600" 
            bgClass="bg-cyan-50" 
          />
          <KPICard 
            title="Competition" 
            value={scores?.competition ? `${scores.competition}/100` : "Medium"} 
            icon="lucide:swords" 
            colorClass="text-amber-600" 
            bgClass="bg-amber-500/10" 
          />
          <KPICard 
            title="Risk Level" 
            value={scores?.risk ? `${scores.risk}/100` : "Low"} 
            icon="lucide:shield-check" 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ExecutiveSummary text={analysis?.executive_summary || "No executive summary available."} />
          <ViabilityScore 
            score={scores?.viability || 50} 
            demand={scores?.demand || 50}
            risk={scores?.risk || 20}
          />
        </div>

        {/* Market Intelligence Chart */}
        <MarketIntelligenceChart 
          trends={trends}
          timeRange={selectedTimeRange} 
          onRangeChange={handleTimeRangeChange} 
        />

        {/* Competitor & Product Demand Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CompetitorIntelligence competitors={competitors} />
          <ProductDemandAnalysis 
            isIndia={isIndia}
            currencySymbol={currencySymbol}
            currencyUnit={currencyUnit}
            tamVal={tamVal}
            samVal={samVal}
            somVal={somVal}
          />
        </div>

        {/* Brand Suggested Names & Rationale Card */}
        <BrandNameRationale businessNames={business_names} />

        {/* Final Recommendation */}
        <FinalRecommendation 
          verdict={analysis?.final_recommendation || "Proceed with diligence."}
          score={scores?.viability || 50}
          onGenerate={handleGenerateBusinessPlan} 
          onSave={handleSaveToWorkspace}
          isLoading={isGenerating}
        />

      </main>

      {/* Mobile Action Bar */}
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
