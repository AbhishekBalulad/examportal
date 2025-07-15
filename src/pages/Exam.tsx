
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { ExamCreator } from "@/components/exams/ExamCreator";
import { ExamMonitor } from "@/components/exams/ExamMonitor";
import ExamTaker from "@/components/exams/ExamTaker";
import { checkUserRole } from "@/services/AuthService";

interface ExamProps {
  action?: "create" | "monitor" | "take";
}

const Exam = ({ action: propAction }: ExamProps) => {
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const { action: urlAction, id } = useParams<{ action?: string; id?: string }>();
  const navigate = useNavigate();
  
  // Use the action from props or from URL params
  const action = propAction || urlAction;

  useEffect(() => {
    const fetchUserRole = async () => {
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

  // Prevent unauthorized access based on role and action
  useEffect(() => {
    if (loading) return;

    const validateAccess = () => {
      // Create action is only for teachers and admins
      if (action === "create" && userRole !== "teacher" && userRole !== "admin") {
        navigate("/dashboard");
        return;
      }

      // Monitor action is only for teachers and admins
      if (action === "monitor" && userRole !== "teacher" && userRole !== "admin") {
        navigate("/dashboard");
        return;
      }

      // Take action is only for students
      if (action === "take" && userRole !== "student") {
        navigate("/dashboard");
        return;
      }
    };

    validateAccess();
  }, [action, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Render appropriate component based on action
  const renderComponent = () => {
    switch (action) {
      // case "create":
      //   return <ExamCreator />;
      case "monitor":
        return <ExamMonitor examId={id} />;
      case "take":
        return <ExamTaker examId={id} />;
      default:
        // Redirect to dashboard if action is invalid
        navigate("/dashboard");
        return null;
    }
  };

  // Log the action and ID for debugging purposes
  console.log("Exam component - action:", action, "id:", id);

  return renderComponent();
};

export default Exam;
