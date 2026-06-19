import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import 1IdeaInput from './pages/1IdeaInput';
import 2AIProcessing from './pages/2AIProcessing';
import 3IntelligenceReport from './pages/3IntelligenceReport';
import 4HistoryDashboard from './pages/4HistoryDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-1 px-4 h-12">
        <NavLink to="/" className={({ isActive }) => isActive ? 'px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary' : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'}>New Idea</NavLink>
        <NavLink to="/ai-processing" className={({ isActive }) => isActive ? 'px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary' : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'}>Processing</NavLink>
        <NavLink to="/intelligence-report" className={({ isActive }) => isActive ? 'px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary' : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'}>Report</NavLink>
        <NavLink to="/history-dashboard" className={({ isActive }) => isActive ? 'px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary' : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'}>History</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<1IdeaInput />} />
        <Route path="/ai-processing" element={<2AIProcessing />} />
        <Route path="/intelligence-report" element={<3IntelligenceReport />} />
        <Route path="/history-dashboard" element={<4HistoryDashboard />} />
        <Route path="/" element={<1IdeaInput />} />
      </Routes>
    </BrowserRouter>
  );
}
