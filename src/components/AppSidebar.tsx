import { BarChart3, FileText, Settings, Upload, Database, Bot } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: BarChart3,
  },
  {
    title: 'Financial Statements',
    url: '/statements',
    icon: FileText,
  },
  {
    title: 'Mapping',
    url: '/mapping', 
    icon: Settings,
  },
  {
    title: 'Underlying Data',
    url: '/data',
    icon: Database,
  },
  {
    title: 'Upload PDF',
    url: '/upload',
    icon: Upload,
  },
  {
    title: 'AI Chatbot',
    url: '/chat',
    icon: Bot,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="w-64 border-r border-border bg-card">
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Financial DD Tool
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Due Diligence Analysis
          </p>
        </div>
        
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
