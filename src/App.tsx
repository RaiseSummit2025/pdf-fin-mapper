
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import Index from "./pages/Index";
import FinancialStatementsPage from "./pages/FinancialStatementsPage";
import MappingPage from "./pages/MappingPage";
import DataPage from "./pages/DataPage";
import UploadPage from "./pages/UploadPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FinancialDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar />
              <main className="flex-1 p-6 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/statements" element={<FinancialStatementsPage />} />
                  <Route path="/mapping" element={<MappingPage />} />
                  <Route path="/data" element={<DataPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </FinancialDataProvider>
  </QueryClientProvider>
);

export default App;
