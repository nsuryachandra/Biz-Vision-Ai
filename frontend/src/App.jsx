import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IdeaInput from './pages/IdeaInput';
import AIProcessing from './pages/AIProcessing';
import IntelligenceReport from './pages/IntelligenceReport';
import HistoryDashboard from './pages/HistoryDashboard';
import CustomCursor from './components/CustomCursor';

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<IdeaInput />} />
        <Route path="/ai-processing" element={<AIProcessing />} />
        <Route path="/intelligence-report" element={<IntelligenceReport />} />
        <Route path="/history-dashboard" element={<HistoryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
