
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { Schedule } from "@/components/dashboard/TeacherDashboard/Schedule";
import { NoticeBoard } from "@/components/dashboard/TeacherDashboard/NoticeBoard";
import { Support } from "@/components/dashboard/TeacherDashboard/Support";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { StudentNoticeBoard } from "@/components/dashboard/StudentDashboard/NoticeBoard";
import { checkUserRole } from "@/services/AuthService";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { section } = useParams();

  useEffect(() => {
    const fetchUserRole = async () => {
      // First check from localStorage for admin user
      const storedUser = localStorage.getItem("examUser");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.role) {
            setUserRole(user.role);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
      
      // If not found in localStorage or parsing failed, check with the service
      const role = await checkUserRole();
      
      if (!role) {
        // User is not authenticated, redirect to login
        navigate("/");
        return;
      }
      
      setUserRole(role);
      setLoading(false);
    };

    fetchUserRole();
  }, [navigate]);

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        // Pass the section parameter to AdminDashboard for all sections
        return <AdminDashboard section={section} />;
      case "teacher":
        if (section === "schedule") {
          return <Schedule />;
        } else if (section === "notices") {
          return <NoticeBoard />;
        } else if (section === "support") {
          return <Support />;
        } else if (section === "exams") {
          return <TeacherDashboard section={section} />;
        } else {
          return <TeacherDashboard section={section} />;
        }
      case "student":
        if (section === "notices") {
          return <StudentNoticeBoard />;
        } else {
          return <StudentDashboard />;
        }
      default:
        return (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
