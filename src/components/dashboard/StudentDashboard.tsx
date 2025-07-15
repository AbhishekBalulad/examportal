
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Clock, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getExamsForStudent } from "@/services/ExamService";
import { Analysis } from "./StudentDashboard/Analysis";
import { Results } from "./StudentDashboard/Results";
import { MyExams } from "./StudentDashboard/MyExams";
import { HelpDialog } from "./StudentDashboard/HelpDialog";

export function StudentDashboard() {
  const [view, setView] = useState<"dashboard" | "results" | "myexams">("dashboard");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === "/dashboard/results") {
      setView("results");
    } else if (location.pathname === "/dashboard/myexams") {
      setView("myexams");
    } else {
      setView("dashboard");
    }
  }, [location]);

  const user = localStorage.getItem('examUser');
  const userData = user ? JSON.parse(user) : null;

  if (!userData) {
    return null;
  }

  const renderContent = () => {
    switch (view) {
      case "results":
        return <Results studentId={userData.id} />;
      case "myexams":
        return <MyExams studentId={userData.id} />;
      default:
        return <Analysis studentId={userData.id} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => setHelpDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Get Help
        </Button>
      </div>
      {renderContent()}
      <HelpDialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        studentId={userData.id}
        studentName={userData.name}
        studentEmail={userData.email}
      />
    </div>
  );
}
