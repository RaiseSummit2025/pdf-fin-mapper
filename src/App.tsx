
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Toaster } from '@/components/ui/toaster';
import { FinancialDataProvider } from '@/contexts/FinancialDataContext';
import Index from '@/pages/Index';
import UploadPage from '@/pages/UploadPage';
import MappingPage from '@/pages/MappingPage';
import FinancialStatementsPage from '@/pages/FinancialStatementsPage';
import DataPage from '@/pages/DataPage';
import ChatPage from '@/pages/ChatPage';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <FinancialDataProvider>
      <Router>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/mapping" element={<MappingPage />} />
                <Route path="/statements" element={<FinancialStatementsPage />} />
                <Route path="/data" element={<DataPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </SidebarProvider>
      </Router>
    </FinancialDataProvider>
  );
}

export default App;
