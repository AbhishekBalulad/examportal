
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Menu, Users, Settings, Calendar, BarChart, FileText, Building, Bell, Book, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { logoutUser, getCurrentUser } from "@/services/AuthService";
import { useToast } from "@/hooks/use-toast";
import { ProfileDialog } from "@/components/profile/ProfileDialog";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await logoutUser();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getMenuItems = () => {
    if (!user) return [];

    const commonItems = [
      { title: "Dashboard", icon: BarChart, url: "/dashboard" },
    ];
    
    const adminItems = [
      ...commonItems,
      { title: "Manage Teachers", icon: Users, url: "/dashboard/teachers" },
      { title: "Manage Exams", icon: FileText, url: "/dashboard/adminexams" },
      { title: "Departments", icon: Building, url: "/departments" },
      // { title: "Settings", icon: Settings, url: "/dashboard/settings" },
    ];
    
    const teacherItems = [
      ...commonItems,
      { title: "Students", icon: Users, url: "/dashboard/students" },
      { title: "Exams", icon: FileText, url: "/dashboard/exams" },
      { title: "Schedule", icon: Calendar, url: "/dashboard/schedule" },
      { title: "Notice Board", icon: Bell, url: "/dashboard/notices" },
      { title: "Support", icon: HelpCircle, url: "/dashboard/support" },
    ];
    
    const studentItems = [
      ...commonItems,
      { title: "My Exams", icon: Book, url: "/dashboard/myexams" },
      { title: "Results", icon: FileText, url: "/dashboard/results" },
      { title: "Notice Board", icon: Bell, url: "/dashboard/notices" },
    ];
    
    switch (user.role) {
      case "admin": return adminItems;
      case "teacher": return teacherItems;
      case "student": return studentItems;
      default: return commonItems;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-primary/10 p-1">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold tracking-tight">Secure Exam Portal</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getMenuItems().map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="flex items-center gap-4">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-4">
              <ProfileDialog />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <div className="h-6 w-6 flex items-center justify-center text-primary font-medium">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role || "Loading..."}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <ThemeToggle />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    aria-label="Logout" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="flex items-center h-14 border-b px-4 lg:px-6 gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {user?.role === "admin" ? "Admin Dashboard" : 
                 user?.role === "teacher" ? "Teacher Dashboard" : 
                 user?.role === "student" ? "Student Dashboard" : "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="icon" 
                aria-label="Menu" 
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
