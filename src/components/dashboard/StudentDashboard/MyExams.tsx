
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getExamsForStudent } from "@/services/ExamService";
import { get, ref } from "firebase/database";
import { db } from "@/config/firebase"; 

interface MyExamsProps {
  studentId: string;
}

export function MyExams({ studentId }: MyExamsProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<{ [key: string]: string }>({}); 

  useEffect(() => {
    const fetchExams = async () => {
      const studentExams = await getExamsForStudent(studentId);
      setExams(studentExams);
      setLoading(false);
    };

    fetchExams();
    
    // Set up an interval to refresh exam status every minute
    const intervalId = setInterval(fetchExams, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [studentId]);

  const handleStartExam = (examId: string) => {
    toast({
      title: "Starting exam",
      description: "Preparing your exam environment...",
    });
    navigate(`/exam/take/${examId}`);
  };

  const fetchTeacherName = async (teacherId: string) => {
    const userRef = ref(db, `users/${teacherId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.name; // Return teacher's name
    }
    return "Not specified";
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      const newTeachers: { [key: string]: string } = {};

      for (const exam of exams) {
        if (exam.createdBy && !newTeachers[exam.createdBy]) {
          const teacherName = await fetchTeacherName(exam.createdBy);
          newTeachers[exam.createdBy] = teacherName;
        }
      }

      setTeachers(newTeachers); // Update state with teacher names
    };

    if (exams.length > 0) {
      fetchTeachers();
    }
  }, [exams]);

  // Filter exams by status
  const upcomingExams = exams.filter(e => e.status === "scheduled");
  const availableExams = exams.filter(e => e.status === "active");
  const completedExams = exams.filter(e => e.status === "completed");

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground mt-2">Loading your exams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Available Exams"
          value={availableExams.length}
          description="Exams ready to take"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Upcoming Exams"
          value={upcomingExams.length}
          description="Scheduled in your calendar"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Completed Exams"
          value={completedExams.length}
          description="Finished assessments"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      {availableExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Available Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableExams.map((exam) => {
            const stDate = new Date(exam.startDate);
            const teacherName = teachers[exam.createdBy] || "Not specified";
            return (
              <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>{exam.subject}</CardDescription>
                    </div>
                    <Badge className="bg-exam-success">Available</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Date & Time:</span> {" "}
                      {stDate.toLocaleDateString()} at{" "}
                      {stDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Duration:</span> {exam.duration} minutes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Teacher:</span> {teacherName || "Not specified"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button className="w-full" onClick={() => handleStartExam(exam.id)}>
                    Start Exam
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          </div>
        </div>
      )}

      {upcomingExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingExams.map((exam) => {
              const teacherName = teachers[exam.createdBy] || "Not specified";
              const stDate = new Date(exam.startDate);
              return (
                <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.subject}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-exam-primary text-exam-primary">
                        Upcoming
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Date & Time:</span> {" "}
                        {stDate.toLocaleDateString()} at{" "}
                        {stDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Duration:</span> {exam.duration} minutes
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Teacher:</span> {teacherName || "Not specified"}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button disabled variant="outline" className="w-full">
                      Not Yet Available
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {completedExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Completed Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedExams.map((exam) => (
              <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>{exam.subject}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Date Taken:</span> {" "}
                      {exam.submissions && exam.submissions[studentId]?.startTime ? 
                        new Date(exam.submissions[studentId].startTime).toLocaleDateString() : 
                        "Unknown date"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Score:</span>
                        <span>{exam.submissions && exam.submissions[studentId]?.percentage ? 
                          `${exam.submissions[studentId].percentage}%` : 
                          (exam.score !== undefined ? `${exam.score}%` : "N/A")}</span>
                      </div>
                      <Progress 
                        value={exam.submissions ? 
                          exam.submissions[studentId]?.percentage || exam.score || 0 : 
                          exam.score || 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate(`/dashboard/results`)}
                  >
                    View Results
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {exams.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No exams assigned to you yet.</p>
        </div>
      )}
    </div>
  );
}
